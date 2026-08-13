# Feature: Backend Foundation

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files, etc.

## Feature Description

Build the complete FastAPI backend for the Habit Tracker application. This includes database models, Pydantic schemas, API endpoints for habit management and completion tracking, streak calculation logic, and structured logging. The backend will provide a RESTful API that the React frontend will consume.

## User Story

As a user
I want a functional backend API for my habit tracker
So that I can create habits, log completions, and track my streaks

## Problem Statement

The Habit Tracker application needs a backend to persist habit data, calculate streaks, and provide an API for the frontend. Currently, no backend exists - only documentation and specifications.

## Solution Statement

Implement a FastAPI application with SQLite persistence using SQLAlchemy 2.0. The API will support full CRUD operations for habits, completion/skip logging, and automatic streak calculations. Structured logging via structlog will provide observability.

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: Medium
**Primary Systems Affected**: Backend API, Database
**Dependencies**: FastAPI, SQLAlchemy, Pydantic, structlog, uvicorn

---

## CONTEXT REFERENCES

### Relevant Documentation - READ BEFORE IMPLEMENTING!

| Document | Lines | Why Read |
|----------|-------|----------|
| `.claude/PRD.md` | 1-598 | Full API spec, database schema, business rules |
| `.claude/reference/fastapi-best-practices.md` | 1-924 | Routing, Pydantic patterns, dependencies, error handling |
| `.claude/reference/sqlite-best-practices.md` | 1-899 | SQLAlchemy setup, PRAGMA settings, model patterns |
| `.claude/reference/testing-and-logging.md` | 1-900 | structlog config, FastAPI middleware, test fixtures |
| `CLAUDE.md` | 1-120 | Project conventions, commands, code style |

### New Files to Create

```
backend/
├── app/
│   ├── __init__.py           # Package marker
│   ├── main.py               # FastAPI app entry point
│   ├── config.py             # Pydantic settings
│   ├── database.py           # SQLite connection, session dependency
│   ├── models.py             # SQLAlchemy ORM models
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── logging_config.py     # structlog setup
│   ├── middleware.py         # Request logging middleware
│   ├── exceptions.py         # Custom exception classes
│   └── routers/
│       ├── __init__.py
│       ├── habits.py         # Habit CRUD endpoints
│       └── completions.py    # Completion/skip endpoints
├── pyproject.toml            # Python project config with dependencies
└── requirements.txt          # Pinned dependencies (generated)
```

### Patterns to Follow

**Naming Conventions:**
- Files: `snake_case.py`
- Classes: `PascalCase`
- Functions/variables: `snake_case`
- Constants: `UPPER_SNAKE_CASE`

**Pydantic Schema Pattern (Pydantic v2):**
```python
from pydantic import BaseModel, ConfigDict, Field, field_validator

class HabitBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None

class HabitCreate(HabitBase):
    color: str = Field(default="#10B981", pattern=r"^#[0-9A-Fa-f]{6}$")

class HabitUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    color: str | None = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")

class HabitResponse(HabitBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    color: str
    current_streak: int
    longest_streak: int
    completion_rate: float
    completed_today: bool
    created_at: str
    archived_at: str | None
```

**SQLAlchemy 2.0 Model Pattern:**
```python
from sqlalchemy import String, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class Habit(Base):
    __tablename__ = "habits"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500))
    color: Mapped[str] = mapped_column(String(7), default="#10B981")
    created_at: Mapped[str] = mapped_column(String(19), nullable=False)
    archived_at: Mapped[str | None] = mapped_column(String(19))

    completions: Mapped[list["Completion"]] = relationship(
        back_populates="habit",
        cascade="all, delete-orphan"
    )
```

**FastAPI Router Pattern:**
```python
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/habits", tags=["habits"])

@router.post("/", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
def create_habit(
    habit: HabitCreate,
    db: Annotated[Session, Depends(get_db)]
) -> Habit:
    ...
```

**Error Handling Pattern:**
```python
from fastapi import HTTPException, status

# In router
if not habit:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Habit not found"
    )
```

**Logging Pattern:**
```python
import structlog

logger = structlog.get_logger()

logger.info("Habit created", habit_id=habit.id, habit_name=habit.name)
```

---

## IMPLEMENTATION PLAN

### Phase 1: Project Setup

Set up the Python project structure with dependencies and configuration.

**Tasks:**
- Create directory structure
- Configure pyproject.toml with dependencies
- Set up Pydantic settings for configuration
- Configure structlog for structured logging

### Phase 2: Database Layer

Implement SQLAlchemy models and database connection.

**Tasks:**
- Create Base class and engine with SQLite optimizations
- Define Habit model with constraints
- Define Completion model with foreign key and unique constraint
- Create session dependency for FastAPI

### Phase 3: Schemas

Create Pydantic schemas for API request/response validation.

**Tasks:**
- Define base, create, update, and response schemas for Habits
- Define schemas for Completions
- Add field validators where needed

### Phase 4: Core Endpoints

Implement habit CRUD operations.

**Tasks:**
- Create habits router with GET/POST/PUT/DELETE
- Implement streak calculation logic
- Implement completion rate calculation
- Add archive endpoint

### Phase 5: Completion Endpoints

Implement completion and skip tracking.

**Tasks:**
- Create completions router
- Implement complete endpoint
- Implement skip endpoint
- Implement undo (delete completion) endpoint
- Implement history endpoint with date filtering

### Phase 6: App Assembly

Wire everything together in the main FastAPI app.

**Tasks:**
- Create main.py with lifespan events
- Add CORS middleware
- Add logging middleware
- Include routers
- Create database tables on startup

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

---

### Task 1: CREATE `backend/pyproject.toml`

Create the Python project configuration with all dependencies.

- **IMPLEMENT**: Project metadata and dependencies for FastAPI, SQLAlchemy, Pydantic, structlog
- **IMPORTS**: N/A (TOML file)
- **GOTCHA**: Use `pydantic-settings` for settings, not just `pydantic`
- **VALIDATE**: `cd backend && python -m pip install -e .` (after venv setup)

