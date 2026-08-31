from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import settings
from app.routers import admin_products, products

app = FastAPI(title="AI Clothing Marketplace API")


class DynamicCORS(BaseHTTPMiddleware):
    """CORS middleware that uses wildcard matching for allowed origins."""

    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin")
        response: Response = await call_next(request)

        if origin and settings.is_origin_allowed(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "*"

            # Handle preflight
            if request.method == "OPTIONS":
                response.headers["Access-Control-Max-Age"] = "600"
                response.status_code = 200

        return response


app.add_middleware(DynamicCORS)

app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(
    admin_products.router, prefix="/admin/products", tags=["admin"]
)


@app.get("/")
def health_check():
    return {"status": "ok"}