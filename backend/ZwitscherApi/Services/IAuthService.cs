using Microsoft.AspNetCore.Identity;
using ZwitscherApi.Dtos.Auth;
using ZwitscherApi.Dtos.Users;

namespace ZwitscherApi.Services;

public interface IAuthService
{
    Task<(IdentityResult Result, UserResponseDto? User)> RegisterAsync(RegisterRequestDto dto);
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto dto);
    Task<LoginResponseDto?> RefreshAsync(RefreshRequestDto dto);
    Task<bool> LogoutAsync(Guid userId, LogoutRequestDto dto);
}
