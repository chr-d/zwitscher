using ZwitscherApi.Dtos.Posts;
using ZwitscherApi.Models;

namespace ZwitscherApi.Services;

public interface IPostService
{
    Task<PostPageResponseDto> GetFeedAsync();

    Task<PostResponseDto?> CreateAsync(Guid authorId, CreatePostRequestDto content);

    Task<PostResponseDto?> GetByIdAsync(Guid Id); //add current UserId
}
