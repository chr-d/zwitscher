namespace ZwitscherApi.Dtos.Auth;

public record LoginResponseDto(
    string AccessToken,
    DateTime AccessExpiresAtUtc,
    string RefreshToken,
    DateTime RefreshExpiresAtUtc
);
