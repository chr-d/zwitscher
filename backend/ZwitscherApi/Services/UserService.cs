using Microsoft.EntityFrameworkCore;
using ZwitscherApi.Data;
using ZwitscherApi.Dtos.Users;

namespace ZwitscherApi.Services;

public class UserService(AppDbContext db) : IUserService
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
}
