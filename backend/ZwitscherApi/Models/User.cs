using Microsoft.AspNetCore.Identity;

namespace ZwitscherApi.Models;

public class User : IdentityUser<Guid>
{
    public string DisplayName { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }

    public ICollection<Post> Posts { get; set; } = [];
    public ICollection<Like> Likes { get; set; } = [];
}
