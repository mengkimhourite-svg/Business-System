"""Rule-based business analytics. Always available; the provider (LLM) only enriches the summary text."""
from __future__ import annotations
from datetime import date, timedelta
from typing import Iterable

from app.schemas.common import Alert, Comparison, Insight, Metric, Recommendation
from app.schemas.requests import (
    AnomalyDetectionRequest, ChatRequest, CustomerAnalysisRequest, DailyPoint,
    InventoryPredictionRequest, ProductStat, RecommendationsRequest, SalesPredictionRequest,
)
from app.utils.stats import linear_forecast, mean, pct_change, round2, zscores


def _sum_rev(points: Iterable[DailyPoint]) -> float:
    return round2(sum(p.revenue for p in points))


# ---------------------------------------------------------------- sales forecast
def sales_prediction(req: SalesPredictionRequest) -> Insight:
    values = [p.revenue for p in req.series]
    forecast = linear_forecast(values, req.horizon_days)
    last = req.series[-1].date
    rows = [[(last + timedelta(days=i + 1)).isoformat(), v] for i, v in enumerate(forecast)]
    recent = values[-7:]
    prev = values[-14:-7] if len(values) >= 14 else values[:-7] or values
    change = pct_change(sum(recent), sum(prev)) if prev else 0.0
    total = round2(sum(forecast))
    trend = "up" if change > 2 else "down" if change < -2 else "flat"
    summary = {
        "up": f"Sales momentum is positive ({change:+.1f}% week over week). Projected revenue for the next {req.horizon_days} days is about {total:,.2f}.",
        "down": f"Sales slowed ({change:+.1f}% week over week). Projected revenue for the next {req.horizon_days} days is about {total:,.2f}.",
        "flat": f"Sales are stable. Projected revenue for the next {req.horizon_days} days is about {total:,.2f}.",
    }[trend]
    recs = [Recommendation(text="Keep best sellers in stock ahead of the forecast period.", impact="medium")]
    if trend == "down":
        recs.insert(0, Recommendation(text="Run a short promotion on top products to recover order volume.", impact="high"))
    return Insight(
        intent="sales_prediction", title="Sales forecast", summary=summary,
        metrics=[
            Metric(label="Forecast total", value=total, money=True),
            Metric(label="Avg. daily (forecast)", value=round2(mean(forecast)), money=True),
            Metric(label="Week over week", value=f"{change:+.1f}%", change=change),
        ],
        table_columns=["Date", "Projected revenue"], table_rows=rows,
        recommendations=recs, follow_ups=["top_products", "why_sales_changed", "reorder"],
        confidence=0.72 if len(values) >= 14 else 0.55,
    )


# ---------------------------------------------------------------- inventory forecast
def inventory_prediction(req: InventoryPredictionRequest) -> Insight:
    days = max(1, req.context.window_days)
    rows, alerts, recs = [], [], []
    at_risk = 0
    for p in sorted(req.products, key=lambda x: x.stock):
        velocity = p.sold_qty / days
        days_left = (p.stock / velocity) if velocity > 0 else None
        low = p.stock <= p.reorder_level
        if low or (days_left is not None and days_left < 7):
            at_risk += 1
            suggested = max(int(p.reorder_level * 2 - p.stock), int(round(velocity * 30)), 1)
            rows.append([p.name, p.stock, round(velocity, 2), (round(days_left, 1) if days_left is not None else "—"), suggested, p.supplier or "—"])
    out = [p for p in req.products if p.stock <= 0]
    if out:
        alerts.append(Alert(level="danger", title="Out of stock", message=f"{len(out)} products are out of stock: " + ", ".join(p.name for p in out[:3]) + ("…" if len(out) > 3 else "")))
    if at_risk:
        alerts.append(Alert(level="warning", title="Reorder soon", message=f"{at_risk} products are at or below their reorder level or will run out within 7 days."))
        recs.append(Recommendation(text=f"Create purchase orders for the {min(at_risk, 5)} most urgent items; group them by supplier to save on shipping.", impact="high"))
    else:
        recs.append(Recommendation(text="Stock levels look healthy — review slow movers to free up capital.", impact="low"))
    return Insight(
        intent="inventory_prediction", title="Inventory forecast",
        summary=f"{at_risk} of {len(req.products)} products need attention in the next week." if req.products else "No product data available.",
        metrics=[Metric(label="Products analysed", value=len(req.products)), Metric(label="Need reorder", value=at_risk), Metric(label="Out of stock", value=len(out))],
        table_columns=["Product", "Stock", "Units/day", "Days left", "Suggested qty", "Supplier"], table_rows=rows[:10],
        alerts=alerts, recommendations=recs, follow_ups=["low_stock", "reorder", "purchases_pending"], confidence=0.78,
    )


