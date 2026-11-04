using System.ComponentModel.DataAnnotations;

namespace ZwitscherApi.Dtos.Auth;

public record RegisterRequestDto(
    [Required, StringLength(30, MinimumLength = 3)]
    [RegularExpression(
        "[a-z0-9_]*[a-z0-9][a-z0-9_]*",
        ErrorMessage = "Username must contain only lowercase letters, numbers, and underscores, with at least one letter or number."
    )]
        string UserName,
    [Required, StringLength(100, MinimumLength = 2)] string DisplayName,
    [Required, EmailAddress, StringLength(256)] string Email,
    [Required, MinLength(8)] string Password
);
