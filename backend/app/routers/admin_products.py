"""Admin/owner-only product ingestion endpoints.

Kept separate from the public products router. There is no auth yet, but this
is structurally an owner-only action.
"""

import os
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db, SessionLocal
from app.models.product import Product
from app.schemas.product import ProductOut
from app.services.ai_product_generator import CATEGORIES
from app.services.product_ingestion import process_video_and_create_draft
from app.services.storage import delete_objects_by_public_urls

router = APIRouter()

TEMP_UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "temp_uploads",
)


class ApproveRequest(BaseModel):
    # Owner override: if provided, always wins over AI suggestions.
    base_price: float | None = None


class ProductUpdate(BaseModel):
    """Partial owner edit. Only provided (non-None) fields are applied."""

    title: str | None = None
    description: str | None = None
    brand: str | None = None
    category: str | None = None
    color: str | None = None
    sizes: str | None = None
    base_price: float | None = None
    discount_percent: int | None = None
    # Sent as a real JSON array; stored comma-separated like `sizes`.
    image_urls: list[str] | None = None


@router.get("", response_model=list[ProductOut])
def list_admin_products(
    status: str = "pending_review",
    search: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Product)
    if status != "all":
        query = query.filter(Product.status == status)
    if search:
        like = f"%{search}%"
        query = query.filter(Product.title.ilike(like) | Product.brand.ilike(like))
    return query.order_by(Product.created_at.desc()).all()


@router.patch("/{product_id}", response_model=ProductOut)
def update_pending_product(
    product_id: int,
    update: ProductUpdate,
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.status != "pending_review":
        raise HTTPException(
            status_code=400,
            detail="Only pending_review drafts can be edited "
            "(approved products are locked in this iteration).",
        )

    changes = update.model_dump(exclude_unset=True)

    if "title" in changes:
        title = (changes["title"] or "").strip()
        if not title:
            raise HTTPException(status_code=400, detail="Title cannot be empty")
        product.title = title

    if "description" in changes:
        description = (changes["description"] or "").strip()
        if not description:
            raise HTTPException(status_code=400, detail="Description cannot be empty")
        product.description = description

    for field in ("brand", "color"):
        if field in changes and changes[field] is not None:
            setattr(product, field, changes[field].strip())

    if "category" in changes and changes["category"] is not None:
        category = changes["category"].strip()
        if category not in CATEGORIES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid category {category!r}. Must be one of: "
                + ", ".join(CATEGORIES),
            )
        product.category = category

    if "sizes" in changes and changes["sizes"] is not None:
        product.sizes = ", ".join(
            s.strip() for s in changes["sizes"].split(",") if s.strip()
        )

    if "base_price" in changes:
        price = changes["base_price"]
        if price is not None and price < 0:
            raise HTTPException(status_code=400, detail="Price cannot be negative")
        product.base_price = price

    if "discount_percent" in changes and changes["discount_percent"] is not None:
        product.discount_percent = max(0, min(90, int(changes["discount_percent"])))

    if "image_urls" in changes and changes["image_urls"] is not None:
        cleaned = [u.strip() for u in changes["image_urls"] if u.strip()]
        product.image_urls = ",".join(cleaned)

    db.commit()
    db.refresh(product)
    print(f"[admin] updated pending draft id={product_id}")
    return product


@router.delete("/{product_id}")
def reject_pending_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.status != "pending_review":
        raise HTTPException(
            status_code=400,
            detail=f"Only pending_review products can be rejected "
            f"(current status: {product.status})",
        )

    # Best-effort cleanup of the uploaded video + display images.
    urls = [product.video_url] + (product.image_urls or "").split(",")
    urls = [u for u in urls if u]
    delete_objects_by_public_urls(urls)

    db.delete(product)
    db.commit()
    print(f"[admin] rejected (deleted) draft id={product_id}")
    return {"message": "Draft rejected and deleted", "id": product_id}


def _resolve_base_price(product: Product, override: float | None) -> float | None:
    """Resolve base_price at approval time.

    Priority: explicit owner override > detected tag price > suggested min.
    Returns None when no price source exists at all.
    """
    if override is not None:
        return float(override)
    if product.detected_tag_price is not None:
        return float(product.detected_tag_price)
    if product.suggested_price_min is not None:
        return float(product.suggested_price_min)
    return None


@router.patch("/{product_id}/approve", response_model=ProductOut)
def approve_product(
    product_id: int,
    request: ApproveRequest | None = None,
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.status != "pending_review":
        raise HTTPException(
            status_code=400,
            detail=f"Only pending_review products can be approved "
            f"(current status: {product.status})",
        )

    override = request.base_price if request else None
    resolved = _resolve_base_price(product, override)
    if resolved is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "No price available: set base_price manually before approving "
                "(no detected tag price and no AI suggestion on this draft)."
            ),
        )

    product.base_price = resolved
    product.status = "approved"
    db.commit()
    db.refresh(product)

    if override is not None:
        source = "owner-provided"
    elif (
        product.detected_tag_price is not None
        and resolved == float(product.detected_tag_price)
    ):
        source = "detected_tag_price"
    else:
        source = "suggested_price_min"
    print(
        f"[admin] approved product id={product_id} with base_price="
        f"{product.base_price} (source: {source})"
    )
    return product

@router.post("/upload-video")
async def upload_video(
    file: UploadFile, background_tasks: BackgroundTasks
) -> dict:
    os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)

    # Unique filename to avoid collisions between concurrent uploads.
    ext = os.path.splitext(file.filename or "")[1] or ".mp4"
    temp_path = os.path.join(
        TEMP_UPLOAD_DIR, f"{uuid.uuid4().hex}{ext}"
    )

    # 1) Persist the uploaded bytes to a local temp file.
    with open(temp_path, "wb") as out:
        while chunk := await file.read(1024 * 1024):
            out.write(chunk)

    # 2) Return immediately; process AI draft in the background.
    background_tasks.add_task(
        process_video_and_create_draft, temp_path, SessionLocal
    )

    return {
        "message": "Video received, processing started",
        "status": "processing",
        "file_id": os.path.basename(temp_path),
        "note": (
            "AI-generated fields (sizes from tag, detected tag price, images) "
            "are SUGGESTIONS ONLY — confirm or correct them during owner "
            "review before approving the product."
        ),
    }