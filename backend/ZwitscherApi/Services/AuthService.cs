using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using ZwitscherApi.Dtos.Auth;
using ZwitscherApi.Dtos.Users;
using ZwitscherApi.Models;
using ZwitscherApi.Options;

namespace ZwitscherApi.Services;

public class AuthService(UserManager<User> userManager, IOptions<JwtOptions> jwtOptions)
    : IAuthService
{
    private readonly UserManager<User> _userManager = userManager;
    private readonly JwtOptions _jwtOptions = jwtOptions.Value;

    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user is null || !await _userManager.CheckPasswordAsync(user, dto.Password))
        {
            return null;
        }

        var expiresAtUtc = DateTime.UtcNow.AddMinutes(_jwtOptions.ExpiryMinutes);
        var token = CreateToken(user, expiresAtUtc);

        return new LoginResponseDto(token, expiresAtUtc);
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

        return (result, new UserResponseDto(user.Id, user.UserName, user.DisplayName));
    }

    private string CreateToken(User user, DateTime expiresAtUtc)
    {
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.Key));

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity([
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            ]),
            Issuer = _jwtOptions.Issuer,
            Audience = _jwtOptions.Audience,
            Expires = expiresAtUtc,
            SigningCredentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256),
        };

        return new JsonWebTokenHandler().CreateToken(descriptor);
    }
}
