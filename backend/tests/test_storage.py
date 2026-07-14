from unittest.mock import MagicMock, patch

from services.storage_service import public_upload_url, save_upload, s3_enabled
from config import settings


def test_local_save_upload(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "UPLOAD_DIR", str(tmp_path))
    monkeypatch.setattr(settings, "S3_BUCKET", "")
    key = save_upload(b"hello", "image/jpeg", subdir="scans")
    assert key.startswith("scans/")
    assert (tmp_path / key).read_bytes() == b"hello"
    url = public_upload_url(key)
    assert url is not None
    assert url.startswith(f"/api/uploads/{key}?")
    assert "sig=" in url and "exp=" in url
    assert s3_enabled() is False


def test_s3_save_upload(monkeypatch):
    monkeypatch.setattr(settings, "S3_BUCKET", "vitalplan")
    monkeypatch.setattr(settings, "S3_ACCESS_KEY_ID", "key")
    monkeypatch.setattr(settings, "S3_SECRET_ACCESS_KEY", "secret")
    monkeypatch.setattr(settings, "S3_PUBLIC_BASE_URL", "https://cdn.example.com")
    monkeypatch.setattr(settings, "S3_ENDPOINT_URL", "")
    monkeypatch.setattr(settings, "S3_REGION", "us-east-1")

    mock_client = MagicMock()
    with patch("services.storage_service._s3_client", return_value=mock_client):
        key = save_upload(b"img", "image/png", subdir="scans")
        mock_client.put_object.assert_called_once()
        assert public_upload_url(key) == f"https://cdn.example.com/{key}"
        assert s3_enabled() is True
