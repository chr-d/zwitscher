using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using ZwitscherApi.Data;
using ZwitscherApi.Dtos.Auth;
using ZwitscherApi.Dtos.Users;
using ZwitscherApi.Models;
using ZwitscherApi.Options;

namespace ZwitscherApi.Services;

public class AuthService(
    UserManager<User> userManager,
    IOptions<JwtOptions> jwtOptions,
    AppDbContext db
) : IAuthService
{
    private readonly UserManager<User> _userManager = userManager;
    private readonly JwtOptions _jwtOptions = jwtOptions.Value;
    private readonly AppDbContext _db = db;

    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user is null || !await _userManager.CheckPasswordAsync(user, dto.Password))
        {
            return null;
        }

        var accessExpiresAtUtc = DateTime.UtcNow.AddMinutes(_jwtOptions.ExpiryMinutes);
        var accessToken = CreateToken(user, accessExpiresAtUtc);
        var refreshToken = CreateRefreshToken();
        var refreshExpiresAtUtc = DateTime.UtcNow.AddDays(30); //TODO: add refresh token expiry to config
        _db.RefreshTokens.Add(
            new RefreshToken
            {
                Token = refreshToken,
                UserId = user.Id,
                CreatedAtUtc = DateTime.UtcNow,
                ExpiresAtUtc = refreshExpiresAtUtc,
            }
        );
        await _db.SaveChangesAsync();

        return new LoginResponseDto(
            accessToken,
            accessExpiresAtUtc,
            refreshToken,
            refreshExpiresAtUtc
        );
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

    private static string CreateRefreshToken()
    {
        var randomBytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(randomBytes);
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
