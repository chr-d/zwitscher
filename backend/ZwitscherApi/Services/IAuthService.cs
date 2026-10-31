using Microsoft.AspNetCore.Identity;
using ZwitscherApi.Dtos.Auth;

namespace ZwitscherApi.Services;

public interface IAuthService
{
    Task<(IdentityResult Result, UserResponseDto? User)> RegiserAsync(RegisterRequestDto dto);
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto dto);
    Task<UserResponseDto?> GetMeAsync(Guid userId);
}
