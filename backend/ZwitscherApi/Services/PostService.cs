using Microsoft.EntityFrameworkCore;
using ZwitscherApi.Data;
using ZwitscherApi.Dtos.Posts;

namespace ZwitscherApi.Services;

public class PostService(AppDbContext db) : IPostService
{
    public async Task<PostPageResponseDto> GetFeedAsync()
    {
        var items = await db
            .Posts.AsNoTracking()
            .OrderByDescending(p => p.CreatedAtUtc)
            .Select(p => new PostResponseDto(
                p.Id,
                p.Content,
                new AuthorResponseDto(p.Author.Id, p.Author.UserName, p.Author.DisplayName),
                p.CreatedAtUtc,
                p.UpdatedAtUtc,
                false, // TODO:CanEdit logic
                p.Likes.Count,
                false // TODO: LikedByMe logic
            ))
            .ToListAsync();
        return new PostPageResponseDto(items, 1, false); //TODO: implement paging logic
    }
}
