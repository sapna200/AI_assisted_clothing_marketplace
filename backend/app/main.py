from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import admin_products, products

app = FastAPI(title="AI Clothing Marketplace API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in settings.allowed_origins if not o.startswith("*")],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(
    admin_products.router, prefix="/admin/products", tags=["admin"]
)


@app.get("/")
def health_check():
    return {"status": "ok"}