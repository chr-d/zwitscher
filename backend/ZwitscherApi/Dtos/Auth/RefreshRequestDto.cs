using System.ComponentModel.DataAnnotations;

namespace ZwitscherApi.Dtos.Auth;

public record RefreshRequestDto([Required] string RefreshToken);
