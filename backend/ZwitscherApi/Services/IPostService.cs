using ZwitscherApi.Dtos.Posts;

namespace ZwitscherApi.Services;

public interface IPostService
{
    Task<PostPageResponseDto> GetFeedAsync();
}
