using Microsoft.AspNetCore.Identity;
using ZwitscherApi.Dtos.Auth;
using ZwitscherApi.Models;

namespace ZwitscherApi.Services;

public class AuthService(UserManager<User> userManager) : IAuthService
{
    private readonly UserManager<User> _userManager = userManager;

    public Task<UserResponseDto?> GetMeAsync(Guid userId)
    {
        //TODO: GetMeAsync implementation
        throw new NotImplementedException();
    }

    public Task<LoginResponseDto?> LoginAsync(LoginRequestDto dto)
    {
        //TODO: LoginAsync implementation
        throw new NotImplementedException();
    }

    public async Task<(IdentityResult Result, UserResponseDto? User)> RegisterAsync(
        RegisterRequestDto dto
    )
    {
        var user = new User
        {
            DisplayName = dto.DisplayName,
            UserName = dto.UserName,
            Email = dto.Email,
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            return (result, null);
        }

        return (result, new UserResponseDto(user.Id, user.DisplayName, user.Email));
    }
}
