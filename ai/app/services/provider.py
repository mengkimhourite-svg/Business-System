"""AI provider client (OpenAI-compatible). Enriches the rule-based summary in natural language.

Security: the API key lives only in server environment variables, is never logged and never returned.
Failures (timeout, rate limit, invalid response) degrade gracefully to the rule-based insight.
"""
from __future__ import annotations
import logging
import httpx

from app.config import get_settings
from app.schemas.common import Insight

log = logging.getLogger("sbs.ai.provider")


class ProviderError(Exception):
    def __init__(self, message: str, status: int = 502):
        super().__init__(message)
        self.status = status


SYSTEM_PROMPT = (
    "You are a concise business intelligence assistant for a retail/wholesale POS system in Cambodia. "
    "Answer in {language}. Use ONLY the structured facts provided; never invent numbers. "
    "Write 2-3 short sentences: what happened, why it matters, one clear next step."
)


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
            {"role": "system", "content": SYSTEM_PROMPT.format(language="Khmer" if language == "km" else "English")},
            {"role": "user", "content": f"Facts (JSON): {facts}"},
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
        log.warning("provider error status=%s", res.status_code)  # body may contain sensitive info — not logged
        raise ProviderError("AI provider error", 502)
    try:
        text = res.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:  # invalid/unexpected shape
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
