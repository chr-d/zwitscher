namespace ZwitscherApi.Dtos.Auth;

public record RegisterRequestDto(
    string UserName,
    string DisplayName,
    string Email,
    string Password
);
