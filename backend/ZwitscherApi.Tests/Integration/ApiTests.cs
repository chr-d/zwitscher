using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using ZwitscherApi.Data;
using ZwitscherApi.Dtos.Posts;
using ZwitscherApi.Models;

namespace ZwitscherApi.Tests.Integration;

public class ApiTests : IDisposable
{
    private readonly ApiFactory _factory = new();
    private readonly HttpClient _client;

    public ApiTests()
    {
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task GetPosts_ReturnsPostsNewestFirstWithAuthor()
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var author = new User { UserName = "author", DisplayName = "Author" };
            db.Posts.AddRange(
                new Post
                {
                    Author = author,
                    Content = "Older post",
                    CreatedAtUtc = DateTime.UtcNow.AddDays(-1),
                },
                new Post
                {
                    Author = author,
                    Content = "Newer post",
                    CreatedAtUtc = DateTime.UtcNow.AddDays(1),
                }
            );
            await db.SaveChangesAsync();
        }

        var response = await _client.GetAsync("/api/posts/");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PostPageResponseDto>();
        Assert.NotNull(result);
        Assert.Equal(
            new[] { "Newer post", "Older post" },
            result.Items.Select(post => post.Content)
        );
        Assert.All(result.Items, post => Assert.Equal("author", post.Author.Username));
    }

    public void Dispose()
    {
        _client.Dispose();
        _factory.Dispose();
    }
}