```toml
[project]
name = "habit-tracker-backend"
version = "0.1.0"
description = "Habit Tracker API"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.30.0",
    "pydantic>=2.7.0",
    "pydantic-settings>=2.0.0",
    "sqlalchemy>=2.0.0",
    "structlog>=24.1.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-cov>=4.0.0",
    "httpx>=0.27.0",
    "ruff>=0.4.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.uv]
dev-dependencies = [
    "pytest>=8.0.0",
    "pytest-cov>=4.0.0",
    "httpx>=0.27.0",
    "ruff>=0.4.0",
]

[tool.ruff]
target-version = "py311"
line-length = 100

[tool.ruff.lint]
select = ["E", "F", "I", "UP"]

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = "test_*.py"

[tool.coverage.run]
source = ["app"]
omit = ["*/tests/*"]

[tool.coverage.report]
fail_under = 80
```

---

### Task 2: CREATE `backend/requirements.txt`

Generate pinned requirements for reproducible installs.

- **IMPLEMENT**: List of pinned dependencies matching pyproject.toml
- **VALIDATE**: File exists and is readable

```
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
pydantic>=2.7.0
pydantic-settings>=2.0.0
sqlalchemy>=2.0.0
structlog>=24.1.0
```

---

### Task 3: CREATE `backend/app/__init__.py`

Create package marker.

- **IMPLEMENT**: Empty file or version string
- **VALIDATE**: `python -c "import app"`

```python
"""Habit Tracker Backend Application."""

__version__ = "0.1.0"
```

---

### Task 4: CREATE `backend/app/config.py`

Create application settings using Pydantic Settings.

- **IMPLEMENT**: Settings class with database URL, CORS origins, debug flag
- **PATTERN**: Use `pydantic_settings.BaseSettings` with `SettingsConfigDict`
- **IMPORTS**: `from pydantic_settings import BaseSettings, SettingsConfigDict`
- **GOTCHA**: Use `lru_cache` decorator on `get_settings()` function
- **VALIDATE**: `cd backend && python -c "from app.config import get_settings; print(get_settings().database_url)"`

```python
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    app_name: str = "Habit Tracker"
    debug: bool = False
    database_url: str = "sqlite:///./habits.db"
    cors_origins: list[str] = ["http://localhost:5173"]


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
```

---

### Task 5: CREATE `backend/app/logging_config.py`

Configure structlog for the application.

- **IMPLEMENT**: `configure_logging()` function with JSON/console toggle
- **PATTERN**: Reference `.claude/reference/testing-and-logging.md` lines 55-88
- **IMPORTS**: `import structlog`, `import logging`, `import sys`
- **GOTCHA**: Use `merge_contextvars` as first processor
- **VALIDATE**: `cd backend && python -c "from app.logging_config import configure_logging; configure_logging()"`

```python
import logging
import sys

import structlog


def configure_logging(json_format: bool | None = None) -> None:
    """Configure structlog for the application.

    Args:
        json_format: Force JSON output. If None, auto-detect based on terminal.
    """
    if json_format is None:
        # Auto-detect: JSON for non-interactive, console for terminal
        json_format = not sys.stderr.isatty()

    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]

    if json_format:
        processors = shared_processors + [
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ]
    else:
        processors = shared_processors + [
            structlog.processors.format_exc_info,
            structlog.dev.ConsoleRenderer(colors=True),
        ]

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )
```

---

### Task 6: CREATE `backend/app/database.py`

Create SQLAlchemy engine, Base class, and session dependency.

- **IMPLEMENT**: Engine with SQLite optimizations, DeclarativeBase, get_db dependency
- **PATTERN**: Reference `.claude/reference/sqlite-best-practices.md` lines 416-434
- **IMPORTS**: `from sqlalchemy import create_engine, event`, `from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker`
- **GOTCHA**: Enable foreign keys via PRAGMA on every connection
- **GOTCHA**: Use `check_same_thread=False` for SQLite with FastAPI
- **VALIDATE**: `cd backend && python -c "from app.database import engine, Base; print(engine.url)"`

```python
from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
    echo=settings.debug,
)


@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Apply SQLite optimizations on every connection."""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA cache_size=-64000")
    cursor.execute("PRAGMA temp_store=MEMORY")
    cursor.close()


class Base(DeclarativeBase):
    """SQLAlchemy declarative base class."""
    pass


SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

### Task 7: CREATE `backend/app/models.py`

Create SQLAlchemy ORM models for Habit and Completion.

- **IMPLEMENT**: Habit model with all fields, Completion model with foreign key
- **PATTERN**: Reference `.claude/PRD.md` lines 565-587 for schema
- **PATTERN**: Reference `.claude/reference/sqlite-best-practices.md` lines 444-481
- **IMPORTS**: `from sqlalchemy import String, ForeignKey, UniqueConstraint, CheckConstraint, Index`
- **GOTCHA**: Store dates as TEXT in ISO-8601 format (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)
- **GOTCHA**: Add index on `completions.habit_id` for CASCADE operations
- **VALIDATE**: `cd backend && python -c "from app.models import Habit, Completion; print(Habit.__tablename__)"`

```python
from sqlalchemy import CheckConstraint, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Habit(Base):
    """Habit model representing a trackable daily habit."""

    __tablename__ = "habits"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500))
    color: Mapped[str] = mapped_column(String(7), default="#10B981")
    created_at: Mapped[str] = mapped_column(String(19), nullable=False)  # ISO datetime
    archived_at: Mapped[str | None] = mapped_column(String(19))  # ISO datetime

    completions: Mapped[list["Completion"]] = relationship(
        back_populates="habit",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    __table_args__ = (
        CheckConstraint("length(name) > 0", name="name_not_empty"),
    )


class Completion(Base):
    """Completion model representing a habit completion or skip for a specific date."""

    __tablename__ = "completions"

    id: Mapped[int] = mapped_column(primary_key=True)
    habit_id: Mapped[int] = mapped_column(
        ForeignKey("habits.id", ondelete="CASCADE"),
        nullable=False,
    )
    completed_date: Mapped[str] = mapped_column(String(10), nullable=False)  # YYYY-MM-DD
    status: Mapped[str] = mapped_column(String(10), default="completed")  # completed, skipped
    notes: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[str] = mapped_column(String(19), nullable=False)  # ISO datetime

    habit: Mapped["Habit"] = relationship(back_populates="completions")

    __table_args__ = (
        UniqueConstraint("habit_id", "completed_date", name="uq_habit_date"),
        CheckConstraint("status IN ('completed', 'skipped')", name="valid_status"),
        Index("idx_completions_habit_date", "habit_id", "completed_date"),
    )
```

---

### Task 8: CREATE `backend/app/schemas.py`

Create Pydantic schemas for API request/response validation.

- **IMPLEMENT**: HabitBase, HabitCreate, HabitUpdate, HabitResponse, CompletionCreate, CompletionResponse, HabitListResponse
- **PATTERN**: Reference `.claude/reference/fastapi-best-practices.md` lines 169-269
- **IMPORTS**: `from pydantic import BaseModel, ConfigDict, Field, field_validator`
- **GOTCHA**: Use `ConfigDict(from_attributes=True)` for ORM compatibility (Pydantic v2)
- **GOTCHA**: Response schemas include computed fields (current_streak, completion_rate)
- **VALIDATE**: `cd backend && python -c "from app.schemas import HabitCreate; print(HabitCreate.model_fields)"`

```python
from pydantic import BaseModel, ConfigDict, Field, field_validator


# --- Habit Schemas ---

class HabitBase(BaseModel):
    """Base schema with shared habit fields."""

    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)


