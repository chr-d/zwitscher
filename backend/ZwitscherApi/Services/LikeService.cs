using Microsoft.EntityFrameworkCore;
using ZwitscherApi.Data;
using ZwitscherApi.Models;

namespace ZwitscherApi.Services;

public class LikeService(AppDbContext db) : ILikeService
{
    public async Task<bool> LikeAsync(Guid postId, Guid userId)
    {
        if (!await db.Posts.AnyAsync(p => p.Id == postId)) return false;

        var like = await db.Likes.FindAsync(postId, userId);
        if (like is null)
        {
            db.Likes.Add(new Like
            {
                PostId = postId,
                UserId = userId,
                CreatedAtUtc = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        }

        return true;
    }

    public async Task<bool> UnlikeAsync(Guid postId, Guid userId)
    {
        if (!await db.Posts.AnyAsync(p => p.Id == postId)) return false;

        var like = await db.Likes.FindAsync(postId, userId);
        if (like is not null)
        {
            db.Likes.Remove(like);
            await db.SaveChangesAsync();
        }

        return true;
    }
}