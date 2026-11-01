using Microsoft.AspNetCore.Http.HttpResults;
using ZwitscherApi.Dtos.Auth;
using ZwitscherApi.Dtos.Users;
using ZwitscherApi.Services;

namespace ZwitscherApi.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this RouteGroupBuilder api)
    {
        var auth = api.MapGroup("/auth").WithTags("Auth");
        auth.MapPost("/register", Register).WithName("Register").WithSummary("Register a new user");
        auth.MapPost("/login", Login)
            .WithName("Login")
            .WithSummary("Authenticate a user and issue token")
            .ProducesValidationProblem()
            .Produces(StatusCodes.Status401Unauthorized);
        auth.MapPost("/refresh", Refresh)
            .WithName("Refresh")
            .WithSummary("Refresh an access token using a refresh token")
            .ProducesValidationProblem()
            .Produces(StatusCodes.Status401Unauthorized);
        ;
    }

    private static async Task<Results<Created<UserResponseDto>, ValidationProblem>> Register(
        RegisterRequestDto dto,
        IAuthService authService
    )
    {
        var (result, user) = await authService.RegisterAsync(dto);

        if (!result.Succeeded || user is null)
        {
            var errors = result
                .Errors.GroupBy(e => e.Code)
                .ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray());

            return TypedResults.ValidationProblem(errors);
        }

        return TypedResults.Created($"api/users/{user.Id}", user);
    }

    private static async Task<Results<Ok<LoginResponseDto>, UnauthorizedHttpResult>> Login(
        LoginRequestDto dto,
        IAuthService authService
    )
    {
        var response = await authService.LoginAsync(dto);
        return response is null ? TypedResults.Unauthorized() : TypedResults.Ok(response);
    }

    private static async Task<Results<Ok<LoginResponseDto>, UnauthorizedHttpResult>> Refresh(
        RefreshRequestDto dto,
        IAuthService authService
    )
    {
        var response = await authService.RefreshAsync(dto);
        return response is null ? TypedResults.Unauthorized() : TypedResults.Ok(response);
    }
}
