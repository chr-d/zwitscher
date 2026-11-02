namespace ZwitscherApi.Dtos.Users;

public record CurrentUserResponseDto(Guid Id, string UserName, string DisplayName, string Email);
