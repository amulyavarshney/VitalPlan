"""Local filesystem image storage for scanner uploads."""
from __future__ import annotations

import uuid
from pathlib import Path
from typing import Optional

from config import settings


def _uploads_root() -> Path:
    root = Path(settings.UPLOAD_DIR)
    root.mkdir(parents=True, exist_ok=True)
    return root


def save_upload(data: bytes, content_type: str, subdir: str = "scans") -> str:
    """Persist bytes to disk and return a relative storage key."""
    extension = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }.get(content_type, ".bin")

    folder = _uploads_root() / subdir
    folder.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{extension}"
    path = folder / filename
    path.write_bytes(data)
    return f"{subdir}/{filename}"


def resolve_upload_path(relative_key: Optional[str]) -> Optional[Path]:
    if not relative_key:
        return None
    candidate = (_uploads_root() / relative_key).resolve()
    root = _uploads_root().resolve()
    if not str(candidate).startswith(str(root)):
        return None
    if candidate.exists() and candidate.is_file():
        return candidate
    return None


def public_upload_url(relative_key: Optional[str]) -> Optional[str]:
    if not relative_key:
        return None
    return f"/api/uploads/{relative_key}"
