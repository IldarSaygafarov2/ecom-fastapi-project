from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def ensure_media_dirs() -> None:
    Path(settings.MEDIA_ROOT).mkdir(parents=True, exist_ok=True)
    _products_dir().mkdir(parents=True, exist_ok=True)


def _products_dir() -> Path:
    return Path(settings.MEDIA_ROOT) / "products"


async def save_product_image(file: UploadFile) -> str:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only image files are allowed")

    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported image format")

    content = await file.read()
    max_size_bytes = settings.MAX_IMAGE_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image is too large (max {settings.MAX_IMAGE_UPLOAD_SIZE_MB} MB)",
        )

    filename = f"{uuid4().hex}{suffix}"
    destination = _products_dir() / filename
    destination.write_bytes(content)
    return f"{settings.MEDIA_URL_PREFIX.rstrip('/')}/products/{filename}"


def remove_local_media_file(file_url: str | None) -> None:
    if not file_url:
        return
    prefix = settings.MEDIA_URL_PREFIX.rstrip("/")
    if not file_url.startswith(prefix + "/"):
        return

    relative = file_url[len(prefix) :].lstrip("/")
    if not relative:
        return

    target_path = Path(settings.MEDIA_ROOT) / relative
    try:
        target_path.resolve().relative_to(Path(settings.MEDIA_ROOT).resolve())
    except ValueError:
        return

    if target_path.is_file():
        target_path.unlink(missing_ok=True)
