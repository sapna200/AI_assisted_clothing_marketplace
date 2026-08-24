"""OpenCV-based video frame extraction.

Uses opencv-python (cv2) rather than FFmpeg so no separate binary install or
PATH setup is required — OpenCV installs as a normal pip package.
"""

import math
import os

import cv2


class FrameExtractionError(Exception):
    """Raised when a video cannot be opened or frames cannot be read."""


def extract_frames(
    video_path: str, output_dir: str, num_frames: int = 5
) -> list[str]:
    """Extract `num_frames` evenly-spaced frames from a video.

    Returns a list of absolute paths to the extracted JPEG files.
    """
    os.makedirs(output_dir, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise FrameExtractionError(
            "Could not open video file — check the path or file format"
        )

    try:
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total_frames <= 0:
            raise FrameExtractionError(
                "Video has no readable frames — file may be corrupt or unsupported"
            )

        # Space target indices between 5% and 95% of the stream to avoid the
        # first/last frames which are often blank or transitional.
        if num_frames <= 1:
            indices = [int(total_frames * 0.5)]
        else:
            start = int(total_frames * 0.05)
            end = int(total_frames * 0.95)
            step = max(1, (end - start) // (num_frames - 1))
            indices = [start + i * step for i in range(num_frames)]
            indices = [min(i, total_frames - 1) for i in indices]

        print(
            f"[frame_extractor] total_frames={total_frames} "
            f"target_indices={indices}"
        )

        saved_paths: list[str] = []

        for order, frame_index in enumerate(indices, start=1):
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
            success, frame = cap.read()
            if not success:
                print(
                    f"[frame_extractor] WARNING: could not read frame at index "
                    f"{frame_index}, skipping"
                )
                continue
            output_path = os.path.join(
                output_dir, f"frame_{order:02d}.jpg"
            )
            if cv2.imwrite(output_path, frame):
                saved_paths.append(output_path)
            else:
                print(
                    f"[frame_extractor] WARNING: failed to write {output_path}"
                )

        if len(saved_paths) < num_frames:
            print(
                f"[frame_extractor] WARNING: expected {num_frames} frames but "
                f"only saved {len(saved_paths)}"
            )

        return saved_paths
    finally:
        cap.release()


def select_best_frames(frame_paths: list[str], count: int = 3) -> list[str]:
    """Pick `count` frames evenly spaced from the middle 60% of the list.

    Deliberately simple: skips the start/end of the pool (more likely to be
    transitional or blurry) without any real computer-vision quality scoring.
    Used as the fallback when Gemini's own best_image_frame_names selection is
    missing or invalid.
    """
    if len(frame_paths) <= count:
        return list(frame_paths)

    start = int(len(frame_paths) * 0.2)
    end = int(len(frame_paths) * 0.8)
    pool = frame_paths[start:end] or frame_paths

    if count <= 1:
        indices = [len(pool) // 2]
    else:
        step = (len(pool) - 1) / (count - 1)
        indices = [round(i * step) for i in range(count)]

    picked: list[str] = []
    for index in indices:
        path = pool[min(index, len(pool) - 1)]
        if path not in picked:
            picked.append(path)
    return picked