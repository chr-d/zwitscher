using System.ComponentModel.DataAnnotations;

namespace ZwitscherApi.Dtos.Posts;

public record UpdatePostRequestDto([Required, StringLength(300, MinimumLength = 2)] string Content);
