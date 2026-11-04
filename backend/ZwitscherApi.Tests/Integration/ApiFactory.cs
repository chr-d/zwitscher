using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using ZwitscherApi.Data;

namespace ZwitscherApi.Tests.Integration;

public sealed class ApiFactory : WebApplicationFactory<Program>
{
    public const int AccessExpiryMinutes = 10;
    public const int RefreshExpiryDays = 2;
    private readonly string _databaseName = $"ZwitscherTests-{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration(configuration =>
            configuration.AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["Jwt:Key"] = new string('x', 64),
                    ["Jwt:ExpiryMinutes"] = AccessExpiryMinutes.ToString(),
                    ["Jwt:RefreshTokenExpiryDays"] = RefreshExpiryDays.ToString(),
                }
            )
        );
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(_databaseName)
            );
        });
    }
}
