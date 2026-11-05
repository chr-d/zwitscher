namespace ZwitscherApi.Services;

public interface ILikeService
{
    Task<bool> LikeAsync(Guid postId, Guid userId);
    Task<bool> UnLikeAsync(Guid postId, Guid userId);
}