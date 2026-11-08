using ZwitscherApi.Dtos.Users;

namespace ZwitscherApi.Dtos.Posts;

public record UserPostsResponseDto(
    UserResponseDto User,
    IReadOnlyList<PostResponseDto> Items,
    int Page,
    bool HasMore
);
