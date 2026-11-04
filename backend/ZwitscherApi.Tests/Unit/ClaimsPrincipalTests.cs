using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;
using ZwitscherApi.Extensions;

namespace ZwitscherApi.Tests.Unit;

public class ClaimsPrincipalTests
{
    [Fact]
    public void GetUserId_ReturnsIdFromSubjectClaim()
    {
        var userId = Guid.NewGuid();
        var user = new ClaimsPrincipal(
            new ClaimsIdentity([new Claim(JwtRegisteredClaimNames.Sub, userId.ToString())])
        );

        var result = user.GetUserId();

        Assert.Equal(userId, result);
    }

    [Fact]
    public void GetUserId_ThrowsWhenSubjectClaimIsMissing()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity());

        Assert.Throws<InvalidOperationException>(() => user.GetUserId());
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-a-guid")]
    public void GetUserId_ThrowsWhenSubjectClaimIsInvalid(string subject)
    {
        var user = new ClaimsPrincipal(
            new ClaimsIdentity([new Claim(JwtRegisteredClaimNames.Sub, subject)])
        );

        Assert.Throws<InvalidOperationException>(() => user.GetUserId());
    }
}
