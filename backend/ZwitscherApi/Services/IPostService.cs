using ZwitscherApi.Dtos.Posts;

namespace ZwitscherApi.Services;

public interface IPostService
{
    Task<PostPageResponseDto> GetFeedAsync(Guid? userId);

    Task<PostResponseDto?> CreateAsync(Guid authorId, CreatePostRequestDto content);

    Task<PostResponseDto?> GetByIdAsync(Guid id, Guid? userId);

    Task<PostPageResponseDto> GetByUserAsync(Guid authorId, Guid? userId);

    Task<PostPageResponseDto> GetLikedByUserAsync(Guid userId);

    Task<(bool Found, bool Allowed, PostResponseDto? Post)> UpdateAsync(
        Guid id,
        Guid userId,
        string content
    );
    Task<(bool Found, bool Allowed)> DeleteAsync(Guid id, Guid userId);
}
