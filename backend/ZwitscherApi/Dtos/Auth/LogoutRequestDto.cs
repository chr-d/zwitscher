using System.ComponentModel.DataAnnotations;

namespace ZwitscherApi.Dtos.Auth;

public record LogoutRequestDto([Required] string RefreshToken);
