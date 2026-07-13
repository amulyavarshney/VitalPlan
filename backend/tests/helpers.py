import io
from PIL import Image


def make_test_image_bytes() -> bytes:
    image = Image.new("RGB", (64, 64), color=(200, 100, 50))
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")
    return buffer.getvalue()
