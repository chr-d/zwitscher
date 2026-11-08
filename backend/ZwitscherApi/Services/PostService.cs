using Microsoft.EntityFrameworkCore;
using ZwitscherApi.Data;
using ZwitscherApi.Dtos.Posts;
using ZwitscherApi.Models;

namespace ZwitscherApi.Services;

public class PostService(AppDbContext db) : IPostService
{
    public async Task<PostPageResponseDto> GetFeedAsync(Guid? userId)
    {
        var items = await db
            .Posts.AsNoTracking()
            .OrderByDescending(p => p.CreatedAtUtc)
            .Select(p => new PostResponseDto(
                p.Id,
                p.Content,
                new AuthorResponseDto(p.Author.Id, p.Author.UserName!, p.Author.DisplayName),
                p.CreatedAtUtc,
                p.UpdatedAtUtc,
                userId.HasValue && p.AuthorId == userId.Value,
                p.Likes.Count,
                userId.HasValue && p.Likes.Any(l => l.UserId == userId.Value)
            ))
            .ToListAsync();
        return new PostPageResponseDto(items, 1, false); //TODO: implement paging logic
    }

    public async Task<PostResponseDto?> CreateAsync(Guid authorId, CreatePostRequestDto content)
    {
        var post = new Post { AuthorId = authorId, Content = content.Content };

        db.Posts.Add(post);
        await db.SaveChangesAsync();
        return await GetByIdAsync(post.Id, authorId);
    }

    public async Task<PostResponseDto?> GetByIdAsync(Guid id, Guid? userId)
    {
        return await db
            .Posts.AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new PostResponseDto(
                p.Id,
                p.Content,
                new AuthorResponseDto(p.Author.Id, p.Author.UserName!, p.Author.DisplayName),
                p.CreatedAtUtc,
                p.UpdatedAtUtc,
                userId.HasValue && p.AuthorId == userId.Value,
                p.Likes.Count,
                userId.HasValue && p.Likes.Any(l => l.UserId == userId.Value)
            ))
            .FirstOrDefaultAsync();
    }

    public async Task<PostPageResponseDto> GetByUserAsync(Guid authorId, Guid? userId)
    {
        var items = await db
            .Posts.AsNoTracking()
            .Where(p => p.AuthorId == authorId)
            .OrderByDescending(p => p.CreatedAtUtc)
            .Select(p => new PostResponseDto(
                p.Id,
                p.Content,
                new AuthorResponseDto(p.Author.Id, p.Author.UserName!, p.Author.DisplayName),
                p.CreatedAtUtc,
                p.UpdatedAtUtc,
                userId.HasValue && p.AuthorId == userId.Value,
                p.Likes.Count,
                userId.HasValue && p.Likes.Any(l => l.UserId == userId.Value)
            ))
            .ToListAsync();
        return new PostPageResponseDto(items, 1, false); //TODO: implement paging logic
    }

    public async Task<PostPageResponseDto> GetLikedByUserAsync(Guid userId)
    {
        var items = await db
            .Posts.AsNoTracking()
            .Where(p => p.Likes.Any(l => l.UserId == userId))
            .OrderByDescending(p => p.CreatedAtUtc)
            .Select(p => new PostResponseDto(
                p.Id,
                p.Content,
                new AuthorResponseDto(p.Author.Id, p.Author.UserName!, p.Author.DisplayName),
                p.CreatedAtUtc,
                p.UpdatedAtUtc,
                p.AuthorId == userId,
                p.Likes.Count,
                p.Likes.Any(l => l.UserId == userId)
            ))
            .ToListAsync();
        return new PostPageResponseDto(items, 1, false); //TODO: implement paging logic
    }
    public async Task<(bool Found, bool Allowed, PostResponseDto? Post)> UpdateAsync(
        Guid id,
        Guid userId,
        string content
    )
    {
        var post = await db.Posts.FindAsync(id);
        if (post is null)
            return (false, false, null);
        if (post.AuthorId != userId)
            return (true, false, null);

        post.Content = content;
        post.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return (true, true, await GetByIdAsync(id, userId));
    }
    public async Task<bool> DeleteAsync(Guid id, Guid userId)
    {
        var post = await db.Posts.FindAsync(id);
        if (post is null)
            return (false);
        if (post.AuthorId != userId)
            return (false);

        db.Posts.Remove(post);
        await db.SaveChangesAsync();
        return true;
    }
}
