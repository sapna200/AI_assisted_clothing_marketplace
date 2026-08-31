from fastapi import FastAPI

from app.core.config import settings
from app.routers import admin_products, products

app = FastAPI(title="AI Clothing Marketplace API")


class DynamicCORS:
    """ASGI middleware with wildcard origin matching for CORS."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Extract origin header
        origin = None
        for header_name, header_value in scope.get("headers", []):
            if header_name == b"origin":
                origin = header_value.decode("utf-8")
                break

        # Handle OPTIONS preflight
        if scope["method"] == "OPTIONS" and origin and settings.is_origin_allowed(origin):
            await send({
                "type": "http.response.start",
                "status": 200,
                "headers": [
                    (b"access-control-allow-origin", origin.encode("utf-8")),
                    (b"access-control-allow-credentials", b"true"),
                    (b"access-control-allow-methods", b"*"),
                    (b"access-control-allow-headers", b"*"),
                    (b"access-control-max-age", b"600"),
                    (b"content-type", b"text/plain"),
                ],
            })
            await send({"type": "http.response.body", "body": b""})
            return

        # Wrap send to inject CORS headers on responses
        if origin and settings.is_origin_allowed(origin):
            async def send_with_cors(message):
                if message["type"] == "http.response.start":
                    headers = list(message.get("headers", []))
                    headers.append((b"access-control-allow-origin", origin.encode("utf-8")))
                    headers.append((b"access-control-allow-credentials", b"true"))
                    headers.append((b"access-control-allow-methods", b"*"))
                    headers.append((b"access-control-allow-headers", b"*"))
                    message["headers"] = headers
                await send(message)
            await self.app(scope, receive, send_with_cors)
        else:
            await self.app(scope, receive, send)


app.add_middleware(DynamicCORS)

app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(
    admin_products.router, prefix="/admin/products", tags=["admin"]
)


@app.get("/")
def health_check():
    return {"status": "ok"}