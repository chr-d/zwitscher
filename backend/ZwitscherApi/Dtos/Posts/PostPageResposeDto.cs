namespace ZwitscherApi.Dtos.Posts;

public record PostPageResponseDto(IReadOnlyList<PostResponseDto> Items, int Page, bool HasMore);
