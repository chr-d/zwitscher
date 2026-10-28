namespace ZwitscherApi.Models;

public class Post
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }

    public Guid AuthorId { get; set; }
    public User Author { get; set; } = null!;
    public ICollection<Like> Likes { get; set; } = [];
}
