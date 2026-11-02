using System.ComponentModel.DataAnnotations;

namespace ZwitscherApi.Dtos.Auth;

public record LoginRequestDto([Required, EmailAddress] string Email, [Required] string Password);
