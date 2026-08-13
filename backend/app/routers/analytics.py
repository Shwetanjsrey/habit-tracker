from datetime import date, timedelta
from typing import Annotated

import structlog
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Completion, Habit
from app.routers.habits import (
    calculate_completion_rate,
    calculate_longest_streak,
    calculate_streak,
    is_completed_today,
)
from app.schemas import AnalyticsResponse, DailyCount

logger = structlog.get_logger()

router = APIRouter(prefix="/analytics", tags=["analytics"])

TREND_WINDOW_DAYS = 30
WEEKLY_WINDOW_DAYS = 7


def _zero_filled_series(start: date, end: date) -> dict[str, int]:
    """Build a date (ISO string) -> 0 map for every day in [start, end]."""
    series: dict[str, int] = {}
    current = start
    while current <= end:
        series[current.isoformat()] = 0
        current += timedelta(days=1)
    return series


@router.get("", response_model=AnalyticsResponse)
def get_analytics(db: Annotated[Session, Depends(get_db)]) -> AnalyticsResponse:
    """Compute aggregate analytics across all active (non-archived) habits.

    Reuses the same streak/completion-rate logic as the habits endpoints so the
    numbers shown here always agree with what's shown per-habit.
    """
    today = date.today()

    habits = db.execute(select(Habit).where(Habit.archived_at.is_(None))).scalars().all()
    habit_ids = [h.id for h in habits]

    total_habits = len(habits)
    completed_today = sum(1 for h in habits if is_completed_today(h.completions, today))

    current_streaks = [calculate_streak(h.completions, today) for h in habits]
    longest_streaks = [calculate_longest_streak(h.completions) for h in habits]
    completion_rates = [calculate_completion_rate(h, h.completions, today) for h in habits]

    current_longest_streak = max(current_streaks, default=0)
    best_streak = max(longest_streaks, default=0)
    overall_completion_rate = (
        round(sum(completion_rates) / len(completion_rates), 1) if completion_rates else 0.0
    )

    if habit_ids:
        total_completions = db.execute(
            select(func.count(Completion.id)).where(
                Completion.status == "completed",
                Completion.habit_id.in_(habit_ids),
            )
        ).scalar_one()
    else:
        total_completions = 0

    # Build a zero-filled 30-day series, then overlay actual completion counts
    # grouped by date. The weekly series is just the last 7 days of that.
    window_start = today - timedelta(days=TREND_WINDOW_DAYS - 1)
    daily_map = _zero_filled_series(window_start, today)

    if habit_ids:
        rows = db.execute(
            select(Completion.completed_date, func.count(Completion.id))
            .where(
                Completion.status == "completed",
                Completion.habit_id.in_(habit_ids),
                Completion.completed_date >= window_start.isoformat(),
                Completion.completed_date <= today.isoformat(),
            )
            .group_by(Completion.completed_date)
        ).all()
        for completed_date, count in rows:
            if completed_date in daily_map:
                daily_map[completed_date] = count

    daily_30 = [DailyCount(date=d, completed_count=daily_map[d]) for d in sorted(daily_map)]
    weekly = daily_30[-WEEKLY_WINDOW_DAYS:]

    logger.info(
        "Analytics computed",
        total_habits=total_habits,
        completed_today=completed_today,
        total_completions=total_completions,
    )

    return AnalyticsResponse(
        total_habits=total_habits,
        completed_today=completed_today,
        overall_completion_rate=overall_completion_rate,
        current_longest_streak=current_longest_streak,
        best_streak=best_streak,
        total_completions=total_completions,
        weekly=weekly,
        daily_30=daily_30,
    )
