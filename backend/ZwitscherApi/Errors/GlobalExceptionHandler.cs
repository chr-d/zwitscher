using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace ZwitscherApi.Errors;

public class GlobalExceptionHandler(
    IProblemDetailsService problemDetailsService,
    ILogger<GlobalExceptionHandler> logger
) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken
    )
    {
        var (statusCode, title) = exception switch
        {
            BadHttpRequestException badRequest => (
                badRequest.StatusCode,
                "The request could not be processed."
            ),
            _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred."),
        };

        var traceId = httpContext.TraceIdentifier;

        if (statusCode >= 500)
        {
            logger.LogError(
                exception,
                "Unhandled exception for {Method} {Path}. TraceId: {TraceId}",
                httpContext.Request.Method,
                httpContext.Request.Path,
                traceId
            );
        }

        var problem = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Extensions = { ["traceId"] = traceId },
        };

        httpContext.Response.StatusCode = statusCode;

        var written = await problemDetailsService.TryWriteAsync(
            new ProblemDetailsContext { HttpContext = httpContext, ProblemDetails = problem }
        );

        // Force generic JSON error response even when TryWriteAsync fails
        if (!written)
        {
            await httpContext.Response.WriteAsJsonAsync(
                problem,
                options: null,
                contentType: "application/problem+json",
                cancellationToken: cancellationToken
            );
        }

        return true;
    }
}
