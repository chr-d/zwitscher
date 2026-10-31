using System.ComponentModel.DataAnnotations;

namespace ZwitscherApi.Options;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    [Required]
    public required string Key { get; init; }

    [Required]
    public required string Issuer { get; init; }

    [Required]
    public required string Audience { get; init; }

    [Range(1, int.MaxValue)]
    public int ExpiryMinutes { get; init; }
}
