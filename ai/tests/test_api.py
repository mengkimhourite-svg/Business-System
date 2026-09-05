from datetime import date


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True and body["data"]["provider_enabled"] is False
    assert "api_key" not in str(body).lower()


def test_sales_prediction(client, series):
    r = client.post("/api/ai/sales-prediction", json={"series": series, "horizon_days": 7})
    assert r.status_code == 200
    d = r.json()["data"]
    assert d["type"] == "insight" and d["intent"] == "sales_prediction"
    assert len(d["table_rows"]) == 7 and all(row[1] >= 0 for row in d["table_rows"])
    assert d["metrics"][0]["money"] is True and d["source"] == "rules"


def test_sales_prediction_validation(client):
    r = client.post("/api/ai/sales-prediction", json={"series": []})
    assert r.status_code == 422
    body = r.json()
    assert body["success"] is False and body["message"] == "Validation failed" and "errors" in body


def test_inventory_prediction(client, products):
    r = client.post("/api/ai/inventory-prediction", json={"products": products, "context": {"window_days": 30}})
    d = r.json()["data"]
    assert r.status_code == 200
    names = [row[0] for row in d["table_rows"]]
    assert "Coca-Cola 330ml" in names and "Pringles" in names and "Copy Paper A4" not in names
    assert any(a["level"] == "danger" for a in d["alerts"])  # out of stock
    assert d["metrics"][1]["value"] == 2


def test_customer_analysis(client, customers):
    r = client.post("/api/ai/customer-analysis", json={"customers": customers})
    d = r.json()["data"]
    assert r.status_code == 200
    assert d["metrics"][0]["value"] == 3 and d["metrics"][1]["value"] >= 1  # at-risk detected
    assert d["table_rows"][0][0] == "Ouk Rithy"


def test_recommendations(client, series, products):
    r = client.post("/api/ai/recommendations", json={"series": series, "products": products, "expenses_by_category": {"rent": 600, "utilities": 90}})
    d = r.json()["data"]
    assert r.status_code == 200 and len(d["recommendations"]) >= 3
    texts = " ".join(x["text"] for x in d["recommendations"])
    assert "Restock" in texts and "rent" in texts and "margin" in texts


def test_anomaly_detection(client, series):
    spiky = list(series)
    spiky[10] = {**spiky[10], "revenue": 5000}
    tx = [{"id": i, "number": f"ORD-{i}", "total": 20, "discount": 0, "status": "completed", "hour": 12} for i in range(10)]
    tx.append({"id": 99, "number": "ORD-99", "total": 100, "discount": 60, "status": "completed", "hour": 3})
    r = client.post("/api/ai/anomaly-detection", json={"series": spiky, "transactions": tx})
    d = r.json()["data"]
    assert r.status_code == 200
    types = {row[1] for row in d["table_rows"]}
    assert "Revenue spike" in types and "Unusual discount" in types and "Off-hours sale" in types
    assert d["metrics"][0]["value"] == len(d["table_rows"])


def test_chatbot_intents(client, series, products, customers):
    today = {"date": date.today().isoformat(), "revenue": 313.37, "orders": 12}
    yesterday = {"date": date.today().isoformat(), "revenue": 215.1, "orders": 9}
    cases = {
        "what are today's sales?": "sales_today",
        "which products are low stock?": "low_stock",
        "show top customers": "top_customers",
        "give business recommendations": "recommendations",
        "any suspicious transactions?": "anomalies",
        "compare sales this month vs last month": "compare_months",
    }
    for message, intent in cases.items():
        r = client.post("/api/ai/chatbot", json={"message": message, "series": series, "previous_series": series[:15], "today": today, "yesterday": yesterday, "products": products, "customers": customers})
        assert r.status_code == 200, message
        d = r.json()["data"]
        assert d["intent"] == intent, (message, d["intent"])
    r = client.post("/api/ai/chatbot", json={"message": "compare sales", "series": series, "previous_series": series[:15]})
    assert r.json()["data"]["comparison"]["a_label"] == "This period"


def test_chatbot_unknown_and_validation(client):
    r = client.post("/api/ai/chatbot", json={"message": "lorem ipsum"})
    assert r.status_code == 200 and r.json()["data"]["intent"] is None and len(r.json()["data"]["follow_ups"]) >= 3
    r = client.post("/api/ai/chatbot", json={})
    assert r.status_code == 422 and r.json()["success"] is False


def test_internal_key_enforced(monkeypatch, series):
    from app.config import get_settings
    from app.main import app
    from fastapi.testclient import TestClient
    monkeypatch.setenv("INTERNAL_API_KEY", "secret-123")
    get_settings.cache_clear()
    c = TestClient(app)
    assert c.post("/api/ai/sales-prediction", json={"series": series}).status_code == 401
    assert c.post("/api/ai/sales-prediction", json={"series": series}, headers={"X-Internal-Key": "secret-123"}).status_code == 200
    get_settings.cache_clear()


def test_provider_failure_falls_back(monkeypatch, series):
    """With a provider key configured but the provider unreachable, the rule-based insight is still returned."""
    from app.config import get_settings
    from app.main import app
    from fastapi.testclient import TestClient
    monkeypatch.setenv("AI_API_KEY", "test-key")
    monkeypatch.setenv("AI_BASE_URL", "http://127.0.0.1:9/v1")  # closed port → network error
    monkeypatch.setenv("AI_TIMEOUT_SECONDS", "1")
    get_settings.cache_clear()
    c = TestClient(app)
    r = c.post("/api/ai/sales-prediction", json={"series": series})
    assert r.status_code == 200 and r.json()["data"]["source"] == "rules"
    assert "test-key" not in r.text
    get_settings.cache_clear()
