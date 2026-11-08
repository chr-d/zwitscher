using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using ZwitscherApi.Dtos.Posts;
using ZwitscherApi.Dtos.Users;
using ZwitscherApi.Extensions;
using ZwitscherApi.Services;

namespace ZwitscherApi.Endpoints;

public static class UserEndpoints
{
    public static void MapUserEndpoints(this RouteGroupBuilder app)
    {
        var users = app.MapGroup("/users").WithTags("Users");
        users
            .MapGet("/me", GetCurrentUser)
            .WithName("GetCurrentUser")
            .WithSummary("Get the authenticated user's profile")
            .RequireAuthorization();
        users
            .MapGet("/me/likes", GetLikedPosts)
            .WithName("GetLikedPosts")
            .WithSummary("Get the authenticated user's liked posts")
            .RequireAuthorization()
            .Produces(StatusCodes.Status401Unauthorized);
        users
            .MapGet("/{id}/posts", GetPostsByUser)
            .WithName("GetPostsByUser")
            .WithSummary("Get a user's public profile and posts by ID or username, newest first");
    }

    private static async Task<Results<Ok<CurrentUserResponseDto>, NotFound>> GetCurrentUser(
        ClaimsPrincipal user,
        IUserService userService
    )
    {
        var currentUser = await userService.GetMeAsync(user.GetUserId());
        return currentUser is null ? TypedResults.NotFound() : TypedResults.Ok(currentUser);
    }

    private static async Task<
        Results<Ok<UserPostsResponseDto>, NotFound, ValidationProblem>
    > GetPostsByUser(
        string id,
        ClaimsPrincipal user,
        IUserService userService,
        IPostService postService
    )
    {
        var author = Guid.TryParse(id, out var authorId)
            ? await userService.GetByIdAsync(authorId)
            : await userService.GetByUserNameAsync(id);
        if (author is null)
            return TypedResults.NotFound();
        Guid? currentUserId = user.Identity?.IsAuthenticated == true ? user.GetUserId() : null;
        var result = await postService.GetByUserAsync(author.Id, currentUserId);
        return TypedResults.Ok(
            new UserPostsResponseDto(author, result.Items, result.Page, result.HasMore)
        );
    }

    private static async Task<Results<Ok<PostPageResponseDto>, ValidationProblem>> GetLikedPosts(
        ClaimsPrincipal user,
        IPostService postService
    )
    {
        var result = await postService.GetLikedByUserAsync(user.GetUserId());
        return TypedResults.Ok(result);
    }
}
