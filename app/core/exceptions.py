from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded


async def rate_limit_handler(_: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"detail": f"Rate limit exceeded: {exc.detail}"},
    )