# ---------------------------------------------------------------- customer analysis
def customer_analysis(req: CustomerAnalysisRequest) -> Insight:
    cs = req.customers
    today = date.today()
    active = [c for c in cs if c.orders > 0]
    at_risk = [c for c in active if c.last_order_at and (today - c.last_order_at).days > 30]
    spent = sorted(active, key=lambda c: c.total_spent, reverse=True)
    total = sum(c.total_spent for c in active) or 1
    top20 = spent[: max(1, len(spent) // 5)]
    share = round(sum(c.total_spent for c in top20) / total * 100, 1) if spent else 0
    segments = {"vip": [c for c in spent if c.total_spent >= (spent[0].total_spent * 0.5 if spent else 0)], "at_risk": at_risk, "new": [c for c in cs if c.orders <= 1]}
    recs = []
    if at_risk:
        recs.append(Recommendation(text=f"Send a win-back offer to {len(at_risk)} customers who have not purchased in 30+ days.", impact="high"))
    if spent:
        recs.append(Recommendation(text=f"Reward your top customers (e.g. {spent[0].name}) with a loyalty perk — the top 20% drive {share}% of revenue.", impact="medium"))
    return Insight(
        intent="customer_analysis", title="Customer analysis",
        summary=f"{len(active)} active customers; top 20% generate {share}% of revenue; {len(at_risk)} at risk of churning.",
        metrics=[Metric(label="Active", value=len(active)), Metric(label="At risk", value=len(at_risk)), Metric(label="Avg. spent", value=round2(total / max(1, len(active))), money=True)],
        table_columns=["Customer", "Orders", "Total spent", "Segment"],
        table_rows=[[c.name, c.orders, round2(c.total_spent), "VIP" if c in segments["vip"] else "At risk" if c in at_risk else "Regular"] for c in spent[:8]],
        alerts=[Alert(level="warning", title="Customers at risk", message=f"{len(at_risk)} customers have not purchased in over 30 days.")] if at_risk else [],
        recommendations=recs, follow_ups=["top_customers", "inactive_customers", "sales_trend"], confidence=0.75,
    )


# ---------------------------------------------------------------- recommendations
def recommendations(req: RecommendationsRequest) -> Insight:
    recs: list[Recommendation] = []
    days = max(1, req.context.window_days)
    low = [p for p in req.products if p.stock <= p.reorder_level]
    if low:
        recs.append(Recommendation(text=f"Restock {', '.join(p.name for p in sorted(low, key=lambda x: x.stock)[:3])} — they are at or below reorder level.", impact="high"))
    top = sorted(req.products, key=lambda p: p.revenue, reverse=True)[:3]
    if top:
        recs.append(Recommendation(text=f"Feature your best sellers near checkout: {', '.join(p.name for p in top)}.", impact="medium"))
    slow = [p for p in req.products if p.sold_qty == 0 and p.stock > 0]
    if slow:
        recs.append(Recommendation(text=f"{len(slow)} products had no sales in {days} days — bundle, discount or discontinue them to free capital.", impact="medium"))
    margins = [(p, (p.selling_price - p.cost_price) / p.selling_price * 100) for p in req.products if p.selling_price > 0]
    thin = [p for p, m in margins if m < 20]
    if thin:
        recs.append(Recommendation(text=f"{len(thin)} products have a gross margin under 20% — review pricing or supplier costs.", impact="medium"))
    if req.series:
        vals = [p.revenue for p in req.series]
        ch = pct_change(sum(vals[-7:]), sum(vals[-14:-7]) if len(vals) >= 14 else sum(vals[:-7]) or sum(vals))
        if ch < -5:
            recs.append(Recommendation(text=f"Revenue fell {abs(ch):.1f}% week over week — run a targeted promotion and check staffing during peak hours.", impact="high"))
    if req.expenses_by_category:
        cat, amt = max(req.expenses_by_category.items(), key=lambda kv: kv[1])
        tot = sum(req.expenses_by_category.values()) or 1
        recs.append(Recommendation(text=f"'{cat}' is your largest expense ({amt / tot * 100:.0f}% of spend) — review recurring costs there first.", impact="low"))
    if not recs:
        recs.append(Recommendation(text="Operations look healthy. Keep monitoring stock levels and weekly sales trends.", impact="low"))
    return Insight(intent="recommendations", title="Business recommendations", summary=f"{len(recs)} actions ranked by impact.", recommendations=recs, follow_ups=["low_stock", "top_products", "expenses"], confidence=0.7)


# ---------------------------------------------------------------- anomaly detection
def anomaly_detection(req: AnomalyDetectionRequest) -> Insight:
    alerts: list[Alert] = []
    rows: list[list] = []
    if len(req.series) >= 7:
        zs = zscores([p.revenue for p in req.series])
        for p, z in zip(req.series, zs):
            if abs(z) >= 2.2:
                rows.append([p.date.isoformat(), "Revenue spike" if z > 0 else "Revenue drop", round2(p.revenue), f"{z:+.1f}σ"])
    if req.transactions:
        discounts = [t.discount / t.total * 100 for t in req.transactions if t.total > 0]
        avg_disc = mean(discounts) if discounts else 0
        for t in req.transactions:
            if t.total > 0 and t.discount / t.total * 100 >= max(25, avg_disc * 3):
                rows.append([t.number or str(t.id), "Unusual discount", round2(t.total), f"{t.discount / t.total * 100:.0f}% off"])
        cancelled = [t for t in req.transactions if t.status == "cancelled"]
        if len(req.transactions) >= 10 and len(cancelled) / len(req.transactions) > 0.1:
            alerts.append(Alert(level="warning", title="High cancellation rate", message=f"{len(cancelled)} of {len(req.transactions)} transactions were cancelled ({len(cancelled) / len(req.transactions) * 100:.0f}%)."))
        night = [t for t in req.transactions if t.hour is not None and (t.hour < 6 or t.hour > 22)]
        if night:
            rows.extend([[t.number or str(t.id), "Off-hours sale", round2(t.total), f"{t.hour:02d}:00"] for t in night[:5]])
    for p in req.products:
        if p.stock < 0:
            rows.append([p.name, "Negative stock", p.stock, "check adjustments"])
    if rows:
        alerts.insert(0, Alert(level="warning", title="Anomalies detected", message=f"{len(rows)} unusual events need review."))
    return Insight(
        intent="anomaly_detection", title="Anomaly & risk detection",
        summary=f"{len(rows)} anomalies found." if rows else "No unusual activity detected.",
        metrics=[Metric(label="Anomalies", value=len(rows)), Metric(label="Transactions reviewed", value=len(req.transactions)), Metric(label="Days reviewed", value=len(req.series))],
        table_columns=["Reference", "Type", "Amount", "Detail"], table_rows=rows[:15], alerts=alerts,
        recommendations=[Recommendation(text="Review flagged transactions with the responsible cashier and confirm discount approvals.", impact="medium")] if rows else [],
        follow_ups=["audit_summary", "expenses", "payment_methods"], confidence=0.7,
    )


# ---------------------------------------------------------------- chat (intent router)
KEYWORDS = [
    ("sales_today", ("today", "daily", "ថ្ងៃនេះ")),
    ("why_sales_changed", ("why", "decrease", "drop", "increase", "ហេតុអ្វី")),
    ("compare_months", ("compare", "vs", "last month", "previous", "ធៀប")),
    ("low_stock", ("low stock", "out of stock", "running out", "ស្តុកទាប")),
    ("reorder", ("reorder", "restock", "purchase order", "buy more")),
    ("top_products", ("best", "top product", "selling", "popular", "លក់ដាច់")),
    ("top_customers", ("top customer", "best customer", "vip")),
    ("customers", ("customer", "client", "អតិថិជន")),
    ("expenses", ("expense", "cost", "spend", "ចំណាយ")),
    ("recommendations", ("recommend", "suggest", "advice", "should", "improve")),
    ("anomalies", ("anomal", "suspicious", "unusual", "risk", "audit")),
    ("inventory", ("inventory", "stock", "សារពើភ័ណ្ឌ")),
    ("sales_trend", ("trend", "forecast", "predict", "next week", "growth")),
    ("performance", ("performance", "revenue", "sales", "how are we", "dashboard")),
]


def detect_intent(message: str | None, explicit: str | None) -> str | None:
    if explicit:
        return explicit
    q = (message or "").lower()
    for intent, words in KEYWORDS:
        if any(w in q for w in words):
            return intent
    return None


def chat(req: ChatRequest) -> Insight:
    """Route a chat message to the matching analysis, keeping the user's detected intent on the answer."""
    intent = detect_intent(req.message, req.intent)
    ins = _chat_route(req, intent)
    if intent and ins.intent is not None:
        ins.intent = intent
    return ins


def _chat_route(req: ChatRequest, intent: str | None) -> Insight:
    ctx = req.context
    if intent in {"sales_trend", "sales_prediction"} and req.series:
        return sales_prediction(SalesPredictionRequest(context=ctx, series=req.series, horizon_days=7))
    if intent in {"low_stock", "reorder", "inventory", "inventory_prediction", "stock_movement", "purchases_pending"} and req.products:
        return inventory_prediction(InventoryPredictionRequest(context=ctx, products=req.products))
    if intent in {"customers", "top_customers", "inactive_customers", "customer_analysis"} and req.customers:
        return customer_analysis(CustomerAnalysisRequest(context=ctx, customers=req.customers))
    if intent in {"recommendations"}:
        return recommendations(RecommendationsRequest(context=ctx, series=req.series, products=req.products, customers=req.customers, expenses_by_category=req.expenses_by_category))
    if intent in {"anomalies", "audit_summary", "anomaly_detection"}:
        return anomaly_detection(AnomalyDetectionRequest(context=ctx, series=req.series, transactions=req.transactions, products=req.products))
    if intent == "sales_today" and req.today:
        ch = pct_change(req.today.revenue, req.yesterday.revenue) if req.yesterday else None
        return Insight(intent=intent, title="Today's sales", summary=f"Revenue today is {req.today.revenue:,.2f} across {req.today.orders} orders" + (f" ({ch:+.1f}% vs yesterday)." if ch is not None else "."),
                       metrics=[Metric(label="Revenue", value=req.today.revenue, money=True, change=ch), Metric(label="Orders", value=req.today.orders), Metric(label="Avg. order", value=round2(req.today.revenue / req.today.orders) if req.today.orders else 0, money=True)],
                       follow_ups=["why_sales_changed", "top_products", "reorder"], confidence=0.9)
    if intent in {"compare_months", "why_sales_changed", "performance", "top_products", "expenses"} and req.series:
        cur, prev = _sum_rev(req.series), _sum_rev(req.previous_series)
        ch = pct_change(cur, prev) if req.previous_series else None
        top = sorted(req.products, key=lambda p: p.revenue, reverse=True)[:5]
        recs = [Recommendation(text="Keep the momentum: ensure top contributors stay in stock.", impact="medium")] if (ch or 0) >= 0 else [Recommendation(text="Order volume fell — a short promotion on best sellers usually recovers traffic.", impact="high")]
        ins = Insight(intent=intent, title="Sales performance", summary=(f"Revenue is {cur:,.2f} for the current period" + (f", {ch:+.1f}% vs the previous period." if ch is not None else ".")),
                      metrics=[Metric(label="Revenue", value=cur, money=True, change=ch), Metric(label="Orders", value=sum(p.orders for p in req.series)), Metric(label="Gross profit", value=round2(cur - sum(p.cogs for p in req.series)), money=True)],
                      table_columns=["Product", "Units", "Revenue"], table_rows=[[p.name, p.sold_qty, round2(p.revenue)] for p in top], recommendations=recs,
                      follow_ups=["sales_trend", "top_products", "recommendations"], confidence=0.8)
        if req.previous_series:
            ins.comparison = Comparison(a_label="This period", a=cur, b_label="Previous period", b=prev, money=True, change=ch)
        if intent == "expenses" and req.expenses_by_category:
            tot = sum(req.expenses_by_category.values())
            ins.title, ins.summary = "Expenses", f"Total expenses are {tot:,.2f} across {len(req.expenses_by_category)} categories."
            ins.table_columns, ins.table_rows = ["Category", "Amount", "Share"], [[k, round2(v), f"{v / tot * 100:.0f}%"] for k, v in sorted(req.expenses_by_category.items(), key=lambda kv: -kv[1])]
        return ins
    return Insight(intent=None, title="How can I help?", summary="I can analyse sales, inventory, customers, expenses, anomalies and give recommendations. Try one of the suggestions.",
                   follow_ups=["sales_today", "low_stock", "top_products", "recommendations"], confidence=0.3)
