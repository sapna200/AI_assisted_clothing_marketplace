from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import check_db_health
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
def root():
    return {"app": "ShopKart API", "status": "ok"}


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    db_healthy = check_db_health()
    status = "healthy" if db_healthy else "degraded"
    status_code = 200 if db_healthy else 503
    return JSONResponse(
        content={
            "status": status,
            "checks": {
                "database": "ok" if db_healthy else "error",
            },
        },
        status_code=status_code,
    )