using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ZwitscherApi.Data;
using ZwitscherApi.Dtos.Users;

namespace ZwitscherApi.Services;

public class UserService(AppDbContext db, ILookupNormalizer normalizer) : IUserService
{
    private readonly AppDbContext _db = db;

    public async Task<CurrentUserResponseDto?> GetMeAsync(Guid id)
    {
        return await _db
            .Users.AsNoTracking()
            .Where(u => u.Id == id)
            .Select(u => new CurrentUserResponseDto(u.Id, u.UserName!, u.DisplayName, u.Email!))
            .FirstOrDefaultAsync();
    }

    public async Task<UserResponseDto?> GetByIdAsync(Guid id)
    {
        return await _db
            .Users.AsNoTracking()
            .Where(u => u.Id == id)
            .Select(u => new UserResponseDto(u.Id, u.UserName!, u.DisplayName))
            .FirstOrDefaultAsync();
    }

    public async Task<UserResponseDto?> GetByUserNameAsync(string userName)
    {
        var normalizedUserName = normalizer.NormalizeName(userName);
        return await _db
            .Users.AsNoTracking()
            .Where(u => u.NormalizedUserName == normalizedUserName)
            .Select(u => new UserResponseDto(u.Id, u.UserName!, u.DisplayName))
            .FirstOrDefaultAsync();
    }
}