class HabitCreate(HabitBase):
    """Schema for creating a new habit."""

    color: str = Field(default="#10B981", pattern=r"^#[0-9A-Fa-f]{6}$")

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be blank")
        return v.strip()


class HabitUpdate(BaseModel):
    """Schema for updating an existing habit. All fields optional."""

    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)
    color: str | None = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("Name cannot be blank")
        return v.strip() if v else v


class HabitResponse(HabitBase):
    """Schema for habit responses including computed stats."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    color: str
    current_streak: int = 0
    longest_streak: int = 0
    completion_rate: float = 0.0
    completed_today: bool = False
    created_at: str
    archived_at: str | None = None


class HabitListResponse(BaseModel):
    """Schema for listing habits."""

    habits: list[HabitResponse]


# --- Completion Schemas ---

class CompletionBase(BaseModel):
    """Base schema for completion data."""

    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    notes: str | None = Field(None, max_length=500)


class CompletionCreate(CompletionBase):
    """Schema for creating a completion."""
    pass


class SkipCreate(CompletionBase):
    """Schema for marking a day as skipped."""

    reason: str | None = Field(None, max_length=500)


class CompletionResponse(BaseModel):
    """Schema for completion responses."""

    model_config = ConfigDict(from_attributes=True)

    date: str
    status: str
    notes: str | None = None


class CompletionListResponse(BaseModel):
    """Schema for listing completions."""

    completions: list[CompletionResponse]
```

---

### Task 9: CREATE `backend/app/exceptions.py`

Create custom exception classes for consistent error handling.

- **IMPLEMENT**: AppException base, HabitNotFoundError, DuplicateCompletionError
- **PATTERN**: Reference `.claude/reference/fastapi-best-practices.md` lines 374-396
- **VALIDATE**: `cd backend && python -c "from app.exceptions import HabitNotFoundError; print(HabitNotFoundError(1).detail)"`

```python
class AppException(Exception):
    """Base exception for application errors."""

    def __init__(self, status_code: int, detail: str, error_code: str):
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code
        super().__init__(detail)


class HabitNotFoundError(AppException):
    """Raised when a habit is not found."""

    def __init__(self, habit_id: int):
        super().__init__(
            status_code=404,
            detail=f"Habit with ID {habit_id} not found",
            error_code="HABIT_NOT_FOUND",
        )


class CompletionNotFoundError(AppException):
    """Raised when a completion is not found."""

    def __init__(self, habit_id: int, date: str):
        super().__init__(
            status_code=404,
            detail=f"No completion found for habit {habit_id} on {date}",
            error_code="COMPLETION_NOT_FOUND",
        )


class DuplicateCompletionError(AppException):
    """Raised when trying to create a duplicate completion."""

    def __init__(self, habit_id: int, date: str):
        super().__init__(
            status_code=409,
            detail=f"Completion already exists for habit {habit_id} on {date}",
            error_code="DUPLICATE_COMPLETION",
        )
```

---

### Task 10: CREATE `backend/app/middleware.py`

Create request logging middleware using structlog.

- **IMPLEMENT**: LoggingMiddleware class with request ID, timing, context binding
- **PATTERN**: Reference `.claude/reference/testing-and-logging.md` lines 130-174
- **IMPORTS**: `import structlog`, `from starlette.middleware.base import BaseHTTPMiddleware`
- **GOTCHA**: Clear context vars at start of each request
- **VALIDATE**: Middleware will be tested when app runs

```python
import time
import uuid

import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = structlog.get_logger()


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for structured request logging."""

    async def dispatch(self, request: Request, call_next) -> Response:
        # Clear context and bind request info
        structlog.contextvars.clear_contextvars()

        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))

        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
        )

        start_time = time.perf_counter()

        try:
            response = await call_next(request)
            duration_ms = (time.perf_counter() - start_time) * 1000

            logger.info(
                "Request completed",
                status_code=response.status_code,
                duration_ms=round(duration_ms, 2),
            )

            response.headers["X-Request-ID"] = request_id
            return response

        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.exception(
                "Request failed",
                duration_ms=round(duration_ms, 2),
            )
            raise
```

---

### Task 11: CREATE `backend/app/routers/__init__.py`

Create routers package marker.

- **IMPLEMENT**: Empty file
- **VALIDATE**: `cd backend && python -c "from app.routers import habits"`

```python
"""API routers package."""
```

---

### Task 12: CREATE `backend/app/routers/habits.py`

Create habits router with CRUD endpoints.

- **IMPLEMENT**: GET /habits, POST /habits, GET /habits/{id}, PUT /habits/{id}, DELETE /habits/{id}, PATCH /habits/{id}/archive
- **PATTERN**: Reference `.claude/reference/fastapi-best-practices.md` lines 79-147
- **IMPORTS**: `from typing import Annotated`, `from fastapi import APIRouter, Depends, HTTPException, status`
- **GOTCHA**: Calculate streak and completion rate dynamically in response
- **GOTCHA**: Use `response_model` for proper serialization
- **VALIDATE**: Will be tested with integration tests

**Key Implementation Details:**

1. **Streak Calculation Logic:**
   - Current streak: Count consecutive days from today/yesterday going backwards
   - Skipped days don't break the streak
   - Only count 'completed' status, not 'skipped'

2. **Completion Rate Logic:**
   - `(completed_count / total_days_since_creation) * 100`
   - Don't count skipped days in numerator
   - Don't count future days in denominator

3. **completed_today Logic:**
   - Check if there's a completion record for today's date with status 'completed'

```python
from datetime import date, datetime
from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Completion, Habit
from app.schemas import (
    HabitCreate,
    HabitListResponse,
    HabitResponse,
    HabitUpdate,
)

