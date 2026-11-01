namespace ZwitscherApi.Models;

public class RefreshToken
{
    public int Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
    public DateTime? RevokedAtUtc { get; set; }
    public string? ReplacedByToken { get; set; }
    public bool IsActive => RevokedAtUtc is null && DateTime.UtcNow < ExpiresAtUtc;
}
