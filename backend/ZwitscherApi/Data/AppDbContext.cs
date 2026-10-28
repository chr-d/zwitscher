using Microsoft.EntityFrameworkCore;
using ZwitscherApi.Models;

namespace ZwitscherApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<Like> Likes => Set<Like>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(user =>
        {
            user.HasKey(u => u.Id);

            user.Property(u => u.UserName).HasMaxLength(30).IsRequired();

            user.Property(u => u.DisplayName).HasMaxLength(50).IsRequired();

            user.HasIndex(u => u.UserName).IsUnique();
        });

        modelBuilder.Entity<Post>(post =>
        {
            post.HasKey(p => p.Id);

            post.Property(p => p.Content).HasMaxLength(500).IsRequired();

            post.HasOne(p => p.Author)
                .WithMany(u => u.Posts)
                .HasForeignKey(p => p.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Like>(like =>
        {
            like.HasKey(l => new { l.PostId, l.UserId });

            like.HasOne(l => l.Post)
                .WithMany(p => p.Likes)
                .HasForeignKey(l => l.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            like.HasOne(l => l.User)
                .WithMany(u => u.Likes)
                .HasForeignKey(l => l.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
