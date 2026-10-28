using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using ZwitscherApi.Data;

var builder = WebApplication.CreateBuilder(args);

var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is missing.");

builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite(connectionString));

builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.MapGet(
        "/posts",
        () =>
            TypedResults.Ok(
                new PostResponseDto(
                    Guid.Parse("00000000-0000-0000-0000-000000000101"),
                    "Hello, World!",
                    new AuthorResponseDto(
                        Guid.Parse("00000000-0000-0000-0000-000000000001"),
                        "bob",
                        "Bob"
                    ),
                    new DateTime(2026, 10, 28, 10, 0, 0, DateTimeKind.Utc),
                    null,
                    false,
                    0,
                    false
                )
            )
    )
    .WithTags("Posts")
    .WithName("GetPosts")
    .WithSummary("Return a sample feed for the first frontend/API connection");

app.Run();

record PostResponseDto(
    Guid Id,
    string Content,
    AuthorResponseDto Author,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc,
    bool CanEdit,
    int LikeCount,
    bool LikedByMe
);

record AuthorResponseDto(Guid Id, string Username, string DisplayName);
