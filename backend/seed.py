from app.core.database import SessionLocal
from app.models.product import Product

products_data = [
    {
        "title": "Men's Cotton Crew Neck T-Shirt",
        "description": "Classic crew neck t-shirt made from 100% combed cotton. Soft, breathable, and perfect for everyday wear.",
        "brand": "Urban Basics",
        "category": "T-Shirts",
        "color": "Navy Blue",
        "sizes": "S,M,L,XL",
        "base_price": 999.00,
        "discount_percent": 0,
        "image_urls": "https://picsum.photos/seed/tshirt1/400/500",
        "status": "approved",
    },
    {
        "title": "Slim Fit Stretch Denim Jeans",
        "description": "Modern slim fit jeans with just the right amount of stretch. Durable denim that moves with you.",
        "brand": "Denim Co.",
        "category": "Jeans",
        "color": "Indigo",
        "sizes": "28,30,32,34,36",
        "base_price": 2499.00,
        "discount_percent": 20,
        "image_urls": "https://picsum.photos/seed/jeans1/400/500",
        "status": "approved",
    },
    {
        "title": "Classic Bomber Jacket",
        "description": "Timeless bomber jacket with a ribbed collar and cuffs. Lightweight yet warm for transitional weather.",
        "brand": "Aviator",
        "category": "Jackets",
        "color": "Olive Green",
        "sizes": "S,M,L,XL",
        "base_price": 3999.00,
        "discount_percent": 15,
        "image_urls": "https://picsum.photos/seed/jacket1/400/500",
        "status": "approved",
    },
    {
        "title": "Floral Summer Midi Dress",
        "description": "Flowy midi dress with a vibrant floral print. Perfect for summer outings and garden parties.",
        "brand": "Bloom",
        "category": "Dresses",
        "color": "Multicolor",
        "sizes": "XS,S,M,L",
        "base_price": 1899.00,
        "discount_percent": 0,
        "image_urls": "https://picsum.photos/seed/dress1/400/500",
        "status": "approved",
    },
    {
        "title": "Oversized Graphic Hoodie",
        "description": "Cozy oversized hoodie with a bold graphic print. Fleece-lined for maximum comfort.",
        "brand": "Streetwear Lab",
        "category": "Hoodies",
        "color": "Charcoal",
        "sizes": "S,M,L,XL,XXL",
        "base_price": 1799.00,
        "discount_percent": 10,
        "image_urls": "https://picsum.photos/seed/hoodie1/400/500",
        "status": "approved",
    },
    {
        "title": "Linen Relaxed Fit Shirt",
        "description": "Breathable linen shirt with a relaxed fit. Ideal for warm climates and beach vacations.",
        "brand": "",
        "category": "Shirts",
        "color": "Beige",
        "sizes": "S,M,L,XL",
        "base_price": 1499.00,
        "discount_percent": 0,
        "image_urls": "https://picsum.photos/seed/shirt1/400/500",
        "status": "approved",
    },
    {
        "title": "High-Waist Pleated Skirt",
        "description": "Elegant high-waist skirt with soft pleats. Pairs beautifully with blouses and knit tops.",
        "brand": "Elegance",
        "category": "Skirts",
        "color": "Black",
        "sizes": "XS,S,M,L",
        "base_price": 1299.00,
        "discount_percent": 0,
        "image_urls": "https://picsum.photos/seed/skirt1/400/500",
        "status": "approved",
    },
    {
        "title": "Cargo Pants with Utility Pockets",
        "description": "Functional cargo pants with multiple utility pockets. Durable fabric for outdoor adventures.",
        "brand": "",
        "category": "Pants",
        "color": "Khaki",
        "sizes": "30,32,34,36",
        "base_price": 2199.00,
        "discount_percent": 25,
        "image_urls": "https://picsum.photos/seed/cargo1/400/500",
        "status": "approved",
    },
]


def seed():
    db = SessionLocal()
    try:
        for item in products_data:
            product = Product(**item)
            db.add(product)
        db.commit()
        print(f"Inserted {len(products_data)} products successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()