"""AI provider client (Google Gemini via OpenAI-compatible endpoint).

Security: the API key lives only in server environment variables, is never logged and never returned.
Failures (timeout, rate limit, invalid response) degrade gracefully to the rule-based insight.
"""
from __future__ import annotations
import json
import logging
import httpx

from app.config import get_settings
from app.schemas.common import Insight

log = logging.getLogger("sbs.ai.provider")


class ProviderError(Exception):
    def __init__(self, message: str, status: int = 502):
        super().__init__(message)
        self.status = status


ENRICH_SYSTEM_PROMPT = (
    "You are a concise business intelligence assistant for a retail/wholesale POS system in Cambodia. "
    "Answer in {language}. Use ONLY the structured facts provided; never invent numbers. "
    "Write 2-3 short sentences: what happened, why it matters, one clear next step."
)


CHAT_SYSTEM_PROMPT = """You are SmartBiz AI, a helpful business intelligence assistant for a retail/wholesale POS system in Cambodia.

The user's role is: {role}. Tailor your response to what matters most to this role:
- super_admin / admin: overall business health, profitability, staffing, strategic decisions
- manager: daily operations, team performance, sales targets, inventory turnover
- accountant / auditor: financial accuracy, expenses, margins, payment status, compliance
- sales / cashier: today's sales, top products, peak hours, customer experience
- inventory / warehouse / purchase: stock levels, reorder needs, supplier lead times, incoming shipments
- customer_service: customer satisfaction, retention, recent orders, complaints

RULES:
- Answer in {language}.
- Use ONLY the facts provided. Never invent numbers or data.
- Be concise: 2-4 sentences unless the user asks for detail.
- For numbers, use the exact values from the data.
- You can do calculations (totals, percentages, comparisons) from the provided data.
- If asked about something not in the data, say you don't have that information.
- Be friendly and professional. Use the business name "{business_name}" when appropriate.
- Currency is {currency}.

{extra_context}"""


def _build_business_context(req) -> str:
    """Build a compact text summary of the business data for the LLM context window."""
    parts = []

    if req.context.business_name:
        parts.append(f"Business: {req.context.business_name}")

    if req.today:
        parts.append(f"Today ({req.today.date}): Revenue {req.today.revenue:,.2f}, Orders: {req.today.orders}")
    if req.yesterday:
        parts.append(f"Yesterday ({req.yesterday.date}): Revenue {req.yesterday.revenue:,.2f}, Orders: {req.yesterday.orders}")

    if req.series:
        total_rev = sum(p.revenue for p in req.series)
        total_orders = sum(p.orders for p in req.series)
        parts.append(f"Last {len(req.series)} days: Total revenue {total_rev:,.2f}, Total orders {total_orders}")
        if len(req.series) >= 7:
            recent7 = sum(p.revenue for p in req.series[-7:])
            prev7 = sum(p.revenue for p in req.series[-14:-7]) if len(req.series) >= 14 else sum(p.revenue for p in req.series[:7])
            if prev7 > 0:
                change = ((recent7 - prev7) / prev7) * 100
                parts.append(f"Last 7 days revenue: {recent7:,.2f} ({change:+.1f}% vs previous 7 days)")
            else:
                parts.append(f"Last 7 days revenue: {recent7:,.2f}")

    if req.products:
        parts.append(f"\nProducts ({len(req.products)} active):")
        for p in req.products[:20]:
            stock_info = f"stock={p.stock}"
            if p.stock <= 0:
                stock_info += " [OUT OF STOCK]"
            elif p.stock <= p.reorder_level:
                stock_info += " [LOW STOCK]"
            parts.append(f"  - {p.name} ({p.sku}): {stock_info}, sold={p.sold_qty}, revenue={p.revenue:,.2f}, cost={p.cost_price:,.2f}, price={p.selling_price:,.2f}, supplier={p.supplier or 'N/A'}, category={p.category or 'N/A'}")

    if req.customers:
        parts.append(f"\nCustomers ({len(req.customers)} active):")
        sorted_customers = sorted(req.customers, key=lambda c: c.total_spent, reverse=True)
        for c in sorted_customers[:15]:
            parts.append(f"  - {c.name}: {c.orders} orders, spent {c.total_spent:,.2f}, type={c.type or 'N/A'}, last_order={c.last_order_at or 'never'}")

    if req.transactions:
        parts.append(f"\nRecent transactions ({len(req.transactions)}):")
        for t in req.transactions[:10]:
            parts.append(f"  - {t.number or t.id}: {t.total:,.2f}, status={t.status}, payment={t.payment_status}, discount={t.discount:,.2f}")

    if req.expenses_by_category:
        total_exp = sum(req.expenses_by_category.values())
        parts.append(f"\nExpenses (total {total_exp:,.2f}):")
        for cat, amt in sorted(req.expenses_by_category.items(), key=lambda x: -x[1]):
            pct = (amt / total_exp * 100) if total_exp else 0
            parts.append(f"  - {cat}: {amt:,.2f} ({pct:.0f}%)")

    return "\n".join(parts)


