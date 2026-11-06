using ZwitscherApi.Dtos.Posts;

namespace ZwitscherApi.Services;

public interface IPostService
{
    Task<PostPageResponseDto> GetFeedAsync(Guid? userId);

    Task<PostResponseDto?> CreateAsync(Guid authorId, CreatePostRequestDto content);

    Task<PostResponseDto?> GetByIdAsync(Guid id, Guid? userId);

    Task<PostPageResponseDto> GetByUserAsync(Guid authorId, Guid? userId);

    Task<PostPageResponseDto> GetLikedByUserAsync(Guid userId);
}
