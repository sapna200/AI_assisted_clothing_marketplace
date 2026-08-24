"""Gemini-powered structured product draft generation from video frames."""

import json
import os
import re
import time

from PIL import Image
from google import genai
from google.genai import types

from app.core.config import settings

# The task specifies this model id. Verified available on this API key.
GEMINI_MODEL = "gemini-2.5-flash"

# Standardised product categories the model must pick from.
CATEGORIES = [
    "T-Shirts",
    "Shirts",
    "Jeans",
    "Trousers",
    "Jackets",
    "Dresses",
    "Sweaters",
    "Activewear",
    "Kurta",
    "Kurti",
    "Saree",
    "Ethnic Wear",
    "Co-ord Sets",
    "Jewellery",
    "Accessories",
    "Other",
]

REQUIRED_KEYS = [
    "title",
    "description",
    "category",
    "color",
    "suggested_price_min",
    "suggested_price_max",
]

PROMPT_TEXT = f"""
You are a product cataloger for a fashion e-commerce website.

You are given several frames extracted from ONE video of a SINGLE item. The
item may be a piece of clothing OR an accessory such as jewellery.

Return ONLY valid JSON with exactly these keys:
- "title" (string): short, catchy product name.
- "description" (string, 2-4 sentences): describe the item, its
  material/finish/style, and how it is worn. Be specific to what you actually see.
- "category" (string, one of: {", ".join(CATEGORIES)}). Pick the closest match.
  Use "Jewellery" for items like rings, necklaces, earrings, or nose pins.
- "color" (string): the dominant color (e.g. "Silver", "Navy Blue").
- "suggested_price_min" (integer, INR): reasonable estimated price for this item.
- "suggested_price_max" (integer, INR): upper bound of that estimate (>= min).
- "detected_size" (string or null): If a size label, tag, or printed size (e.g.
  S, M, L, XL, or a numeric size) is visible anywhere in these images, report it
  EXACTLY as shown. If no size is visible or legible, return null. Do not guess
  a size that isn't actually visible. This is the single physical size of this
  one item, NOT a list of available sizes.
- "detected_tag_price" (integer or null): If a printed price tag, label, or
  sticker showing a price is visible anywhere in these images, read and report
  that exact number. If no price tag is visible or the text is unreadable,
  return null. Do not estimate or guess a price if no tag is actually visible —
  use suggested_price_min/suggested_price_max for estimation instead; this field
  is only for an actually-read printed price.
- "best_image_frame_names" (array of up to 3 filename strings): choose the
  clearest overall shots of the item itself, avoiding close-ups of tags or
  labels. Pick only from the filenames listed below.

Do not include a "brand" field or a "discount" field.
Do not guess detected_size or detected_tag_price if not clearly visible — return
null instead.

Example of the exact JSON shape expected (follow the shape, not the content):

{{
  "title": "Silver Plated Nose Pin",
  "description": "A delicate silver-toned nose stud with a small floral motif.",
  "category": "Jewellery",
  "color": "Silver",
  "suggested_price_min": 299,
  "suggested_price_max": 599,
  "detected_size": null,
  "detected_tag_price": 349,
  "best_image_frame_names": ["frame_02.jpg", "frame_04.jpg", "frame_05.jpg"]
}}
"""

# Appended at call time with the actual frame filenames sent to Gemini.
FRAME_NAMES_INSTRUCTION = """
The images are provided in this exact order:
{frame_names}
Use these filename strings for best_image_frame_names.
"""

PROMPT_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE)

_CLIENT: genai.Client | None = None


class ProductGenerationError(Exception):
    """Raised when the Gemini call or JSON parsing fails."""


def _client() -> genai.Client:
    # Reuse a single client instance for the process lifetime. Creating a fresh
    # client per call lets it be garbage-collected mid-request ("client closed").
    global _CLIENT
    if _CLIENT is None:
        _CLIENT = genai.Client(api_key=settings.gemini_api_key)
    return _CLIENT


def _validate(draft: dict, valid_frame_names: set[str]) -> dict:
    if not isinstance(draft, dict):
        raise ProductGenerationError("Gemini response was not a JSON object")
    missing = [key for key in REQUIRED_KEYS if key not in draft]
    if missing:
        raise ProductGenerationError(
            f"Gemini response was missing required keys: {missing}"
        )
    if draft.get("category") not in CATEGORIES:
        # Coerce a close but non-standard category into "Other".
        draft["category"] = "Other"

    # detected_size: normalise to a clean string or None.
    size = draft.get("detected_size")
    if isinstance(size, str):
        size = size.strip()
    draft["detected_size"] = size or None

    # detected_tag_price: coerce to int or None; never trust junk OCR values.
    tag_price = draft.get("detected_tag_price")
    if isinstance(tag_price, str) and tag_price.strip().isdigit():
        tag_price = int(tag_price.strip())
    if not isinstance(tag_price, int) or isinstance(tag_price, bool):
        tag_price = None
    draft["detected_tag_price"] = tag_price

    # best_image_frame_names: keep only real filenames we actually sent.
    names = draft.get("best_image_frame_names")
    if not isinstance(names, list):
        names = []
    cleaned = []
    for name in names:
        if not isinstance(name, str):
            continue
        base = os.path.basename(name.strip())
        if base in valid_frame_names and base not in cleaned:
            cleaned.append(base)
    draft["best_image_frame_names"] = cleaned[:3]
    return draft


def generate_product_draft(frame_paths: list[str]) -> dict:
    """Call Gemini with all frames at once and return a structured draft dict."""
    try:
        images = [Image.open(path) for path in frame_paths]
        frame_names = [os.path.basename(path) for path in frame_paths]
        prompt = PROMPT_TEXT + FRAME_NAMES_INSTRUCTION.format(
            frame_names="\n".join(frame_names)
        )

        # Retry transient server-side failures (503 high demand, 429 rate
        # limit) with exponential backoff before giving up.
        for attempt in range(4):
            try:
                response = _client().models.generate_content(
                    model=GEMINI_MODEL,
                    contents=[prompt, *images],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    ),
                )
                break
            except Exception as exc:  # noqa: BLE001 - retry any API hiccup
                last_error = exc
                status = getattr(exc, "code", None)
                message = str(exc)
                transient = status in (429, 500, 503) or "503" in message or "429" in message
                if attempt < 3 and transient:
                    wait = 2**attempt * 3  # 3s, 6s, 12s
                    print(
                        f"[ai_generator] transient error (attempt {attempt + 1}/4), "
                        f"retrying in {wait}s: {message[:120]}"
                    )
                    time.sleep(wait)
                else:
                    raise

        text = response.text
        # Safety net: strip any markdown fence markers the model still adds.
        text = PROMPT_FENCE_RE.sub("", text).strip()
        return _validate(json.loads(text), set(frame_names))
    except ProductGenerationError:
        raise
    except Exception as exc:  # noqa: BLE001 - surface a clear custom exception
        raise ProductGenerationError(
            f"Gemini product draft generation failed: {exc}"
        ) from exc