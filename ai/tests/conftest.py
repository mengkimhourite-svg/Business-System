import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("AI_API_KEY", "")  # rule-based mode in tests (no external calls)
os.environ.setdefault("INTERNAL_API_KEY", "")
import pytest
from fastapi.testclient import TestClient
from app.config import get_settings
from app.main import app


@pytest.fixture(scope="session")
def client():
    get_settings.cache_clear()
    return TestClient(app)


@pytest.fixture
def series():
    from datetime import date, timedelta
    base = date(2026, 8, 1)
    return [{"date": (base + timedelta(days=i)).isoformat(), "revenue": 200 + (i % 7) * 25 + i * 3, "orders": 5 + i % 4, "cogs": 120 + (i % 7) * 10} for i in range(30)]


@pytest.fixture
def products():
    return [
        {"id": 1, "name": "Coca-Cola 330ml", "stock": 12, "reorder_level": 48, "sold_qty": 180, "revenue": 108, "cost_price": 0.35, "selling_price": 0.6, "supplier": "Cambodia Beverage Co."},
        {"id": 2, "name": "Pringles", "stock": 0, "reorder_level": 12, "sold_qty": 30, "revenue": 57, "cost_price": 1.2, "selling_price": 1.9, "supplier": "PP Fresh"},
        {"id": 3, "name": "Copy Paper A4", "stock": 45, "reorder_level": 20, "sold_qty": 0, "revenue": 0, "cost_price": 3.6, "selling_price": 5.2, "supplier": "Office Pro"},
        {"id": 4, "name": "Cheap Item", "stock": 40, "reorder_level": 10, "sold_qty": 20, "revenue": 22, "cost_price": 1.0, "selling_price": 1.1},
    ]


@pytest.fixture
def customers():
    return [
        {"id": 1, "name": "Ouk Rithy", "orders": 11, "total_spent": 946.04, "last_order_at": "2026-08-30"},
        {"id": 2, "name": "Sok Dara", "orders": 4, "total_spent": 120.5, "last_order_at": "2026-06-01"},
        {"id": 3, "name": "New Guy", "orders": 1, "total_spent": 9.9, "last_order_at": "2026-08-29"},
    ]
