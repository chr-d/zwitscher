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
            .RequireAuthorization()
            .MapGet("/me", GetCurrentUser)
            .WithName("GetCurrentUser")
            .WithSummary("Get the authenticated user's profile");
        users
            .MapGet("/me/likes", GetLikedPosts)
            .WithName("GetLikedPosts")
            .WithSummary("Get the authenticated user's liked posts")
            .RequireAuthorization()
            .Produces(StatusCodes.Status401Unauthorized);
    }

    private static async Task<Results<Ok<CurrentUserResponseDto>, NotFound>> GetCurrentUser(
        ClaimsPrincipal user,
        IUserService userService
    )
    {
        var currentUser = await userService.GetMeAsync(user.GetUserId());
        return currentUser is null ? TypedResults.NotFound() : TypedResults.Ok(currentUser);
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
