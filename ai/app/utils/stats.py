"""Small, dependency-free statistics helpers (deterministic, testable)."""
from __future__ import annotations
from typing import Sequence


def mean(xs: Sequence[float]) -> float:
    xs = list(xs)
    return sum(xs) / len(xs) if xs else 0.0


def stdev(xs: Sequence[float]) -> float:
    xs = list(xs)
    if len(xs) < 2:
        return 0.0
    m = mean(xs)
    return (sum((x - m) ** 2 for x in xs) / (len(xs) - 1)) ** 0.5


def pct_change(cur: float, prev: float) -> float:
    if prev == 0:
        return 100.0 if cur else 0.0
    return round((cur - prev) / prev * 100, 1)


def linear_forecast(values: Sequence[float], horizon: int) -> list[float]:
    """Least-squares trend + mean, clamped at zero. Robust for short/flat series."""
    ys = [float(v) for v in values]
    n = len(ys)
    if n == 0:
        return [0.0] * horizon
    if n == 1:
        return [max(0.0, ys[0])] * horizon
    xs = list(range(n))
    mx, my = mean(xs), mean(ys)
    denom = sum((x - mx) ** 2 for x in xs) or 1.0
    slope = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / denom
    # dampen the slope so a few strong days do not explode the projection
    slope *= 0.6
    intercept = my - slope * mx
    return [round(max(0.0, intercept + slope * (n + i)), 2) for i in range(horizon)]


def zscores(xs: Sequence[float]) -> list[float]:
    m, s = mean(xs), stdev(xs)
    if s == 0:
        return [0.0 for _ in xs]
    return [(x - m) / s for x in xs]


def round2(x: float) -> float:
    return round(float(x) + 1e-12, 2)
