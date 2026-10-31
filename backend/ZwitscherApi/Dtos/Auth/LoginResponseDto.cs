namespace ZwitscherApi.Dtos.Auth;

public record LoginResponseDto(string Token, DateTime ExpiresAtUtc);
