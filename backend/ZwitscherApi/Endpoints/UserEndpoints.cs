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
            .MapGet("/{id:guid}/posts", GetPostsByUser)
            .WithName("GetPostsByUser")
            .WithSummary("Get a list of a users posts, newest first");
        users
            .MapGet("/likedposts", GetLikedPosts)
            .WithName("GetLikedPostsByUser")
            .WithSummary("Get a list of a users liked posts, newest first")
            .RequireAuthorization();
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
        Results<Ok<PostPageResponseDto>, NotFound, ValidationProblem>
    > GetPostsByUser(
        Guid id,
        ClaimsPrincipal user,
        IUserService userService,
        IPostService postService
    )
    {
        var author = await userService.GetByIdAsync(id);
        if (author is null)
            return TypedResults.NotFound();
        Guid? currentUserId = user.Identity?.IsAuthenticated == true ? user.GetUserId() : null;
        var result = await postService.GetByUserAsync(id, currentUserId);
        return TypedResults.Ok(result);
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
