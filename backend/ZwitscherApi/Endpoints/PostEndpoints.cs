using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using ZwitscherApi.Dtos.Posts;
using ZwitscherApi.Extensions;
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
        posts
            .MapPost("/", CreatePost)
            .WithName("CreatePost")
            .WithSummary("Create one new Post")
            .RequireAuthorization();
        posts
            .MapPut("/{id:guid}", UpdatePost)
            .WithName("UpdatePost")
            .WithSummary("Update a post")
            .RequireAuthorization();
    }

    private static async Task<Ok<PostPageResponseDto>> GetPosts(
        ClaimsPrincipal user,
        IPostService postService
    )
    {
        Guid? currentUserId = user.Identity?.IsAuthenticated == true ? user.GetUserId() : null;
        var feed = await postService.GetFeedAsync(currentUserId);
        return TypedResults.Ok(feed);
    }

    private static async Task<Results<Created<PostResponseDto>, UnauthorizedHttpResult>> CreatePost(
        ClaimsPrincipal author,
        CreatePostRequestDto content,
        IPostService postService
    )
    {
        Guid authorId = author.GetUserId();
        var post = await postService.CreateAsync(authorId, content); //may need to add an error for maxlength
        if (post == null)
        {
            return TypedResults.Unauthorized();
        }
        return TypedResults.Created($"/api/posts/{post.Id}", post);
    }

    private static async Task<
        Results<Ok<PostResponseDto>, ValidationProblem, NotFound, ForbidHttpResult>
    > UpdatePost(Guid id, UpdatePostRequestDto dto, ClaimsPrincipal user, IPostService posts)
    {
        if (id == Guid.Empty)
            return TypedResults.NotFound();
        var content = dto.Content?.Trim() ?? "";
        if (content.Length is < 2 or > 300)
            return TypedResults.ValidationProblem(
                new Dictionary<string, string[]>
                {
                    ["Content"] = ["Content must contain 2-300 characters."],
                }
            );

        var result = await posts.UpdateAsync(id, user.GetUserId(), content);
        if (!result.Found)
            return TypedResults.NotFound();
        if (!result.Allowed)
            return TypedResults.Forbid();
        return result.Post is null ? TypedResults.NotFound() : TypedResults.Ok(result.Post);
    }
}
