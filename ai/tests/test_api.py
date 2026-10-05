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


def test_sales_prediction_with_context(client, series):
    r = client.post("/api/ai/sales-prediction", json={"series": series, "horizon_days": 14, "context": {"business_name": "Test Store", "currency": "USD"}})
    assert r.status_code == 200
    d = r.json()["data"]
    assert len(d["table_rows"]) == 14


def test_sales_prediction_validation(client):
    r = client.post("/api/ai/sales-prediction", json={"series": []})
    assert r.status_code == 422
    body = r.json()
    assert body["success"] is False and body["message"] == "Validation failed" and "errors" in body


def test_sales_prediction_missing_series(client):
    r = client.post("/api/ai/sales-prediction", json={})
    assert r.status_code == 422


def test_inventory_prediction(client, products):
    r = client.post("/api/ai/inventory-prediction", json={"products": products, "context": {"window_days": 30}})
    d = r.json()["data"]
    assert r.status_code == 200
    names = [row[0] for row in d["table_rows"]]
    assert "Coca-Cola 330ml" in names and "Pringles" in names and "Copy Paper A4" not in names
    assert any(a["level"] == "danger" for a in d["alerts"])  # out of stock
    assert d["metrics"][1]["value"] == 2


def test_inventory_prediction_empty_products(client):
    r = client.post("/api/ai/inventory-prediction", json={"products": []})
    assert r.status_code == 200
    d = r.json()["data"]
    assert d["metrics"][0]["value"] == 0


def test_inventory_prediction_null_sku(client):
    products_with_null_sku = [{"id": 1, "name": "Test Product", "sku": None, "stock": 10, "reorder_level": 5, "sold_qty": 20, "revenue": 50, "cost_price": 1.0, "selling_price": 2.5}]
    r = client.post("/api/ai/inventory-prediction", json={"products": products_with_null_sku})
    assert r.status_code == 200


def test_customer_analysis(client, customers):
    r = client.post("/api/ai/customer-analysis", json={"customers": customers})
    d = r.json()["data"]
    assert r.status_code == 200
    assert d["metrics"][0]["value"] == 3 and d["metrics"][1]["value"] >= 1  # at-risk detected
    assert d["table_rows"][0][0] == "Ouk Rithy"


def test_customer_analysis_null_last_order(client):
    customers_null = [{"id": 1, "name": "Test Customer", "orders": 2, "total_spent": 50.0, "last_order_at": None}]
    r = client.post("/api/ai/customer-analysis", json={"customers": customers_null})
    assert r.status_code == 200


def test_recommendations(client, series, products):
    r = client.post("/api/ai/recommendations", json={"series": series, "products": products, "expenses_by_category": {"rent": 600, "utilities": 90}})
    d = r.json()["data"]
    assert r.status_code == 200 and len(d["recommendations"]) >= 3
    texts = " ".join(x["text"] for x in d["recommendations"])
    assert "Restock" in texts and "rent" in texts and "margin" in texts


def test_recommendations_empty_data(client):
    r = client.post("/api/ai/recommendations", json={})
    assert r.status_code == 200
    d = r.json()["data"]
    assert len(d["recommendations"]) >= 1


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


def test_anomaly_detection_missing_status_defaults(client):
    """Transaction status/payment_status default to 'completed'/'paid' when omitted."""
    tx = [{"id": 1, "total": 50, "discount": 0, "hour": 12}]
    r = client.post("/api/ai/anomaly-detection", json={"transactions": tx})
    assert r.status_code == 200


def test_anomaly_detection_empty(client):
    r = client.post("/api/ai/anomaly-detection", json={})
    assert r.status_code == 200
    d = r.json()["data"]
    assert d["metrics"][0]["value"] == 0


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


def test_chatbot_explicit_intent(client, series, products):
    r = client.post("/api/ai/chatbot", json={"intent": "low_stock", "products": products})
    assert r.status_code == 200
    d = r.json()["data"]
    assert d["intent"] == "low_stock"


def test_chatbot_with_history(client, series, products):
    history = [
        {"role": "user", "content": "What are my top products?"},
        {"role": "assistant", "content": "Your top product is Coca-Cola."},
        {"role": "user", "content": "What about revenue?"},
    ]
    r = client.post("/api/ai/chatbot", json={"message": "How is revenue?", "series": series, "products": products, "history": history})
    assert r.status_code == 200
    d = r.json()["data"]
    assert d["source"] == "rules"


