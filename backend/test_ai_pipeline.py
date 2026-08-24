"""Standalone AI pipeline test (NOT part of the FastAPI app).

Run from the backend directory:
    cd "E:\\Shopping website\\backend"
    python test_ai_pipeline.py
"""

import json
import os

from app.services.ai_product_generator import generate_product_draft
from app.services.frame_extractor import extract_frames

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VIDEO_PATH = os.path.join(BASE_DIR, "test_assets", "sample_video.mp4")
FRAMES_DIR = os.path.join(BASE_DIR, "test_assets", "frames")


def main() -> None:
    # Sanity check: confirm the API key loaded (only first chars, never full).
    from app.core.config import settings

    key = settings.gemini_api_key
    print(f"gemini_api_key loaded: {key[:5]}... (len={len(key)})")

    # 1) Extract frames from the sample video.
    frame_paths = extract_frames(VIDEO_PATH, FRAMES_DIR, num_frames=8)
    print("Extracted frame paths:")
    for p in frame_paths:
        print(f"  {p}  exists={os.path.isfile(p)}")

    if not frame_paths:
        print("ERROR: no frames were extracted — check the video path/format.")
        return

    # 2) Ask Gemini to produce a draft product listing from those frames.
    print("\nCalling Gemini for a product draft...")
    result = generate_product_draft(frame_paths)

    # 3) Pretty-print the result for manual review.
    print("\n--- Gemini draft (pretty-printed) ---")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    print("--- end ---")


if __name__ == "__main__":
    main()