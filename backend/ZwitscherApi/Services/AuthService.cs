using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using ZwitscherApi.Dtos.Auth;
using ZwitscherApi.Models;

namespace ZwitscherApi.Services;

public class AuthService(UserManager<User> userManager, IConfiguration configuration) : IAuthService
{
    private readonly UserManager<User> _userManager = userManager;
    private readonly IConfiguration _configuration = configuration;

    public Task<UserResponseDto?> GetMeAsync(Guid userId)
    {
        //TODO: GetMeAsync implementation
        throw new NotImplementedException();
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user is null || !await _userManager.CheckPasswordAsync(user, dto.Password))
        {
            return null;
        }

        var expiresAtUtc = DateTime.UtcNow.AddMinutes(
            _configuration.GetValue("Jwt:ExpiryMinutes", 15)
        );
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
        var key =
            _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Jwt:Key is not configured.");

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity([
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            ]),
            Issuer = _configuration["Jwt:Issuer"],
            Audience = _configuration["Jwt:Audience"],
            Expires = expiresAtUtc,
            SigningCredentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256),
        };

        return new JsonWebTokenHandler().CreateToken(descriptor);
    }
}
