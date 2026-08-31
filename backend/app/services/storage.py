"""Supabase Storage helpers for persisting product videos and images."""

import io
import logging
import uuid

from PIL import Image
from supabase import create_client

from app.core.config import settings

logger = logging.getLogger(__name__)

VIDEO_BUCKET = "product-videos"
IMAGE_BUCKET = "product-images"

# Max dimension for product images (width or height)
MAX_IMAGE_DIMENSION = 1200
IMAGE_QUALITY = 80  # WebP quality (0-100)


class StorageError(Exception):
    """Raised when an upload to Supabase Storage fails."""


def _bucket_client(bucket_name: str):
    if not settings.supabase_url or not settings.supabase_service_key:
        raise StorageError(
            "Supabase storage is not configured. Set SUPABASE_URL and "
            "SUPABASE_SERVICE_KEY in backend/.env and create the public "
            f"'{bucket_name}' bucket in the Supabase dashboard."
        )
    client = create_client(settings.supabase_url, settings.supabase_service_key)
    return client.storage.from_(bucket_name)


def _optimize_image(file_path: str) -> tuple[bytes, str]:
    """Resize and convert image to WebP for faster loading.

    Returns (optimized_bytes, new_filename_with_webp_extension).
    """
    img = Image.open(file_path)
    img = img.convert("RGB")  # Ensure RGB for WebP

    # Resize if larger than max dimension (preserves aspect ratio)
    img.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), Image.LANCZOS)

    # Save as WebP for 30-50% smaller file size
    buffer = io.BytesIO()
    img.save(buffer, format="WEBP", quality=IMAGE_QUALITY, method=6)
    buffer.seek(0)

    # Change extension to .webp
    filename = file_path.rsplit(".", 1)[0] + ".webp"
    return buffer.read(), filename


def _upload(
    file_bytes: bytes, filename: str, content_type: str, bucket: str
) -> str:
    """Upload bytes to a Supabase bucket and return its public URL.

    The object path is namespaced under a UUID directory to avoid collisions.
    """
    bucket_client = _bucket_client(bucket)

    object_path = f"{uuid.uuid4().hex}/{filename}"
    bucket_client.upload(
        object_path,
        file_bytes,
        file_options={"content-type": content_type},
    )
    public_url = bucket_client.get_public_url(object_path)
    logger.info("uploaded %s/%s -> %s", bucket, object_path, public_url)
    return public_url


def upload_video_to_storage(local_file_path: str, filename: str) -> str:
    with open(local_file_path, "rb") as f:
        return _upload(f.read(), filename, "video/mp4", VIDEO_BUCKET)


def upload_image_to_storage(local_file_path: str, filename: str) -> str:
    """Upload an image after optimizing it (resize + WebP conversion)."""
    optimized_bytes, webp_filename = _optimize_image(local_file_path)
    return _upload(optimized_bytes, webp_filename, "image/webp", IMAGE_BUCKET)


def delete_objects_by_public_urls(urls: list[str]) -> None:
    """Best-effort deletion of Supabase objects given their public URLs.

    Never raises — a failed storage delete is logged and skipped so rejecting
    a draft always succeeds at the DB level.
    """
    if not urls:
        return
    if not settings.supabase_url or not settings.supabase_service_key:
        print("[storage] WARN cannot delete objects: storage not configured")
        return

    client = create_client(settings.supabase_url, settings.supabase_service_key)

    # Group paths by bucket: URL shape is
    #   https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
    grouped: dict[str, list[str]] = {}
    for url in urls:
        marker = "/storage/v1/object/public/"
        if not url or marker not in url:
            continue
        rest = url.split(marker, 1)[1].strip("/")
        parts = rest.split("/", 1)
        if len(parts) != 2 or not parts[1]:
            continue
        grouped.setdefault(parts[0], []).append(parts[1])

    for bucket_name, paths in grouped.items():
        try:
            client.storage.from_(bucket_name).remove(paths)
            print(f"[storage] deleted {len(paths)} object(s) from {bucket_name}")
        except Exception as exc:  # noqa: BLE001 - cleanup must never block reject
            print(
                f"[storage] WARN failed to delete from {bucket_name}: {exc} "
                f"(paths={paths})"
            )