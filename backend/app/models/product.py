from sqlalchemy import Column, DateTime, Float, Integer, String, Text, func

from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    brand = Column(String, nullable=True, index=True)
    category = Column(String, nullable=False, index=True)
    color = Column(String, nullable=False)
    sizes = Column(String, nullable=False)
    # base_price is nullable because AI drafts awaiting review have no price yet.
    base_price = Column(Float, nullable=True)
    discount_percent = Column(Integer, default=0)
    # Comma-separated public image URLs (same list-like pattern as `sizes`).
    image_urls = Column(String, nullable=True)
    status = Column(String, default="approved", index=True)
    created_at = Column(DateTime, default=func.now(), index=True)
    # --- AI ingestion pipeline fields (Day 4) ---
    owner_id = Column(Integer, nullable=True)
    video_url = Column(String, nullable=True)
    suggested_price_min = Column(Integer, nullable=True)
    suggested_price_max = Column(Integer, nullable=True)
    # Price read off a visible tag in the video. NEVER auto-copied into
    # base_price — the owner confirms/edits it during review.
    detected_tag_price = Column(Integer, nullable=True)