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

    model_config = {"json_schema_extra": {"examples": [{"date": "2026-09-01", "revenue": 312.5, "orders": 8, "cogs": 187.5}]}}


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

    model_config = {"json_schema_extra": {"examples": [{"id": 1, "name": "Coca-Cola 330ml", "sku": "CC330", "stock": 12, "reorder_level": 48, "sold_qty": 180, "revenue": 108, "cost_price": 0.35, "selling_price": 0.6, "supplier": "Cambodia Beverage Co.", "category": "Beverages"}]}}


class CustomerStat(BaseModel):
    id: int | str
    name: str
    orders: int = Field(0, ge=0)
    total_spent: float = Field(0, ge=0)
    last_order_at: Optional[_dt.date] = None
    type: Optional[str] = None

    model_config = {"json_schema_extra": {"examples": [{"id": 1, "name": "Ouk Rithy", "orders": 11, "total_spent": 946.04, "last_order_at": "2026-08-30", "type": "retail"}]}}


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

    model_config = {"json_schema_extra": {"examples": [{"id": 101, "number": "ORD-101", "total": 25.5, "discount": 0, "status": "completed", "payment_status": "paid", "payment_method": "cash", "hour": 14, "date": "2026-09-01", "user": "cashier1"}]}}


class Context(BaseModel):
    business_name: Optional[str] = None
    currency: str = "USD"
    exchange_rate: float = Field(4047, gt=0)
    language: str = "en"
    role: Optional[str] = None
    page: Optional[str] = None
    window_days: int = Field(30, ge=1, le=366)

    model_config = {"json_schema_extra": {"examples": [{"business_name": "SBS Demo Store", "currency": "USD", "exchange_rate": 4047, "language": "en", "role": "admin", "page": "dashboard", "window_days": 30}]}}


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

    model_config = {"json_schema_extra": {"examples": [{"context": {"business_name": "SBS Demo Store", "currency": "USD"}, "series": [{"date": "2026-08-01", "revenue": 200, "orders": 5}, {"date": "2026-08-02", "revenue": 225, "orders": 6}], "horizon_days": 7}]}}


class InventoryPredictionRequest(BaseModel):
    context: Context = Field(default_factory=Context)
    products: list[ProductStat]

    model_config = {"json_schema_extra": {"examples": [{"context": {"business_name": "SBS Demo Store"}, "products": [{"id": 1, "name": "Coca-Cola 330ml", "stock": 12, "reorder_level": 48, "sold_qty": 180, "revenue": 108, "cost_price": 0.35, "selling_price": 0.6, "supplier": "Cambodia Beverage Co."}]}]}}


class CustomerAnalysisRequest(BaseModel):
    context: Context = Field(default_factory=Context)
    customers: list[CustomerStat]

    model_config = {"json_schema_extra": {"examples": [{"context": {"business_name": "SBS Demo Store"}, "customers": [{"id": 1, "name": "Ouk Rithy", "orders": 11, "total_spent": 946.04, "last_order_at": "2026-08-30"}, {"id": 2, "name": "Sok Dara", "orders": 4, "total_spent": 120.5, "last_order_at": "2026-06-01"}]}]}}


class RecommendationsRequest(BaseModel):
    context: Context = Field(default_factory=Context)
    series: list[DailyPoint] = Field(default_factory=list)
    products: list[ProductStat] = Field(default_factory=list)
    customers: list[CustomerStat] = Field(default_factory=list)
    expenses_by_category: dict[str, float] = Field(default_factory=dict)

    @field_validator("expenses_by_category", mode="before")
    @classmethod
    def _ensure_dict(cls, v):
        if isinstance(v, list):
            return {}
        return v

    model_config = {"json_schema_extra": {"examples": [{"context": {"business_name": "SBS Demo Store"}, "series": [{"date": "2026-08-01", "revenue": 200, "orders": 5}], "products": [{"id": 1, "name": "Coca-Cola 330ml", "stock": 12, "reorder_level": 48, "sold_qty": 180, "revenue": 108, "cost_price": 0.35, "selling_price": 0.6}], "expenses_by_category": {"rent": 600, "utilities": 90}}]}}


class AnomalyDetectionRequest(BaseModel):
    context: Context = Field(default_factory=Context)
    series: list[DailyPoint] = Field(default_factory=list)
    transactions: list[Transaction] = Field(default_factory=list)
    products: list[ProductStat] = Field(default_factory=list)

    model_config = {"json_schema_extra": {"examples": [{"context": {"business_name": "SBS Demo Store"}, "series": [{"date": "2026-08-01", "revenue": 200, "orders": 5}], "transactions": [{"id": 101, "number": "ORD-101", "total": 25.5, "discount": 0, "status": "completed", "hour": 14}], "products": [{"id": 1, "name": "Coca-Cola 330ml", "stock": 12, "reorder_level": 48, "sold_qty": 180, "revenue": 108, "cost_price": 0.35, "selling_price": 0.6}]}]}}


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

    @field_validator("expenses_by_category", mode="before")
    @classmethod
    def _ensure_dict(cls, v):
        if isinstance(v, list):
            return {}
        return v

    @field_validator("history")
    @classmethod
    def _history_shape(cls, v):
        for m in v:
            if m.get("role") not in {"user", "assistant"} or "content" not in m:
                raise ValueError("history items need role (user|assistant) and content")
        return v

    model_config = {"json_schema_extra": {"examples": [{"context": {"business_name": "SBS Demo Store", "currency": "USD", "language": "en"}, "message": "What are today's sales?", "series": [{"date": "2026-09-01", "revenue": 312.5, "orders": 8}], "today": {"date": "2026-09-10", "revenue": 425.0, "orders": 12}, "yesterday": {"date": "2026-09-09", "revenue": 380.0, "orders": 10}, "products": [{"id": 1, "name": "Coca-Cola 330ml", "sku": "CC330", "stock": 12, "reorder_level": 48, "sold_qty": 180, "revenue": 108, "cost_price": 0.35, "selling_price": 0.6, "supplier": "Cambodia Beverage Co."}], "customers": [{"id": 1, "name": "Ouk Rithy", "orders": 11, "total_spent": 946.04, "last_order_at": "2026-08-30"}], "history": [{"role": "user", "content": "Hello"}, {"role": "assistant", "content": "Hi! How can I help?"}]}]}}
