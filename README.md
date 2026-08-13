# Habit Tracker

A full-stack habit tracking web application for building consistent daily habits through streak tracking, completion statistics, calendar visualization, and analytics.

Built with **FastAPI**, **React**, **SQLAlchemy**, and **SQLite**, the application provides a simple interface for creating habits, recording completions, monitoring streaks, and analyzing progress over time.

## Features

* **Daily Habit Tracking** — Create habits and mark them complete with a single click.
* **Streak Tracking** — Track current and longest streaks for your habits.
* **Calendar View** — Visualize completion history on a monthly calendar.
* **Planned Absences** — Skip planned days without negatively affecting streak calculations.
* **Analytics Dashboard** — View overall habit statistics and completion trends.
* **Weekly Analytics** — See completion activity across the last 7 days.
* **30-Day Trends** — Analyze completion activity over the last 30 days.
* **Local SQLite Storage** — Store habit and completion data in a lightweight SQLite database.
* **REST API** — FastAPI backend with automatically generated API documentation.
* **Responsive UI** — React and Tailwind CSS interface designed for desktop and mobile screens.

## Analytics Dashboard

The analytics dashboard provides an overview of habit performance, including:

* Total habits
* Habits completed today
* Overall completion rate
* Current longest streak
* Best streak
* Total completions
* Weekly completion chart
* 30-day completion trend

## Tech Stack

| Layer              | Technology      |
| ------------------ | --------------- |
| Frontend           | React 18, Vite  |
| Styling            | Tailwind CSS    |
| Data Fetching      | TanStack Query  |
| Charts             | Recharts        |
| Routing            | React Router    |
| Backend            | Python, FastAPI |
| ORM                | SQLAlchemy      |
| Database           | SQLite          |
| Validation         | Pydantic        |
| Testing            | Pytest, HTTPX   |
| Package Management | uv, npm         |

## Architecture

```text
┌──────────────────────┐
│     React + Vite     │
│      Frontend        │
│      Port 5173       │
└──────────┬───────────┘
           │
        HTTP/JSON
           │
           ▼
┌──────────────────────┐
│       FastAPI        │
│       Backend        │
│      Port 8000       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│       SQLite         │
│      habits.db       │
└──────────────────────┘
```

## Project Structure

```text
habit-tracker/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── routers/
│   │       ├── habits.py
│   │       ├── completions.py
│   │       └── analytics.py
│   └── tests/
│       ├── test_api_habits.py
│       ├── test_api_completions.py
│       ├── test_api_analytics.py
│       └── test_streak.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── habits/
│   │   │   ├── calendar/
│   │   │   └── analytics/
│   │   ├── pages/
│   │   └── lib/
│   └── package.json
│
├── .gitignore
└── README.md
```

## API

### Habits

| Method | Endpoint           | Description                 |
| ------ | ------------------ | --------------------------- |
| GET    | `/api/habits`      | List habits with statistics |
| POST   | `/api/habits`      | Create a habit              |
| PUT    | `/api/habits/{id}` | Update a habit              |
| DELETE | `/api/habits/{id}` | Delete/archive a habit      |

### Completions

| Method | Endpoint                              | Description            |
| ------ | ------------------------------------- | ---------------------- |
| POST   | `/api/habits/{id}/complete`           | Mark a habit complete  |
| DELETE | `/api/habits/{id}/completions/{date}` | Remove a completion    |
| GET    | `/api/habits/{id}/completions`        | Get completion history |

### Analytics

| Method | Endpoint         | Description                    |
| ------ | ---------------- | ------------------------------ |
| GET    | `/api/analytics` | Get aggregated habit analytics |

### Health

| Method | Endpoint  | Description      |
| ------ | --------- | ---------------- |
| GET    | `/health` | API health check |

Interactive API documentation is available through FastAPI at:

```text
http://localhost:8000/docs
```

## Getting Started

### Prerequisites

* Python 3.11+
* [uv](https://docs.astral.sh/uv/)
* Node.js 18+
* npm

### 1. Clone the repository

```bash
git clone https://github.com/Shwetanjsrey/habit-tracker.git
cd habit-tracker
```

### 2. Start the backend

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

The backend will be available at:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

### 3. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at:

```text
http://localhost:5173
```

## Testing

Backend tests can be run with:

```bash
cd backend
uv run pytest
```

Run with coverage:

```bash
uv run pytest --cov=app
```

## Development

Frontend build:

```bash
cd frontend
npm run build
```

Frontend linting:

```bash
npm run lint
```

## Future Improvements

* User authentication and multi-user support
* Persistent production database
* Habit categories and filtering
* Notifications and reminders
* Data export/import
* More detailed progress visualizations

## License

This project is available for educational and portfolio use.
