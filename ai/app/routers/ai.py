"""AI endpoints. Auth: Laravel → FastAPI server-to-server via X-Internal-Key (when configured)."""
from fastapi import APIRouter, Depends, Header, HTTPException

from app.config import get_settings
from app.schemas.common import Envelope, Insight
from app.schemas.requests import (
    AnomalyDetectionRequest, ChatRequest, CustomerAnalysisRequest,
    InventoryPredictionRequest, RecommendationsRequest, SalesPredictionRequest,
)
from app.services import analytics
from app.services.provider import safe_enrich

router = APIRouter(prefix="/api/ai", tags=["ai"])


async def require_internal_key(x_internal_key: str | None = Header(default=None)):
    expected = get_settings().internal_api_key
    if expected and x_internal_key != expected:
        raise HTTPException(status_code=401, detail="Unauthenticated")
    return True


def ok(data: Insight) -> Envelope[Insight]:
    return Envelope[Insight](success=True, message="Success", data=data)


@router.post("/sales-prediction", response_model=Envelope[Insight], dependencies=[Depends(require_internal_key)])
async def sales_prediction(req: SalesPredictionRequest):
    return ok(await safe_enrich(analytics.sales_prediction(req), req.context.language))


@router.post("/inventory-prediction", response_model=Envelope[Insight], dependencies=[Depends(require_internal_key)])
async def inventory_prediction(req: InventoryPredictionRequest):
    return ok(await safe_enrich(analytics.inventory_prediction(req), req.context.language))


@router.post("/customer-analysis", response_model=Envelope[Insight], dependencies=[Depends(require_internal_key)])
async def customer_analysis(req: CustomerAnalysisRequest):
    return ok(await safe_enrich(analytics.customer_analysis(req), req.context.language))


@router.post("/recommendations", response_model=Envelope[Insight], dependencies=[Depends(require_internal_key)])
async def recommendations(req: RecommendationsRequest):
    return ok(await safe_enrich(analytics.recommendations(req), req.context.language))


@router.post("/anomaly-detection", response_model=Envelope[Insight], dependencies=[Depends(require_internal_key)])
async def anomaly_detection(req: AnomalyDetectionRequest):
    return ok(await safe_enrich(analytics.anomaly_detection(req), req.context.language))


@router.post("/chatbot", response_model=Envelope[Insight], dependencies=[Depends(require_internal_key)])
async def chatbot(req: ChatRequest):
    if not req.message and not req.intent:
        raise HTTPException(status_code=422, detail={"message": "message or intent is required"})
    ins = await analytics.chat(req)
    return ok(await safe_enrich(ins, req.context.language))