logger = structlog.get_logger()

router = APIRouter(prefix="/habits", tags=["habits"])


def calculate_streak(completions: list[Completion], today: date) -> int:
    """Calculate current streak from completions.

    Streak counts consecutive completed days from today backwards.
    Skipped days don't break the streak.
    """
    if not completions:
        return 0

    # Sort by date descending
    sorted_completions = sorted(
        completions,
        key=lambda c: c.completed_date,
        reverse=True,
    )

    streak = 0
    check_date = today
    completion_map = {c.completed_date: c.status for c in sorted_completions}

    while True:
        date_str = check_date.isoformat()

        if date_str in completion_map:
            if completion_map[date_str] == "completed":
                streak += 1
            # Skipped days don't break streak, just continue
            check_date = date(check_date.year, check_date.month, check_date.day - 1) if check_date.day > 1 else _prev_day(check_date)
        else:
            # No entry for this date - streak breaks
            # But only if we've started counting (found at least one completion)
            if streak > 0:
                break
            # If no completion today, check yesterday
            check_date = _prev_day(check_date)
            # If we've gone back more than 1 day without finding anything, no streak
            if (today - check_date).days > 1:
                break

    return streak


def _prev_day(d: date) -> date:
    """Get the previous day."""
    from datetime import timedelta
    return d - timedelta(days=1)


def calculate_longest_streak(completions: list[Completion]) -> int:
    """Calculate the longest streak ever achieved."""
    if not completions:
        return 0

    # Get all completed dates sorted
    completed_dates = sorted([
        date.fromisoformat(c.completed_date)
        for c in completions
        if c.status == "completed"
    ])

    if not completed_dates:
        return 0

    # Build map of skipped dates for gap handling
    skipped_dates = {
        c.completed_date
        for c in completions
        if c.status == "skipped"
    }

    longest = 1
    current = 1

    for i in range(1, len(completed_dates)):
        prev = completed_dates[i - 1]
        curr = completed_dates[i]
        gap = (curr - prev).days

        if gap == 1:
            # Consecutive day
            current += 1
        elif gap > 1:
            # Check if all gap days are skipped
            all_skipped = True
            check = prev
            while check < curr:
                check = check + timedelta(days=1)
                if check < curr and check.isoformat() not in skipped_dates:
                    all_skipped = False
                    break

            if all_skipped:
                current += 1
            else:
                current = 1

        longest = max(longest, current)

    return longest


def calculate_completion_rate(habit: Habit, completions: list[Completion], today: date) -> float:
    """Calculate completion rate as percentage."""
    created = date.fromisoformat(habit.created_at[:10])
    total_days = (today - created).days + 1

    if total_days <= 0:
        return 0.0

    completed_count = sum(1 for c in completions if c.status == "completed")
    return round((completed_count / total_days) * 100, 1)


def is_completed_today(completions: list[Completion], today: date) -> bool:
    """Check if habit is completed today."""
    today_str = today.isoformat()
    return any(
        c.completed_date == today_str and c.status == "completed"
        for c in completions
    )


def build_habit_response(habit: Habit, today: date | None = None) -> HabitResponse:
    """Build a HabitResponse with calculated stats."""
    if today is None:
        today = date.today()

    completions = habit.completions

    return HabitResponse(
        id=habit.id,
        name=habit.name,
        description=habit.description,
        color=habit.color,
        current_streak=calculate_streak(completions, today),
        longest_streak=calculate_longest_streak(completions),
        completion_rate=calculate_completion_rate(habit, completions, today),
        completed_today=is_completed_today(completions, today),
        created_at=habit.created_at,
        archived_at=habit.archived_at,
    )


@router.get("/", response_model=HabitListResponse)
def list_habits(
    db: Annotated[Session, Depends(get_db)],
    include_archived: bool = False,
) -> HabitListResponse:
    """List all habits with calculated stats."""
    query = select(Habit)
    if not include_archived:
        query = query.where(Habit.archived_at.is_(None))

    habits = db.execute(query).scalars().all()
    today = date.today()

    return HabitListResponse(
        habits=[build_habit_response(h, today) for h in habits]
    )


