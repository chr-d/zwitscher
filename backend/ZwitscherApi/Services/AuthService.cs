using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
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
    private const int MaxConcurrencyAttempts = 3;

    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user is null || !await _userManager.CheckPasswordAsync(user, dto.Password))
        {
            return null;
        }

        var now = DateTime.UtcNow;
        var accessExpiresAtUtc = now.AddMinutes(_jwtOptions.ExpiryMinutes);
        var accessToken = CreateToken(user, accessExpiresAtUtc);
        var refreshToken = CreateRefreshToken();
        var refreshExpiresAtUtc = now.AddDays(_jwtOptions.RefreshTokenExpiryDays);
        _db.RefreshTokens.Add(
            new RefreshToken
            {
                Token = refreshToken,
                UserId = user.Id,
                CreatedAtUtc = now,
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

    public Task<LoginResponseDto?> RefreshAsync(RefreshRequestDto dto) =>
        RetryConcurrencyAsync(() => RefreshOnceAsync(dto));

    private async Task<LoginResponseDto?> RefreshOnceAsync(RefreshRequestDto dto)
    {
        var existing = await _db.RefreshTokens.FirstOrDefaultAsync(t =>
            t.Token == dto.RefreshToken
        );
        if (existing is null)
        {
            return null;
        }

        // Token exists but is not usable. If it was already revoked someone is using an old token
        // assume it was stolen and revoke all active tokens for this user
        if (!existing.IsActive)
        {
            if (existing.RevokedAtUtc is not null)
            {
                await RevokeAllActiveTokensAsync(existing.UserId);
            }
            return null;
        }

        var user = await _userManager.FindByIdAsync(existing.UserId.ToString());
        if (user is null)
        {
            return null;
        }

        // every refresh invalidates the old token and issues a new one
        var newRefreshToken = CreateRefreshToken();
        var now = DateTime.UtcNow;
        var refreshExpiresAt = now.AddDays(_jwtOptions.RefreshTokenExpiryDays);

        existing.RevokedAtUtc = now;
        existing.ReplacedByToken = newRefreshToken;

        _db.RefreshTokens.Add(
            new RefreshToken
            {
                Token = newRefreshToken,
                UserId = user.Id,
                CreatedAtUtc = now,
                ExpiresAtUtc = refreshExpiresAt,
            }
        );
        await _db.SaveChangesAsync();

        var accessExpiresAt = now.AddMinutes(_jwtOptions.ExpiryMinutes);
        var accessToken = CreateToken(user, accessExpiresAt);

        return new LoginResponseDto(
            accessToken,
            accessExpiresAt,
            newRefreshToken,
            refreshExpiresAt
        );
    }

    public Task<bool> LogoutAsync(Guid userId, LogoutRequestDto dto) =>
        RetryConcurrencyAsync(() => LogoutOnceAsync(userId, dto));

    private async Task<bool> LogoutOnceAsync(Guid userId, LogoutRequestDto dto)
    {
        var token = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.Token == dto.RefreshToken);
        if (token is null)
        {
            return true;
        }
        if (token.UserId != userId)
        {
            return false;
        }

        var now = DateTime.UtcNow;
        // Remember seen tokens
        var visited = new HashSet<string>();
        // Follow replacement tokens while they exist, belong to this user, and have not been visited
        while (token is not null && token.UserId == userId && visited.Add(token.Token))
        {
            // Mark the token as revoked, keeping its original revocation time if it has one
            token.RevokedAtUtc ??= now;
            // A refresh may have replaced this token. Find that newer token and revoke it too
            var replacement = token.ReplacedByToken;
            token = replacement is null
                ? null
                : await _db.RefreshTokens.FirstOrDefaultAsync(t => t.Token == replacement);
        }

        await _db.SaveChangesAsync();
        return true;
    }

    // Retry an async operation if another request changes the same token before save
    private async Task<T> RetryConcurrencyAsync<T>(Func<Task<T>> operation)
    {
        // Count attempts, the catch block limits how many times to try
        for (var attempt = 1; ; attempt++)
        {
            try
            {
                // Run the passed operation and return its result if it succeeds
                return await operation();
            }
            catch (DbUpdateConcurrencyException)
            {
                // Another request changed a token, in-memory token data is out of date.
                // Stop tracking all loaded tokens and any new tokens from the failed save.
                // This lets the next attempt read fresh data and repeat all token checks.
                // Make a list first because detaching entries changes the tracked collection.
                foreach (var entry in _db.ChangeTracker.Entries<RefreshToken>().ToList())
                {
                    entry.State = EntityState.Detached;
                }

                // After the last allowed attempt rethrow the original error
                if (attempt >= MaxConcurrencyAttempts)
                {
                    throw;
                }
                // Otherwise, the loop runs the whole operation again
            }
        }
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

    private async Task RevokeAllActiveTokensAsync(Guid userId)
    {
        var activeTokens = await _db
            .RefreshTokens.Where(t => t.UserId == userId && t.RevokedAtUtc == null)
            .ToListAsync();

        foreach (var token in activeTokens)
        {
            token.RevokedAtUtc = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
    }
}
