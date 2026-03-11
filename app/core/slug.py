import re
import unicodedata


def slugify(text: str) -> str:
    """Convert text to URL-safe slug. Handles unicode, spaces, special chars."""
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text)
    return text.strip("-") or "product"


def make_unique_slug(base: str, existing: list[str]) -> str:
    """Append numeric suffix if slug already exists."""
    slug = base
    counter = 1
    while slug in existing:
        slug = f"{base}-{counter}"
        counter += 1
    return slug
