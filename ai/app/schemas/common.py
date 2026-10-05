"""Shared response envelope + building blocks for structured business answers."""
from typing import Any, Generic, Literal, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class Metric(BaseModel):
    label: str
    value: float | int | str
    money: bool = False
    unit: Optional[str] = None
    change: Optional[float] = None  # percent vs previous period

    model_config = {"json_schema_extra": {"examples": [{"label": "Forecast total", "value": 2850.0, "money": True}]}}


class Alert(BaseModel):
    level: Literal["info", "warning", "danger"] = "warning"
    title: str
    message: str

    model_config = {"json_schema_extra": {"examples": [{"level": "warning", "title": "Reorder soon", "message": "2 products are at or below their reorder level."}]}}


class Recommendation(BaseModel):
    text: str
    impact: Literal["low", "medium", "high"] = "medium"

    model_config = {"json_schema_extra": {"examples": [{"text": "Restock Coca-Cola 330ml — it is below reorder level.", "impact": "high"}]}}


class Comparison(BaseModel):
    a_label: str
    a: float
    b_label: str
    b: float
    money: bool = True
    change: Optional[float] = None

    model_config = {"json_schema_extra": {"examples": [{"a_label": "This period", "a": 3125.0, "b_label": "Previous period", "b": 2850.0, "money": True, "change": 9.6}]}}


class Insight(BaseModel):
    """Structured answer rendered by the React AI panel (KPI / list / table / alert / recommendation / comparison)."""
    type: str = "insight"
    intent: Optional[str] = None
    title: str
    summary: str
    metrics: list[Metric] = Field(default_factory=list)
    alerts: list[Alert] = Field(default_factory=list)
    recommendations: list[Recommendation] = Field(default_factory=list)
    table_columns: list[str] = Field(default_factory=list)
    table_rows: list[list[Any]] = Field(default_factory=list)
    comparison: Optional[Comparison] = None
    follow_ups: list[str] = Field(default_factory=list)
    confidence: float = Field(0.8, ge=0, le=1)
    source: Literal["rules", "provider"] = "rules"

    model_config = {"json_schema_extra": {"examples": [{"type": "insight", "intent": "sales_prediction", "title": "Sales forecast", "summary": "Sales momentum is positive (+5.2% week over week). Projected revenue for the next 7 days is about 2,850.00.", "metrics": [{"label": "Forecast total", "value": 2850.0, "money": True}, {"label": "Avg. daily (forecast)", "value": 407.14, "money": True}], "alerts": [], "recommendations": [{"text": "Keep best sellers in stock ahead of the forecast period.", "impact": "medium"}], "table_columns": ["Date", "Projected revenue"], "table_rows": [["2026-09-11", 410.5], ["2026-09-12", 415.2]], "follow_ups": ["top_products", "why_sales_changed"], "confidence": 0.72, "source": "rules"}]}}


class Envelope(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Success"
    data: Optional[T] = None

    model_config = {"json_schema_extra": {"examples": [{"success": True, "message": "Success", "data": {"type": "insight", "intent": "sales_prediction", "title": "Sales forecast", "summary": "Sales momentum is positive.", "metrics": [], "alerts": [], "recommendations": [], "table_columns": [], "table_rows": [], "follow_ups": [], "confidence": 0.72, "source": "rules"}}]}}


class ErrorEnvelope(BaseModel):
    success: bool = False
    message: str
    errors: Optional[dict[str, Any]] = None

    model_config = {"json_schema_extra": {"examples": [{"success": False, "message": "Validation failed", "errors": {"series": ["Field required"]}}]}}