async def chat_completion(req, language: str = "en") -> str:
    """Send the user's message + business data to the LLM and return the text response."""
    s = get_settings()
    if not s.provider_enabled:
        raise ProviderError("AI provider not configured (no API key)", 503)

    lang_label = "Khmer" if language == "km" else "English"
    business_ctx = _build_business_context(req)
    history = req.history or []

    system_msg = CHAT_SYSTEM_PROMPT.format(
        language=lang_label,
        business_name=req.context.business_name or "your business",
        currency=req.context.currency or "USD",
        role=req.context.role or "general user",
        extra_context=f"Current business data:\n{business_ctx}",
    )

    messages = [{"role": "system", "content": system_msg}]
    for h in history[-10:]:
        messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
    messages.append({"role": "user", "content": req.message or req.intent or "Help me understand my business"})

    payload = {
        "model": s.ai_model,
        "temperature": 0.4,
        "max_tokens": 800,
        "messages": messages,
    }

    try:
        async with httpx.AsyncClient(timeout=s.ai_timeout_seconds) as client:
            res = await client.post(
                f"{s.ai_base_url.rstrip('/')}/chat/completions",
                json=payload,
                headers={"Authorization": f"Bearer {s.ai_api_key}"},
            )
    except httpx.TimeoutException as e:
        raise ProviderError("AI provider timed out", 504) from e
    except httpx.HTTPError as e:
        raise ProviderError("AI provider is unreachable", 502) from e

    if res.status_code == 429:
        raise ProviderError("AI provider rate limit reached", 429)
    if res.status_code >= 400:
        log.warning("provider error status=%s body=%s", res.status_code, res.text[:300])
        raise ProviderError(f"AI provider error ({res.status_code})", 502)

    try:
        text = res.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        raise ProviderError("Invalid AI provider response", 502) from e

    return text


async def enrich_summary(insight: Insight, language: str = "en") -> Insight:
    s = get_settings()
    if not s.provider_enabled:
        return insight
    facts = insight.model_dump(include={"title", "summary", "metrics", "alerts", "recommendations", "comparison"})
    payload = {
        "model": s.ai_model,
        "temperature": 0.3,
        "max_tokens": 220,
        "messages": [
            {"role": "system", "content": ENRICH_SYSTEM_PROMPT.format(language="Khmer" if language == "km" else "English")},
            {"role": "user", "content": f"Facts (JSON): {json.dumps(facts, default=str)}"},
        ],
    }
    try:
        async with httpx.AsyncClient(timeout=s.ai_timeout_seconds) as client:
            res = await client.post(f"{s.ai_base_url.rstrip('/')}/chat/completions", json=payload, headers={"Authorization": f"Bearer {s.ai_api_key}"})
    except httpx.TimeoutException as e:
        raise ProviderError("AI provider timed out", 504) from e
    except httpx.HTTPError as e:
        raise ProviderError("AI provider is unreachable", 502) from e
    if res.status_code == 429:
        raise ProviderError("AI provider rate limit reached", 429)
    if res.status_code >= 400:
        log.warning("provider error status=%s", res.status_code)
        raise ProviderError("AI provider error", 502)
    try:
        text = res.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        raise ProviderError("Invalid AI provider response", 502) from e
    if text:
        insight.summary = text
        insight.source = "provider"
    return insight


async def safe_enrich(insight: Insight, language: str = "en") -> Insight:
    """Never fail the request because of the provider — fall back to the rule-based insight."""
    try:
        return await enrich_summary(insight, language)
    except ProviderError as e:
        log.info("provider fallback: %s", e)
        return insight
