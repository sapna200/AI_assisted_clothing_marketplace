"""Supabase Storage helpers for persisting product videos and images."""

import uuid

from supabase import create_client

from app.core.config import settings

VIDEO_BUCKET = "product-videos"
IMAGE_BUCKET = "product-images"


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


def _upload(local_file_path: str, filename: str, content_type: str, bucket: str) -> str:
    """Upload a local file to a Supabase bucket and return its public URL.

    The object path is namespaced under a UUID directory to avoid collisions.
    """
    bucket_client = _bucket_client(bucket)

    with open(local_file_path, "rb") as f:
        file_bytes = f.read()

    object_path = f"{uuid.uuid4().hex}/{filename}"
    bucket_client.upload(
        object_path,
        file_bytes,
        file_options={"content-type": content_type},
    )
    public_url = bucket_client.get_public_url(object_path)
    print(f"[storage] uploaded {bucket}/{object_path} -> {public_url}")
    return public_url


def upload_video_to_storage(local_file_path: str, filename: str) -> str:
    return _upload(local_file_path, filename, "video/mp4", VIDEO_BUCKET)


def upload_image_to_storage(local_file_path: str, filename: str) -> str:
    return _upload(local_file_path, filename, "image/jpeg", IMAGE_BUCKET)


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