@router.post("/", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
def create_habit(
    habit_data: HabitCreate,
    db: Annotated[Session, Depends(get_db)],
) -> HabitResponse:
    """Create a new habit."""
    habit = Habit(
        name=habit_data.name,
        description=habit_data.description,
        color=habit_data.color,
        created_at=datetime.now().isoformat(timespec="seconds"),
    )
    db.add(habit)
    db.commit()
    db.refresh(habit)

    logger.info("Habit created", habit_id=habit.id, habit_name=habit.name)

    return build_habit_response(habit)


@router.get("/{habit_id}", response_model=HabitResponse)
def get_habit(
    habit_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> HabitResponse:
    """Get a specific habit by ID."""
    habit = db.get(Habit, habit_id)
    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found",
        )

    return build_habit_response(habit)


@router.put("/{habit_id}", response_model=HabitResponse)
def update_habit(
    habit_id: int,
    habit_data: HabitUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> HabitResponse:
    """Update an existing habit."""
    habit = db.get(Habit, habit_id)
    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found",
        )

    update_data = habit_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(habit, field, value)

    db.commit()
    db.refresh(habit)

    logger.info("Habit updated", habit_id=habit.id)

    return build_habit_response(habit)


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habit(
    habit_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Permanently delete a habit."""
    habit = db.get(Habit, habit_id)
    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found",
        )

    db.delete(habit)
    db.commit()

    logger.info("Habit deleted", habit_id=habit_id)


@router.patch("/{habit_id}/archive", response_model=HabitResponse)
def archive_habit(
    habit_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> HabitResponse:
    """Archive a habit (soft delete)."""
    habit = db.get(Habit, habit_id)
    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found",
        )

    habit.archived_at = datetime.now().isoformat(timespec="seconds")
    db.commit()
    db.refresh(habit)

    logger.info("Habit archived", habit_id=habit.id)

    return build_habit_response(habit)


# Need to import timedelta at top
from datetime import timedelta
```

---

### Task 13: CREATE `backend/app/routers/completions.py`

Create completions router for tracking habit completions and skips.

- **IMPLEMENT**: POST /habits/{id}/complete, POST /habits/{id}/skip, DELETE /habits/{id}/completions/{date}, GET /habits/{id}/completions
- **PATTERN**: Reference `.claude/PRD.md` lines 381-428 for API spec
- **IMPORTS**: Same as habits router
- **GOTCHA**: Handle duplicate completion with 409 Conflict
- **GOTCHA**: Date format is YYYY-MM-DD
- **VALIDATE**: Will be tested with integration tests

```python
from datetime import date, datetime
from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Completion, Habit
from app.schemas import (
    CompletionCreate,
    CompletionListResponse,
    CompletionResponse,
    SkipCreate,
)

logger = structlog.get_logger()

router = APIRouter(prefix="/habits/{habit_id}", tags=["completions"])


def get_habit_or_404(habit_id: int, db: Session) -> Habit:
    """Get habit by ID or raise 404."""
    habit = db.get(Habit, habit_id)
    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found",
        )
    return habit


@router.post("/complete", response_model=CompletionResponse, status_code=status.HTTP_201_CREATED)
def complete_habit(
    habit_id: int,
    completion_data: CompletionCreate,
    db: Annotated[Session, Depends(get_db)],
) -> CompletionResponse:
    """Mark a habit as completed for a specific date."""
    habit = get_habit_or_404(habit_id, db)

    completion = Completion(
        habit_id=habit.id,
        completed_date=completion_data.date,
        status="completed",
        notes=completion_data.notes,
        created_at=datetime.now().isoformat(timespec="seconds"),
    )

    try:
        db.add(completion)
        db.commit()
        db.refresh(completion)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Completion already exists for habit {habit_id} on {completion_data.date}",
        )

    logger.info(
        "Habit completed",
        habit_id=habit_id,
        date=completion_data.date,
    )

    return CompletionResponse(
        date=completion.completed_date,
        status=completion.status,
        notes=completion.notes,
    )


@router.post("/skip", response_model=CompletionResponse, status_code=status.HTTP_201_CREATED)
def skip_habit(
    habit_id: int,
    skip_data: SkipCreate,
    db: Annotated[Session, Depends(get_db)],
) -> CompletionResponse:
    """Mark a habit as skipped for a specific date (planned absence)."""
    habit = get_habit_or_404(habit_id, db)

    completion = Completion(
        habit_id=habit.id,
        completed_date=skip_data.date,
        status="skipped",
        notes=skip_data.reason,
        created_at=datetime.now().isoformat(timespec="seconds"),
    )

    try:
        db.add(completion)
        db.commit()
        db.refresh(completion)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Entry already exists for habit {habit_id} on {skip_data.date}",
        )

    logger.info(
        "Habit skipped",
        habit_id=habit_id,
        date=skip_data.date,
    )

    return CompletionResponse(
        date=completion.completed_date,
        status=completion.status,
        notes=completion.notes,
    )


@router.delete("/completions/{date}", status_code=status.HTTP_204_NO_CONTENT)
def delete_completion(
    habit_id: int,
    date: str,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Remove a completion or skip entry (undo)."""
    habit = get_habit_or_404(habit_id, db)

    completion = db.execute(
        select(Completion).where(
            Completion.habit_id == habit.id,
            Completion.completed_date == date,
        )
    ).scalar_one_or_none()

    if not completion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No completion found for habit {habit_id} on {date}",
        )

    db.delete(completion)
    db.commit()

    logger.info(
        "Completion removed",
        habit_id=habit_id,
        date=date,
    )


@router.get("/completions", response_model=CompletionListResponse)
def get_completions(
    habit_id: int,
    db: Annotated[Session, Depends(get_db)],
    start: Annotated[str | None, Query(pattern=r"^\d{4}-\d{2}-\d{2}$")] = None,
    end: Annotated[str | None, Query(pattern=r"^\d{4}-\d{2}-\d{2}$")] = None,
) -> CompletionListResponse:
    """Get completion history for a habit with optional date filtering."""
    habit = get_habit_or_404(habit_id, db)

    query = select(Completion).where(Completion.habit_id == habit.id)

    if start:
        query = query.where(Completion.completed_date >= start)
    if end:
        query = query.where(Completion.completed_date <= end)

    query = query.order_by(Completion.completed_date.desc())

    completions = db.execute(query).scalars().all()

    return CompletionListResponse(
        completions=[
            CompletionResponse(
                date=c.completed_date,
                status=c.status,
                notes=c.notes,
            )
            for c in completions
        ]
    )
```

---

### Task 14: CREATE `backend/app/main.py`

Create the main FastAPI application entry point.

- **IMPLEMENT**: FastAPI app with lifespan, CORS, logging middleware, routers
- **PATTERN**: Reference `.claude/reference/fastapi-best-practices.md` lines 869-886
- **IMPORTS**: `from contextlib import asynccontextmanager`, `from fastapi import FastAPI`
- **GOTCHA**: Create tables in lifespan startup
- **GOTCHA**: Add exception handler for AppException
- **VALIDATE**: `cd backend && uvicorn app.main:app --reload`

```python
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.database import Base, engine
from app.exceptions import AppException
from app.logging_config import configure_logging
from app.middleware import LoggingMiddleware
from app.routers import completions, habits

settings = get_settings()
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    configure_logging(json_format=not settings.debug)
    logger.info("Starting Habit Tracker API", debug=settings.debug)

    # Create database tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created")

    yield

    # Shutdown
    logger.info("Shutting down Habit Tracker API")


app = FastAPI(
    title=settings.app_name,
    description="A simple habit tracking API",
    version="0.1.0",
    lifespan=lifespan,
)

# Exception handlers
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Handle custom application exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.error_code,
            "detail": exc.detail,
        },
    )


