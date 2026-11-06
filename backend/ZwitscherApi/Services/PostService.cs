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
}
