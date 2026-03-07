from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import rate_limit_handler
from app.db.session import dispose_engine
from app.services.cache import init_redis_pool, shutdown_redis_pool


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_redis_pool()
    yield
    await shutdown_redis_pool()
    await dispose_engine()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.API_VERSION,
    description="Production-oriented eCommerce backend powered by FastAPI.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.state.limiter = settings.rate_limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)