# Middleware (order matters - last added = first executed)
app.add_middleware(LoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)

# Routers
app.include_router(habits.router, prefix="/api")
app.include_router(completions.router, prefix="/api")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
```

---

### Task 15: CREATE `backend/tests/__init__.py`

Create tests package.

- **IMPLEMENT**: Empty file
- **VALIDATE**: Directory exists

```python
"""Backend tests package."""
```

---

### Task 16: CREATE `backend/tests/conftest.py`

Create pytest fixtures for testing.

- **IMPLEMENT**: db_session fixture with in-memory SQLite, client fixture with dependency overrides
- **PATTERN**: Reference `.claude/reference/testing-and-logging.md` lines 410-453
- **IMPORTS**: `import pytest`, `from fastapi.testclient import TestClient`, `from sqlalchemy import create_engine, StaticPool`
- **GOTCHA**: Use `StaticPool` for in-memory SQLite to share across threads
- **VALIDATE**: `cd backend && pytest --collect-only`

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh in-memory database for each test."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Apply same PRAGMA settings as production
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)

    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture(scope="function")
def client(db_session: Session):
    """Create test client with database override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
```

---

### Task 17: CREATE `backend/tests/test_api_habits.py`

Create integration tests for habits API.

- **IMPLEMENT**: Tests for create, list, get, update, delete, archive
- **PATTERN**: Reference `.claude/reference/testing-and-logging.md` lines 458-493
- **VALIDATE**: `cd backend && pytest tests/test_api_habits.py -v`

```python
import pytest
from fastapi.testclient import TestClient


class TestHabitsAPI:
    """Integration tests for the habits API."""

    def test_create_habit_returns_201(self, client: TestClient):
        """Test creating a new habit."""
        response = client.post(
            "/api/habits",
            json={"name": "Exercise", "description": "Daily workout"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Exercise"
        assert data["description"] == "Daily workout"
        assert data["color"] == "#10B981"
        assert data["current_streak"] == 0
        assert data["completed_today"] is False
        assert "id" in data
        assert "created_at" in data

    def test_create_habit_with_custom_color(self, client: TestClient):
        """Test creating a habit with custom color."""
        response = client.post(
            "/api/habits",
            json={"name": "Reading", "color": "#3B82F6"},
        )

        assert response.status_code == 201
        assert response.json()["color"] == "#3B82F6"

    def test_create_habit_without_name_returns_422(self, client: TestClient):
        """Test validation error for missing name."""
        response = client.post("/api/habits", json={})

        assert response.status_code == 422

    def test_create_habit_with_blank_name_returns_422(self, client: TestClient):
        """Test validation error for blank name."""
        response = client.post("/api/habits", json={"name": "   "})

        assert response.status_code == 422

    def test_create_habit_with_invalid_color_returns_422(self, client: TestClient):
        """Test validation error for invalid color format."""
        response = client.post(
            "/api/habits",
            json={"name": "Test", "color": "red"},
        )

        assert response.status_code == 422

    def test_list_habits_empty(self, client: TestClient):
        """Test listing habits when none exist."""
        response = client.get("/api/habits")

        assert response.status_code == 200
        assert response.json() == {"habits": []}

    def test_list_habits_returns_all(self, client: TestClient):
        """Test listing all habits."""
        client.post("/api/habits", json={"name": "Habit 1"})
        client.post("/api/habits", json={"name": "Habit 2"})

        response = client.get("/api/habits")

        assert response.status_code == 200
        habits = response.json()["habits"]
        assert len(habits) == 2

    def test_list_habits_excludes_archived(self, client: TestClient):
        """Test that archived habits are excluded by default."""
        create_resp = client.post("/api/habits", json={"name": "To Archive"})
        habit_id = create_resp.json()["id"]

        client.patch(f"/api/habits/{habit_id}/archive")

        response = client.get("/api/habits")
        assert len(response.json()["habits"]) == 0

        # But can include archived
        response = client.get("/api/habits?include_archived=true")
        assert len(response.json()["habits"]) == 1

    def test_get_habit_returns_habit(self, client: TestClient):
        """Test getting a specific habit."""
        create_resp = client.post("/api/habits", json={"name": "Test"})
        habit_id = create_resp.json()["id"]

        response = client.get(f"/api/habits/{habit_id}")

        assert response.status_code == 200
        assert response.json()["name"] == "Test"

    def test_get_habit_not_found_returns_404(self, client: TestClient):
        """Test 404 for non-existent habit."""
        response = client.get("/api/habits/99999")

        assert response.status_code == 404

    def test_update_habit(self, client: TestClient):
        """Test updating a habit."""
        create_resp = client.post("/api/habits", json={"name": "Original"})
        habit_id = create_resp.json()["id"]

        response = client.put(
            f"/api/habits/{habit_id}",
            json={"name": "Updated", "description": "New desc"},
        )

        assert response.status_code == 200
        assert response.json()["name"] == "Updated"
        assert response.json()["description"] == "New desc"

    def test_update_habit_partial(self, client: TestClient):
        """Test partial update only changes specified fields."""
        create_resp = client.post(
            "/api/habits",
            json={"name": "Original", "description": "Keep this"},
        )
        habit_id = create_resp.json()["id"]

        response = client.put(
            f"/api/habits/{habit_id}",
            json={"name": "New Name"},
        )

        assert response.status_code == 200
        assert response.json()["name"] == "New Name"
        assert response.json()["description"] == "Keep this"

    def test_delete_habit(self, client: TestClient):
        """Test deleting a habit."""
        create_resp = client.post("/api/habits", json={"name": "To Delete"})
        habit_id = create_resp.json()["id"]

        response = client.delete(f"/api/habits/{habit_id}")

        assert response.status_code == 204

        # Verify deletion
        get_resp = client.get(f"/api/habits/{habit_id}")
        assert get_resp.status_code == 404

    def test_archive_habit(self, client: TestClient):
        """Test archiving a habit."""
        create_resp = client.post("/api/habits", json={"name": "To Archive"})
        habit_id = create_resp.json()["id"]

        response = client.patch(f"/api/habits/{habit_id}/archive")

        assert response.status_code == 200
        assert response.json()["archived_at"] is not None
```

---

### Task 18: CREATE `backend/tests/test_api_completions.py`