def test_chatbot_full_payload(client, series, products, customers):
    today = {"date": date.today().isoformat(), "revenue": 425.0, "orders": 12}
    yesterday = {"date": date.today().isoformat(), "revenue": 380.0, "orders": 10}
    tx = [{"id": 1, "number": "ORD-1", "total": 25.5, "discount": 0, "status": "completed", "hour": 14}]
    r = client.post("/api/ai/chatbot", json={
        "message": "Give me a full business overview",
        "series": series,
        "previous_series": series[:15],
        "today": today,
        "yesterday": yesterday,
        "products": products,
        "customers": customers,
        "transactions": tx,
        "expenses_by_category": {"rent": 600, "utilities": 90},
        "history": [{"role": "user", "content": "Hello"}],
    })
    assert r.status_code == 200
    d = r.json()["data"]
    assert d["type"] == "insight"
    assert d["confidence"] > 0


def test_chatbot_empty_products_customers(client, series):
    r = client.post("/api/ai/chatbot", json={"message": "How are sales?", "series": series})
    assert r.status_code == 200


def test_chatbot_unknown_and_validation(client):
    r = client.post("/api/ai/chatbot", json={"message": "lorem ipsum"})
    assert r.status_code == 200 and r.json()["data"]["intent"] is None and len(r.json()["data"]["follow_ups"]) >= 3
    r = client.post("/api/ai/chatbot", json={})
    assert r.status_code == 422 and r.json()["success"] is False


def test_chatbot_message_too_long(client):
    r = client.post("/api/ai/chatbot", json={"message": "x" * 2001})
    assert r.status_code == 422


def test_chatbot_history_invalid_role(client):
    r = client.post("/api/ai/chatbot", json={"message": "test", "history": [{"role": "admin", "content": "hi"}]})
    assert r.status_code == 422


def test_chatbot_history_missing_content(client):
    r = client.post("/api/ai/chatbot", json={"message": "test", "history": [{"role": "user"}]})
    assert r.status_code == 422


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


def test_internal_key_enforced_all_endpoints(monkeypatch, products, customers, series):
    from app.config import get_settings
    from app.main import app
    from fastapi.testclient import TestClient
    monkeypatch.setenv("INTERNAL_API_KEY", "key-456")
    get_settings.cache_clear()
    c = TestClient(app)
    endpoints = [
        ("POST", "/api/ai/inventory-prediction", {"products": products}),
        ("POST", "/api/ai/customer-analysis", {"customers": customers}),
        ("POST", "/api/ai/recommendations", {"products": products}),
        ("POST", "/api/ai/anomaly-detection", {"series": series}),
        ("POST", "/api/ai/chatbot", {"message": "hi"}),
    ]
    for method, path, body in endpoints:
        assert c.post(path, json=body).status_code == 401, f"{path} should require key"
        assert c.post(path, json=body, headers={"X-Internal-Key": "key-456"}).status_code == 200, f"{path} should accept valid key"
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


def test_provider_failure_chat_falls_back(monkeypatch, products):
    """Chat endpoint falls back to rule-based when provider is unreachable."""
    from app.config import get_settings
    from app.main import app
    from fastapi.testclient import TestClient
    monkeypatch.setenv("AI_API_KEY", "test-key")
    monkeypatch.setenv("AI_BASE_URL", "http://127.0.0.1:9/v1")
    monkeypatch.setenv("AI_TIMEOUT_SECONDS", "1")
    get_settings.cache_clear()
    c = TestClient(app)
    r = c.post("/api/ai/chatbot", json={"message": "low stock", "products": products})
    assert r.status_code == 200
    d = r.json()["data"]
    assert d["intent"] == "low_stock"
    assert d["source"] == "rules"
    get_settings.cache_clear()


def test_response_envelope_format(client, series):
    r = client.post("/api/ai/sales-prediction", json={"series": series})
    body = r.json()
    assert "success" in body and "message" in body and "data" in body
    assert body["success"] is True
    assert body["message"] == "Success"
    d = body["data"]
    assert "type" in d and "intent" in d and "title" in d and "summary" in d
    assert "metrics" in d and "alerts" in d and "recommendations" in d
    assert "table_columns" in d and "table_rows" in d
    assert "follow_ups" in d and "confidence" in d and "source" in d


def test_404_unknown_path(client):
    r = client.get("/api/ai/nonexistent")
    assert r.status_code in (404, 405)


def test_method_not_allowed(client, series):
    r = client.get("/api/ai/sales-prediction")
    assert r.status_code in (404, 405)


def test_chatbot_intent_overrides_detection(client, products):
    r = client.post("/api/ai/chatbot", json={"message": "hello", "intent": "low_stock", "products": products})
    assert r.status_code == 200
    assert r.json()["data"]["intent"] == "low_stock"


def test_chatbot_role_passed_to_context(client, products):
    """Role from the frontend dropdown should appear in the context."""
    r = client.post("/api/ai/chatbot", json={"message": "low stock", "products": products, "context": {"role": "warehouse"}})
    assert r.status_code == 200
    d = r.json()["data"]
    assert d["type"] == "insight"
