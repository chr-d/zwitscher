using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using ZwitscherApi.Extensions;
using ZwitscherApi.Services;

namespace ZwitscherApi.Endpoints;

public static class LikeEndpoints
{
    public static void MapLikeEndpoints(this RouteGroupBuilder api)
    {
        var likes = api.MapGroup("/posts/{id:guid}/likes/me")
            .WithTags("Likes")
            .RequireAuthorization();

        likes.MapPut("/", LikePost).WithName("LikePost")
            .Produces(StatusCodes.Status401Unauthorized);
        likes.MapDelete("/", UnlikePost).WithName("UnlikePost")
            .Produces(StatusCodes.Status401Unauthorized);
    }

    private static async Task<Results<NoContent, NotFound>> LikePost(
    Guid id, ClaimsPrincipal user, ILikeService likes)
    {
        if (id == Guid.Empty) return TypedResults.NotFound();
        var exists = await likes.LikeAsync(id, user.GetUserId());
        return exists ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<Results<NoContent, NotFound>> UnlikePost(
        Guid id, ClaimsPrincipal user, ILikeService likes)
    {
        if (id == Guid.Empty) return TypedResults.NotFound();
        var exists = await likes.UnlikeAsync(id, user.GetUserId());
        return exists ? TypedResults.NoContent() : TypedResults.NotFound();
    }
}