Create integration tests for completions API.

- **IMPLEMENT**: Tests for complete, skip, undo, get history
- **VALIDATE**: `cd backend && pytest tests/test_api_completions.py -v`

```python
import pytest
from fastapi.testclient import TestClient


class TestCompletionsAPI:
    """Integration tests for the completions API."""

    @pytest.fixture
    def habit_id(self, client: TestClient) -> int:
        """Create a habit and return its ID."""
        response = client.post("/api/habits", json={"name": "Test Habit"})
        return response.json()["id"]

    def test_complete_habit_returns_201(self, client: TestClient, habit_id: int):
        """Test completing a habit."""
        response = client.post(
            f"/api/habits/{habit_id}/complete",
            json={"date": "2025-01-04"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["date"] == "2025-01-04"
        assert data["status"] == "completed"

    def test_complete_habit_with_notes(self, client: TestClient, habit_id: int):
        """Test completing with notes."""
        response = client.post(
            f"/api/habits/{habit_id}/complete",
            json={"date": "2025-01-04", "notes": "Ran 5k"},
        )

        assert response.status_code == 201
        assert response.json()["notes"] == "Ran 5k"

    def test_complete_duplicate_returns_409(self, client: TestClient, habit_id: int):
        """Test conflict on duplicate completion."""
        client.post(
            f"/api/habits/{habit_id}/complete",
            json={"date": "2025-01-04"},
        )

        response = client.post(
            f"/api/habits/{habit_id}/complete",
            json={"date": "2025-01-04"},
        )

        assert response.status_code == 409

    def test_complete_nonexistent_habit_returns_404(self, client: TestClient):
        """Test 404 for non-existent habit."""
        response = client.post(
            "/api/habits/99999/complete",
            json={"date": "2025-01-04"},
        )

        assert response.status_code == 404

    def test_complete_invalid_date_returns_422(self, client: TestClient, habit_id: int):
        """Test validation for invalid date format."""
        response = client.post(
            f"/api/habits/{habit_id}/complete",
            json={"date": "01-04-2025"},  # Wrong format
        )

        assert response.status_code == 422

    def test_skip_habit_returns_201(self, client: TestClient, habit_id: int):
        """Test skipping a habit."""
        response = client.post(
            f"/api/habits/{habit_id}/skip",
            json={"date": "2025-01-04", "reason": "Traveling"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["date"] == "2025-01-04"
        assert data["status"] == "skipped"
        assert data["notes"] == "Traveling"

    def test_delete_completion(self, client: TestClient, habit_id: int):
        """Test removing a completion (undo)."""
        client.post(
            f"/api/habits/{habit_id}/complete",
            json={"date": "2025-01-04"},
        )

        response = client.delete(f"/api/habits/{habit_id}/completions/2025-01-04")

        assert response.status_code == 204

    def test_delete_nonexistent_completion_returns_404(
        self, client: TestClient, habit_id: int
    ):
        """Test 404 for non-existent completion."""
        response = client.delete(f"/api/habits/{habit_id}/completions/2025-01-04")

        assert response.status_code == 404

    def test_get_completions(self, client: TestClient, habit_id: int):
        """Test getting completion history."""
        client.post(f"/api/habits/{habit_id}/complete", json={"date": "2025-01-01"})
        client.post(f"/api/habits/{habit_id}/complete", json={"date": "2025-01-02"})
        client.post(f"/api/habits/{habit_id}/skip", json={"date": "2025-01-03"})

        response = client.get(f"/api/habits/{habit_id}/completions")

        assert response.status_code == 200
        completions = response.json()["completions"]
        assert len(completions) == 3

    def test_get_completions_filtered_by_date(self, client: TestClient, habit_id: int):
        """Test filtering completions by date range."""
        client.post(f"/api/habits/{habit_id}/complete", json={"date": "2025-01-01"})
        client.post(f"/api/habits/{habit_id}/complete", json={"date": "2025-01-15"})
        client.post(f"/api/habits/{habit_id}/complete", json={"date": "2025-02-01"})

        response = client.get(
            f"/api/habits/{habit_id}/completions",
            params={"start": "2025-01-01", "end": "2025-01-31"},
        )

        assert response.status_code == 200
        completions = response.json()["completions"]
        assert len(completions) == 2

    def test_habit_shows_completed_today(self, client: TestClient, habit_id: int):
        """Test that completing today updates the habit response."""
        from datetime import date
        today = date.today().isoformat()

        # Before completion
        habit = client.get(f"/api/habits/{habit_id}").json()
        assert habit["completed_today"] is False

        # Complete today
        client.post(f"/api/habits/{habit_id}/complete", json={"date": today})

        # After completion
        habit = client.get(f"/api/habits/{habit_id}").json()
        assert habit["completed_today"] is True
```

---

### Task 19: CREATE `backend/tests/test_streak.py`

Create unit tests for streak calculation logic.

- **IMPLEMENT**: Tests for streak edge cases
- **VALIDATE**: `cd backend && pytest tests/test_streak.py -v`

