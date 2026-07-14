"""Upload storage: local disk by default, optional S3-compatible object storage."""
from __future__ import annotations

import logging
import uuid
from pathlib import Path
from typing import Optional

from config import settings

logger = logging.getLogger(__name__)


def s3_enabled() -> bool:
    return bool(settings.S3_BUCKET and settings.S3_ACCESS_KEY_ID and settings.S3_SECRET_ACCESS_KEY)


def _uploads_root() -> Path:
    root = Path(settings.UPLOAD_DIR)
    root.mkdir(parents=True, exist_ok=True)
    return root


def _extension(content_type: str) -> str:
    return {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }.get(content_type, ".bin")


def _s3_client():
    import boto3
    from botocore.client import Config

    return boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT_URL or None,
        aws_access_key_id=settings.S3_ACCESS_KEY_ID,
        aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
        region_name=settings.S3_REGION or "us-east-1",
        config=Config(signature_version="s3v4"),
    )


def save_upload(data: bytes, content_type: str, subdir: str = "scans") -> str:
    """Persist bytes and return a relative storage key."""
    extension = _extension(content_type)
    filename = f"{uuid.uuid4().hex}{extension}"
    relative_key = f"{subdir}/{filename}"

    if s3_enabled():
        client = _s3_client()
        client.put_object(
            Bucket=settings.S3_BUCKET,
            Key=relative_key,
            Body=data,
            ContentType=content_type,
        )
        logger.info("Uploaded %s to s3://%s/%s", relative_key, settings.S3_BUCKET, relative_key)
        return relative_key

    folder = _uploads_root() / subdir
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / filename
    path.write_bytes(data)
    return relative_key


def resolve_upload_path(relative_key: Optional[str]) -> Optional[Path]:
    """Resolve local disk path only (S3 objects are not served from disk)."""
    if not relative_key or s3_enabled():
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
    if s3_enabled():
        if settings.S3_PUBLIC_BASE_URL:
            return f"{settings.S3_PUBLIC_BASE_URL.rstrip('/')}/{relative_key}"
        # Presigned GET for private buckets
        try:
            client = _s3_client()
            return client.generate_presigned_url(
                "get_object",
                Params={"Bucket": settings.S3_BUCKET, "Key": relative_key},
                ExpiresIn=3600,
            )
        except Exception:
            logger.exception("Failed to presign S3 URL for %s", relative_key)
            return None
    return f"/api/uploads/{relative_key}"
