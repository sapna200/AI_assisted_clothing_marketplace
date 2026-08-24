"""Background orchestration for the AI video -> draft-product pipeline.

Runs as a FastAPI BackgroundTask, so it opens its own DB session (the request's
session finishes before the background task completes).
"""

import os
import shutil
import tempfile

from app.models.product import Product
from app.services.ai_product_generator import generate_product_draft
from app.services.frame_extractor import extract_frames, select_best_frames
from app.services.storage import upload_image_to_storage, upload_video_to_storage

# Placeholder owner id until real auth exists (Day 5+).
DEFAULT_OWNER_ID = 1


def _cleanup_paths(paths: list[str]) -> None:
    """Best-effort removal of temp files, ignoring missing ones."""
    for path in paths:
        try:
            if os.path.isfile(path):
                os.remove(path)
        except OSError:
            pass


def process_video_and_create_draft(video_path: str, db_session_factory) -> None:
    """Extract frames, ask Gemini for a draft, persist the video + selected
    display images, and insert a pending_review Product row. Never leaves
    orphaned temp files behind.
    """
    frames_dir = tempfile.mkdtemp(prefix="video_frames_")
    frame_paths: list[str] = []
    try:
        # 1) Extract a wider pool of frames (8) to choose display images from.
        frame_paths = extract_frames(video_path, frames_dir, num_frames=8)
        if not frame_paths:
            print("[ingestion] ERROR: no frames extracted, aborting")
            return
        paths_by_name = {os.path.basename(p): p for p in frame_paths}

        # 2) Ask Gemini for a structured draft from the frames.
        draft = generate_product_draft(frame_paths)
        print(f"[ingestion] draft generated: {draft}")

        # 3) Pick display images: prefer Gemini's own selection of clearest
        #    garment shots; fall back to evenly-spaced middle-60% selection.
        chosen_names = draft.get("best_image_frame_names") or []
        chosen_paths = [
            paths_by_name[name] for name in chosen_names if name in paths_by_name
        ]
        if len(chosen_paths) < 3:
            fallback = select_best_frames(frame_paths, count=3)
            for path in fallback:
                if path not in chosen_paths:
                    chosen_paths.append(path)
        chosen_paths = chosen_paths[:3]

        # 4) Persist the video permanently to Supabase Storage.
        video_url = upload_video_to_storage(
            video_path, os.path.basename(video_path)
        )

        # 5) Upload the selected frames as product display images.
        image_urls: list[str] = []
        for path in chosen_paths:
            try:
                image_urls.append(
                    upload_image_to_storage(path, os.path.basename(path))
                )
            except Exception as exc:  # noqa: BLE001 - keep going on one bad image
                print(f"[ingestion] WARNING: image upload failed ({path}): {exc}")

        detected_size = (draft.get("detected_size") or "").strip()
        if detected_size:
            print(
                "[ingestion] NOTE: sizes was AI-detected from the video "
                f"({detected_size!r}) — it MUST be manually confirmed during "
                "review; AI size detection is only a suggestion."
            )
        else:
            print(
                "[ingestion] NOTE: no size detected in the video — sizes left "
                "empty and must be set manually during review."
            )

        tag_price = draft.get("detected_tag_price")
        if tag_price is not None:
            print(
                f"[ingestion] NOTE: read printed tag price {tag_price} — stored "
                "as detected_tag_price suggestion ONLY. base_price stays null "
                "until the owner confirms it during review."
            )

        # 6) Write the pending_review product row in a fresh session.
        session = db_session_factory()
        try:
            product = Product(
                title=draft["title"],
                description=draft["description"],
                category=draft["category"],
                color=draft["color"],
                # Single detected physical size, or empty — never a fabricated
                # list of available sizes. Owner confirms/extends at review.
                sizes=detected_size,
                base_price=None,
                discount_percent=0,
                brand=None,
                image_urls=",".join(image_urls),
                status="pending_review",
                video_url=video_url,
                suggested_price_min=draft["suggested_price_min"],
                suggested_price_max=draft["suggested_price_max"],
                detected_tag_price=tag_price,
                owner_id=DEFAULT_OWNER_ID,
            )
            session.add(product)
            session.commit()
            print(f"[ingestion] created product id={product.id} (pending_review)")
        finally:
            session.close()
    except Exception as exc:  # noqa: BLE001 - log clearly, do not crash uvicorn
        print(f"[ingestion] ERROR processing video: {exc}")
    finally:
        # Clean up the extracted frame images, temp frames dir, and the
        # temporary uploaded video copy (already persisted to storage).
        _cleanup_paths(frame_paths + [video_path])
        try:
            shutil.rmtree(frames_dir, ignore_errors=True)
        except OSError:
            pass