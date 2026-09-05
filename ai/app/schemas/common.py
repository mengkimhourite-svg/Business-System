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


class Alert(BaseModel):
    level: Literal["info", "warning", "danger"] = "warning"
    title: str
    message: str


class Recommendation(BaseModel):
    text: str
    impact: Literal["low", "medium", "high"] = "medium"


class Comparison(BaseModel):
    a_label: str
    a: float
    b_label: str
    b: float
    money: bool = True
    change: Optional[float] = None


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


class Envelope(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Success"
    data: Optional[T] = None


class ErrorEnvelope(BaseModel):
    success: bool = False
    message: str
    errors: Optional[dict[str, Any]] = None
