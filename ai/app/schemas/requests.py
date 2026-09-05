"""Request payloads. Laravel sends ONLY authorized, aggregated business data — never credentials or unrelated tenants."""
from __future__ import annotations

import datetime as _dt
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class DailyPoint(BaseModel):
    date: _dt.date
    revenue: float = Field(ge=0)
    orders: int = Field(0, ge=0)
    cogs: float = Field(0, ge=0)


class ProductStat(BaseModel):
    id: int | str
    name: str
    sku: Optional[str] = None
    stock: float = Field(0, ge=0)
    reorder_level: float = Field(0, ge=0)
    sold_qty: float = Field(0, ge=0)   # units sold in the analysis window
    revenue: float = Field(0, ge=0)
    cost_price: float = Field(0, ge=0)
    selling_price: float = Field(0, ge=0)
    supplier: Optional[str] = None
    category: Optional[str] = None


class CustomerStat(BaseModel):
    id: int | str
    name: str
    orders: int = Field(0, ge=0)
    total_spent: float = Field(0, ge=0)
    last_order_at: Optional[_dt.date] = None
    type: Optional[str] = None


class Transaction(BaseModel):
    id: int | str
    number: Optional[str] = None
    total: float = Field(ge=0)
    discount: float = Field(0, ge=0)
    status: str = "completed"
    payment_status: str = "paid"
    payment_method: Optional[str] = None
    hour: Optional[int] = Field(None, ge=0, le=23)
    date: Optional[_dt.date] = None
    user: Optional[str] = None


class Context(BaseModel):
    business_name: Optional[str] = None
    currency: str = "USD"
    exchange_rate: float = Field(4047, gt=0)
    language: str = "en"
    role: Optional[str] = None
    page: Optional[str] = None
    window_days: int = Field(30, ge=1, le=366)


class SalesPredictionRequest(BaseModel):
    context: Context = Field(default_factory=Context)
    series: list[DailyPoint]
    horizon_days: int = Field(7, ge=1, le=90)

    @field_validator("series")
    @classmethod
    def _non_empty(cls, v):
        if not v:
            raise ValueError("series must contain at least one point")
        return v


class InventoryPredictionRequest(BaseModel):
    context: Context = Field(default_factory=Context)
    products: list[ProductStat]


class CustomerAnalysisRequest(BaseModel):
    context: Context = Field(default_factory=Context)
    customers: list[CustomerStat]


class RecommendationsRequest(BaseModel):
    context: Context = Field(default_factory=Context)
    series: list[DailyPoint] = Field(default_factory=list)
    products: list[ProductStat] = Field(default_factory=list)
    customers: list[CustomerStat] = Field(default_factory=list)
    expenses_by_category: dict[str, float] = Field(default_factory=dict)


class AnomalyDetectionRequest(BaseModel):
    context: Context = Field(default_factory=Context)
    series: list[DailyPoint] = Field(default_factory=list)
    transactions: list[Transaction] = Field(default_factory=list)
    products: list[ProductStat] = Field(default_factory=list)


class ChatRequest(BaseModel):
    context: Context = Field(default_factory=Context)
    message: Optional[str] = Field(None, max_length=2000)
    intent: Optional[str] = None
    series: list[DailyPoint] = Field(default_factory=list)
    previous_series: list[DailyPoint] = Field(default_factory=list)
    today: Optional[DailyPoint] = None
    yesterday: Optional[DailyPoint] = None
    products: list[ProductStat] = Field(default_factory=list)
    customers: list[CustomerStat] = Field(default_factory=list)
    transactions: list[Transaction] = Field(default_factory=list)
    expenses_by_category: dict[str, float] = Field(default_factory=dict)
    history: list[dict[str, str]] = Field(default_factory=list, max_length=20)

    @field_validator("history")
    @classmethod
    def _history_shape(cls, v):
        for m in v:
            if m.get("role") not in {"user", "assistant"} or "content" not in m:
                raise ValueError("history items need role (user|assistant) and content")
        return v
