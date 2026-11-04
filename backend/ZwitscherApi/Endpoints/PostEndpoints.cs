using Microsoft.AspNetCore.Http.HttpResults;
using ZwitscherApi.Dtos.Posts;
using ZwitscherApi.Services;

namespace ZwitscherApi.Endpoints;

public static class PostEndpoints
{
    public static void MapPostEndpoints(this RouteGroupBuilder app)
    {
        var posts = app.MapGroup("/posts").WithTags("Posts");
        posts
            .MapGet("/", GetPosts)
            .WithName("GetPosts")
            .WithSummary("Get a list of posts, newest first");
    }

    private static async Task<Ok<PostPageResponseDto>> GetPosts(IPostService postService)
    {
        var feed = await postService.GetFeedAsync();
        return TypedResults.Ok(feed);
    }
}
