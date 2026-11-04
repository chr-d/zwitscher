using System.Reflection;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Scalar.AspNetCore;
using ZwitscherApi.Data;
using ZwitscherApi.Endpoints;
using ZwitscherApi.Errors;
using ZwitscherApi.Models;
using ZwitscherApi.Options;
using ZwitscherApi.Services;

var builder = WebApplication.CreateBuilder(args);

// Detect build-time OpenAPI generation so it can run without a real JWT secret
var isOpenApiGeneration = Assembly.GetEntryAssembly()?.GetName().Name == "GetDocument.Insider";

if (isOpenApiGeneration)
{
    builder.Configuration.AddInMemoryCollection(
        new Dictionary<string, string?> { ["Jwt:Key"] = new string('x', 32) }
    );
}

// Check if the database connection string exists before registering
var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is missing.");

// Register SQLite database context
builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite(connectionString));

// Configure IdentityCore
builder
    .Services.AddIdentityCore<User>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyz0123456789_";
        options.Password.RequiredLength = 8;
    })
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<AppDbContext>();

// Bind JWT configurations and validate them when the application starts
builder
    .Services.AddOptions<JwtOptions>()
    .Bind(builder.Configuration.GetSection(JwtOptions.SectionName))
    .ValidateDataAnnotations()
    .Validate(
        options => Encoding.UTF8.GetByteCount(options.Key ?? "") >= 32,
        "JWT signing key must be at least 32 bytes."
    )
    .ValidateOnStart();

// Use JWT bearer tokens as the default authentication scheme
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();

// Configure token validation for signature, issuer, audience, and lifetime
builder
    .Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IOptions<JwtOptions>>(
        (options, jwtOptions) =>
        {
            var jwt = jwtOptions.Value;

            options.MapInboundClaims = false;

            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),

                ValidateIssuer = true,
                ValidIssuer = jwt.Issuer,

                ValidateAudience = true,
                ValidAudience = jwt.Audience,

                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,

                RequireExpirationTime = true,
                RequireSignedTokens = true,
            };
        }
    );

// Register authorization services
builder.Services.AddAuthorization();

// Register application services
builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();

// Register OpenAPI document generation
builder.Services.AddOpenApi(options =>
{
    // Describe the Bearer scheme, so Scalar shows an "Authentication" box for the token.
    options.AddDocumentTransformer(
        (document, context, cancellationToken) =>
        {
            document.Components ??= new OpenApiComponents();
            document.Components.SecuritySchemes ??=
                new Dictionary<string, IOpenApiSecurityScheme>();
            document.Components.SecuritySchemes["Bearer"] = new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                Description =
                    "Paste accessToken returned by POST /api/auth/login or POST /api/auth/refresh",
            };
            return Task.CompletedTask;
        }
    );

    // Mark the endpoints that call RequireAuthorization() as needing the Bearer token.
    options.AddOperationTransformer(
        (operation, context, cancellationToken) =>
        {
            var requiresAuth = context
                .Description.ActionDescriptor.EndpointMetadata.OfType<IAuthorizeData>()
                .Any();

            if (requiresAuth)
            {
                operation.Security ??= [];
                operation.Security.Add(
                    new OpenApiSecurityRequirement
                    {
                        [new OpenApiSecuritySchemeReference("Bearer", context.Document)] = [],
                    }
                );
            }
            return Task.CompletedTask;
        }
    );
});

// Register validation services
builder.Services.AddValidation();

// Register problem-details services
builder.Services.AddProblemDetails();

// Register global exception handler
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

// Register CORS policy to allow local frontend access during development
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowDevFrontend",
        policy =>
        {
            policy
                .WithOrigins("http://localhost:5173", "http://localhost:4173")
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    );
});

var app = builder.Build();

// Enable exception handler middleware
app.UseExceptionHandler();

// Enable local frontend access and API documentation only in development
if (app.Environment.IsDevelopment())
{
    app.UseCors("AllowDevFrontend");
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// Enable authentication and authorization middleware
app.UseAuthentication();
app.UseAuthorization();

// Group and register the API endpoints under /api
var api = app.MapGroup("/api");
api.MapPostEndpoints();
api.MapAuthEndpoints();
api.MapUserEndpoints();

app.Run();
