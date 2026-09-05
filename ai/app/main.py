"""Smart Business System — AI microservice (FastAPI). Run: uvicorn app.main:app --host 0.0.0.0 --port 8001"""
import logging
import time
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import get_settings
from app.routers import ai
from app.services.provider import ProviderError

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
settings = get_settings()

app = FastAPI(title=settings.app_name, version="1.0.0", docs_url="/docs" if settings.app_env != "production" else None, redoc_url=None)

# CORS — allow the React dev server to call this service directly (browser) or via Laravel (server-to-server)
cors_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()] if hasattr(settings, 'cors_origins') and settings.cors_origins else [
    "http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai.router)


@app.middleware("http")
async def access_log(request: Request, call_next):
    path = request.url.path
    if not path.startswith("/api/ai/"):
        return await call_next(request)

    started = time.perf_counter()
    response = await call_next(request)
    elapsed = int((time.perf_counter() - started) * 1000)
    logging.getLogger("sbs.ai").info("[AI] %s %s %s %dms", request.method, path, response.status_code, elapsed)
    return response


@app.get("/health", tags=["system"])
async def health():
    return {"success": True, "message": "ok", "data": {"service": settings.app_name, "provider_enabled": settings.provider_enabled, "model": settings.ai_model if settings.provider_enabled else None}}


# ---- clean, structured errors (never stack traces) ----
@app.exception_handler(RequestValidationError)
async def validation_handler(_: Request, exc: RequestValidationError):
    errors: dict[str, list[str]] = {}
    for e in exc.errors():
        loc = ".".join(str(p) for p in e.get("loc", []) if p not in ("body",)) or "body"
        errors.setdefault(loc, []).append(e.get("msg", "Invalid value"))
    return JSONResponse(status_code=422, content={"success": False, "message": "Validation failed", "errors": errors})


@app.exception_handler(StarletteHTTPException)
async def http_handler(_: Request, exc: StarletteHTTPException):
    detail = exc.detail if isinstance(exc.detail, dict) else {"message": str(exc.detail)}
    return JSONResponse(status_code=exc.status_code, content={"success": False, **detail})


@app.exception_handler(ProviderError)
async def provider_handler(_: Request, exc: ProviderError):
    return JSONResponse(status_code=exc.status, content={"success": False, "message": str(exc)})


@app.exception_handler(Exception)
async def unhandled_handler(_: Request, exc: Exception):
    logging.getLogger("sbs.ai").exception("unhandled error")
    return JSONResponse(status_code=500, content={"success": False, "message": "Something went wrong. Please try again."})
