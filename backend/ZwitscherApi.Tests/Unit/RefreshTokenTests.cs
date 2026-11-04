using ZwitscherApi.Models;

namespace ZwitscherApi.Tests.Unit;

public class RefreshTokenTests
{
    [Fact]
    public void IsActive_IsTrueForUnrevokedUnexpiredToken()
    {
        var token = new RefreshToken { ExpiresAtUtc = DateTime.UtcNow.AddHours(1) };

        Assert.True(token.IsActive);
    }

    [Fact]
    public void IsActive_IsFalseForExpiredToken()
    {
        var token = new RefreshToken { ExpiresAtUtc = DateTime.UtcNow.AddHours(-1) };

        Assert.False(token.IsActive);
    }

    [Fact]
    public void IsActive_IsFalseForRevokedTokenEvenWhenUnexpired()
    {
        var token = new RefreshToken
        {
            ExpiresAtUtc = DateTime.UtcNow.AddHours(1),
            RevokedAtUtc = DateTime.UtcNow,
        };

        Assert.False(token.IsActive);
    }
}