```python
from datetime import date, timedelta

import pytest

from app.models import Completion
from app.routers.habits import calculate_streak, calculate_longest_streak


class TestStreakCalculation:
    """Unit tests for streak calculation logic."""

    def _make_completion(self, date_str: str, status: str = "completed") -> Completion:
        """Helper to create a mock completion."""
        c = Completion.__new__(Completion)
        c.completed_date = date_str
        c.status = status
        return c

    def test_empty_completions_returns_zero(self):
        """No completions means no streak."""
        assert calculate_streak([], date.today()) == 0

    def test_single_completion_today(self):
        """Single completion today is streak of 1."""
        today = date.today()
        completions = [self._make_completion(today.isoformat())]

        assert calculate_streak(completions, today) == 1

    def test_single_completion_yesterday(self):
        """Single completion yesterday is streak of 1."""
        today = date.today()
        yesterday = today - timedelta(days=1)
        completions = [self._make_completion(yesterday.isoformat())]

        assert calculate_streak(completions, today) == 1

    def test_consecutive_days(self):
        """Consecutive completions count as streak."""
        today = date.today()
        completions = [
            self._make_completion((today - timedelta(days=i)).isoformat())
            for i in range(5)
        ]

        assert calculate_streak(completions, today) == 5

    def test_gap_breaks_streak(self):
        """Missing day breaks the streak."""
        today = date.today()
        completions = [
            self._make_completion(today.isoformat()),
            self._make_completion((today - timedelta(days=2)).isoformat()),  # Gap
        ]

        assert calculate_streak(completions, today) == 1

    def test_skipped_day_doesnt_break_streak(self):
        """Skipped days don't break the streak."""
        today = date.today()
        completions = [
            self._make_completion(today.isoformat(), "completed"),
            self._make_completion((today - timedelta(days=1)).isoformat(), "skipped"),
            self._make_completion((today - timedelta(days=2)).isoformat(), "completed"),
        ]

        assert calculate_streak(completions, today) == 2

    def test_old_completion_no_streak(self):
        """Old completion with no recent activity means no current streak."""
        today = date.today()
        old_date = today - timedelta(days=30)
        completions = [self._make_completion(old_date.isoformat())]

        assert calculate_streak(completions, today) == 0


class TestLongestStreak:
    """Unit tests for longest streak calculation."""

    def _make_completion(self, date_str: str, status: str = "completed") -> Completion:
        """Helper to create a mock completion."""
        c = Completion.__new__(Completion)
        c.completed_date = date_str
        c.status = status
        return c

    def test_empty_completions_returns_zero(self):
        """No completions means no longest streak."""
        assert calculate_longest_streak([]) == 0

    def test_single_completion(self):
        """Single completion is longest streak of 1."""
        completions = [self._make_completion("2025-01-01")]

        assert calculate_longest_streak(completions) == 1

    def test_consecutive_days(self):
        """Consecutive days counted correctly."""
        completions = [
            self._make_completion("2025-01-01"),
            self._make_completion("2025-01-02"),
            self._make_completion("2025-01-03"),
        ]

        assert calculate_longest_streak(completions) == 3

    def test_multiple_streaks_returns_longest(self):
        """Returns the longest of multiple streaks."""
        completions = [
            # First streak: 2 days
            self._make_completion("2025-01-01"),
            self._make_completion("2025-01-02"),
            # Gap
            # Second streak: 4 days
            self._make_completion("2025-01-10"),
            self._make_completion("2025-01-11"),
            self._make_completion("2025-01-12"),
            self._make_completion("2025-01-13"),
        ]

        assert calculate_longest_streak(completions) == 4

    def test_skipped_only_not_counted(self):
        """Only skipped days don't contribute to streak count."""
        completions = [
            self._make_completion("2025-01-01", "skipped"),
            self._make_completion("2025-01-02", "skipped"),
        ]

        assert calculate_longest_streak(completions) == 0
```

---

## TESTING STRATEGY

### Unit Tests

| Test File | Purpose |
|-----------|---------|
| `test_streak.py` | Streak calculation logic |

### Integration Tests

| Test File | Purpose |
|-----------|---------|
| `test_api_habits.py` | Habit CRUD endpoints |
| `test_api_completions.py` | Completion tracking endpoints |

### Test Database

- Use in-memory SQLite with `StaticPool`
- Fresh database per test function
- Same PRAGMA settings as production

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Setup & Install

```bash
cd backend
uv sync
```

### Level 2: Linting & Type Checking

```bash
cd backend
uv run ruff check app/
uv run ruff format --check app/
```

### Level 3: Unit Tests

```bash
cd backend
uv run pytest tests/test_streak.py -v
```

### Level 4: Integration Tests

```bash
cd backend
uv run pytest tests/ -v
```

### Level 5: Coverage

```bash
cd backend
uv run pytest --cov=app --cov-report=term-missing
```

### Level 6: Manual Validation

1. Start the server:
   ```bash
   cd backend
   uv run uvicorn app.main:app --reload
   ```

2. Open http://localhost:8000/docs

3. Test flow:
   - Create a habit via POST /api/habits
   - Complete it via POST /api/habits/{id}/complete
   - Verify streak via GET /api/habits/{id}
   - View history via GET /api/habits/{id}/completions

---

## ACCEPTANCE CRITERIA

- [x] Backend serves API at http://localhost:8000
- [ ] Can create habits via POST /api/habits (returns 201)
- [ ] Can list habits via GET /api/habits
- [ ] Can get single habit via GET /api/habits/{id}
- [ ] Can update habit via PUT /api/habits/{id}
- [ ] Can delete habit via DELETE /api/habits/{id} (returns 204)
- [ ] Can archive habit via PATCH /api/habits/{id}/archive
- [ ] Can complete habit via POST /api/habits/{id}/complete (returns 201)
- [ ] Can skip habit via POST /api/habits/{id}/skip (returns 201)
- [ ] Can undo completion via DELETE /api/habits/{id}/completions/{date} (returns 204)
- [ ] Can view history via GET /api/habits/{id}/completions
- [ ] Streak calculation works correctly (consecutive days, skipped days don't break)
- [ ] Completion rate calculated correctly
- [ ] completed_today flag accurate
- [ ] All validation commands pass with zero errors
- [ ] Unit test coverage for streak logic
- [ ] Integration tests for all endpoints
- [ ] Structured logging with request context

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed immediately
- [ ] All validation commands executed successfully
- [ ] Full test suite passes (unit + integration)
- [ ] No linting errors
- [ ] Manual testing confirms feature works
- [ ] Acceptance criteria all met
- [ ] Code reviewed for quality and maintainability

---

## NOTES

### Design Decisions

1. **Sync SQLAlchemy**: Using sync SQLAlchemy with FastAPI's threadpool since SQLite doesn't benefit from async, and sync code is simpler.

2. **Date Storage**: Storing dates as ISO-8601 TEXT strings for SQLite compatibility and human readability.

3. **Computed Stats**: Streak and completion rate are calculated on-the-fly rather than stored, ensuring accuracy at the cost of some compute.

4. **Eager Loading**: Using `selectin` loading for completions to avoid N+1 queries when listing habits.

### Potential Issues

1. **Streak Calculation Performance**: For habits with many completions, calculating streak on every request could be slow. Consider caching if needed.

2. **Timezone Handling**: Currently using server's local date. May need explicit timezone support for users in different zones.

3. **Date Validation**: Currently validates format but not that date is valid (e.g., 2025-02-30 would pass regex but fail).
