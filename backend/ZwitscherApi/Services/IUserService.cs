using ZwitscherApi.Dtos.Users;

namespace ZwitscherApi.Services;

public interface IUserService
{
    Task<CurrentUserResponseDto?> GetMeAsync(Guid id);
    Task<UserResponseDto?> GetByIdAsync(Guid id);
    Task<UserResponseDto?> GetByUserNameAsync(string userName);
}
