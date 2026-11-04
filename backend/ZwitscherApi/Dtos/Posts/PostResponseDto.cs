using System.Text.Json.Serialization;

namespace ZwitscherApi.Dtos.Posts;

public record PostResponseDto(
    Guid Id,
    string Content,
    AuthorResponseDto Author,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc,
    bool CanEdit,
    [property: JsonNumberHandling(JsonNumberHandling.Strict)] int LikeCount,
    bool LikedByMe
);
