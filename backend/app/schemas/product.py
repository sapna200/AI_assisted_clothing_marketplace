from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class ProductBase(BaseModel):
    title: str
    description: str
    brand: str | None = None
    category: str
    color: str
    sizes: str = ""
    # base_price optional because AI drafts awaiting review have no price yet.
    base_price: float | None = None
    discount_percent: int = 0
    # Stored as a comma-separated string in the DB (same pattern as `sizes`).
    image_urls: str | None = None
    video_url: str | None = None
    suggested_price_min: int | None = None
    suggested_price_max: int | None = None
    # Price read off a visible tag in the video — a SUGGESTION only.
    detected_tag_price: int | None = None


class ProductCreate(ProductBase):
    pass


class ProductOut(ProductBase):
    id: int
    status: str
    created_at: datetime
    owner_id: int | None = None
    # Exposed to clients as a real list instead of the raw comma-string.
    image_urls: list[str] = []

    @field_validator("image_urls", mode="before")
    @classmethod
    def split_image_urls(cls, value):
        if value is None or value == "":
            return []
        if isinstance(value, str):
            return [url.strip() for url in value.split(",") if url.strip()]
        return value

    model_config = ConfigDict(from_attributes=True)