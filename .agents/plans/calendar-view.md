# Feature: Calendar View

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files, etc.

## Feature Description

Build a monthly calendar view component that visualizes habit completion history over time. The calendar displays a grid of days for a selected month, with each day color-coded to show completion status (completed = green, skipped = gray, missed = red, future = default). Users can navigate between months and click on days to toggle completion status.

## User Story

As a user
I want to view a calendar of my habit history
So that I can see patterns over time and stay motivated by visual progress

## Problem Statement

Users currently only see today's completion status on habit cards. They cannot visualize their completion history or identify patterns like which days of the week they typically miss. The PRD specifies a calendar view as a core MVP feature.

## Solution Statement

Create a reusable Calendar component within a new `calendar` feature module. The component will:
1. Display a 7-column grid representing a month (Sunday-Saturday)
2. Fetch completion data for the displayed month via the existing API
3. Color-code days based on completion status
4. Support month navigation (prev/next)
5. Highlight today's date
6. Allow clicking days to toggle completion (using existing mutations)

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: Medium
**Primary Systems Affected**: Frontend (new feature module)
**Dependencies**: date-fns (already installed), existing habits API, TanStack Query

---

## CONTEXT REFERENCES

### Relevant Codebase Files - READ BEFORE IMPLEMENTING!

| File | Lines | Why Read |
|------|-------|----------|
| `frontend/src/features/habits/components/HabitCard.jsx` | 1-82 | Pattern for completion toggle, date formatting, clsx usage |
| `frontend/src/features/habits/hooks/useHabits.js` | 1-85 | TanStack Query hook patterns, cache invalidation |
| `frontend/src/features/habits/api/habits.js` | 46-52 | `fetchCompletions` API function with date params |
| `frontend/src/components/ui/Card.jsx` | 1-22 | Compound component pattern for Card |
| `frontend/src/components/ui/Button.jsx` | 1-42 | Button component for navigation |
| `frontend/src/pages/Dashboard.jsx` | 1-51 | Page layout pattern |
| `frontend/src/features/habits/index.js` | 1-13 | Barrel export pattern |

### New Files to Create

```
frontend/src/features/calendar/
├── components/
│   ├── Calendar.jsx           # Main calendar component with month nav
│   ├── CalendarGrid.jsx       # 7-column day grid
│   └── CalendarDay.jsx        # Individual day cell
├── hooks/
│   └── useCompletions.js      # TanStack Query hook for completions
└── index.js                   # Barrel exports
```

### Relevant Documentation

- [date-fns Official Docs](https://date-fns.org/docs/Getting-Started)
  - `startOfMonth`, `endOfMonth`, `eachDayOfInterval`, `getDay`, `format`, `addMonths`, `subMonths`, `isSameMonth`, `isToday`, `isSameDay`
  - Why: Core date utilities for calendar generation
- [TanStack Query v5 Docs](https://tanstack.com/query/v5/docs/framework/react/guides/queries)
  - Query with parameters pattern
  - Why: Fetching completions by month

### Patterns to Follow

**Date Formatting (from HabitCard.jsx:11):**
```javascript
import { format } from 'date-fns';
const today = format(new Date(), 'yyyy-MM-dd');
```

**TanStack Query Hook Pattern (from useHabits.js:22-28):**
```javascript
export function useHabit(id) {
  return useQuery({
    queryKey: ['habits', id],
    queryFn: () => fetchHabit(id),
    enabled: !!id,
  });
}
```

**Conditional Styling with clsx (from HabitCard.jsx:48-55):**
```javascript
className={clsx(
  'base-classes',
  condition && 'conditional-class',
  !condition && 'else-class'
)}
```

**Component Props Pattern (from Card.jsx):**
```javascript
export function Card({ children, className = '' }) {
  return (
    <div className={clsx('bg-white rounded-lg shadow-md', className)}>
      {children}
    </div>
  );
}
```

**API Function Pattern (from habits.js:46-52):**
```javascript
export const fetchCompletions = (id, start = null, end = null) => {
  const params = new URLSearchParams();
  if (start) params.append('start', start);
  if (end) params.append('end', end);
  const query = params.toString();
  return request(`/habits/${id}/completions${query ? `?${query}` : ''}`);
};
```

**Barrel Export Pattern (from habits/index.js):**
```javascript
export { ComponentName } from './components/ComponentName';
export { useHookName } from './hooks/useHookName';
```

---

## IMPLEMENTATION PLAN

### Phase 1: API & Hook Layer

Create the TanStack Query hook for fetching completions data for a specific month.

**Tasks:**
- Create `useCompletions` hook with habitId and month parameters
- Build query key that includes month for proper caching
- Calculate month start/end dates for API params

### Phase 2: Calendar Components

Build the calendar UI components following existing patterns.

**Tasks:**
- Create CalendarDay component for individual day cells
- Create CalendarGrid component for the 7-column layout
- Create Calendar component with month navigation
- Wire up completion toggle on day click

### Phase 3: Integration

Export components and integrate into the app.

**Tasks:**
- Create barrel exports
- Add calendar to HabitCard or create a HabitDetail page
- Test end-to-end with Playwright MCP

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

---

### Task 1: CREATE `frontend/src/features/calendar/hooks/useCompletions.js`

Create TanStack Query hook for fetching habit completions by month.

- **IMPLEMENT**: Query hook that fetches completions for a habit within a month date range
- **PATTERN**: Mirror `useHabit` from `features/habits/hooks/useHabits.js:22-28`
- **IMPORTS**:
  - `useQuery` from `@tanstack/react-query`
  - `fetchCompletions` from `../../habits/api/habits`
  - `format`, `startOfMonth`, `endOfMonth` from `date-fns`
- **GOTCHA**: Query key must include both habitId AND month string for proper caching
- **GOTCHA**: Convert completions array to a Map keyed by date string for O(1) lookup
- **VALIDATE**: Import in another file and check no syntax errors

```javascript
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fetchCompletions } from '../../habits/api/habits';

export function useCompletions(habitId, month) {
  const monthKey = format(month, 'yyyy-MM');
  const start = format(startOfMonth(month), 'yyyy-MM-dd');
  const end = format(endOfMonth(month), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['completions', habitId, monthKey],
    queryFn: async () => {
      const data = await fetchCompletions(habitId, start, end);
      // Convert to Map for O(1) lookup by date
      const completionMap = new Map();
      data.completions.forEach((c) => {
        completionMap.set(c.date, c.status);
      });
      return completionMap;
    },
    enabled: !!habitId,
  });
}
```

---

### Task 2: CREATE `frontend/src/features/calendar/components/CalendarDay.jsx`

Create the individual day cell component.

- **IMPLEMENT**: Day cell with color-coded background based on status, click handler, today highlight
- **PATTERN**: Mirror conditional styling from `HabitCard.jsx:48-55`
- **IMPORTS**: `clsx` from `clsx`, `isToday`, `isSameMonth` from `date-fns`
- **GOTCHA**: Days outside current month should be dimmed
- **GOTCHA**: Future days should not be clickable for completion
- **VALIDATE**: Component renders without errors

```javascript
import clsx from 'clsx';
import { format, isToday, isSameMonth, isFuture } from 'date-fns';

export function CalendarDay({ date, month, status, habitColor, onToggle }) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayNumber = format(date, 'd');
  const isCurrentMonth = isSameMonth(date, month);
  const isDateToday = isToday(date);
  const isFutureDate = isFuture(date);

  const handleClick = () => {
    if (!isFutureDate && isCurrentMonth) {
      onToggle(dateStr, status);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isFutureDate || !isCurrentMonth}
      className={clsx(
        'aspect-square flex items-center justify-center text-sm rounded-md transition-colors',
        // Base states
        !isCurrentMonth && 'text-gray-300 cursor-default',
        isCurrentMonth && !isFutureDate && 'cursor-pointer hover:ring-2 hover:ring-gray-300',
        isFutureDate && isCurrentMonth && 'text-gray-400 cursor-default',
        // Status colors (only for current month, non-future)
        isCurrentMonth && !isFutureDate && status === 'completed' && 'bg-green-500 text-white',
        isCurrentMonth && !isFutureDate && status === 'skipped' && 'bg-gray-400 text-white',
        isCurrentMonth && !isFutureDate && !status && 'bg-red-100 text-red-700',
        // Today highlight
        isDateToday && 'ring-2 ring-primary ring-offset-1'
      )}
      aria-label={`${format(date, 'MMMM d, yyyy')}${status ? `, ${status}` : ''}`}
    >
      {dayNumber}
    </button>
  );
}
```

---

### Task 3: CREATE `frontend/src/features/calendar/components/CalendarGrid.jsx`

Create the 7-column calendar grid component.

- **IMPLEMENT**: Generate 42 days (6 weeks) starting from the first Sunday on or before month start
- **PATTERN**: Use Tailwind grid like existing components
- **IMPORTS**: `eachDayOfInterval`, `startOfMonth`, `endOfMonth`, `startOfWeek`, `endOfWeek`, `format` from `date-fns`
- **GOTCHA**: Need padding days from previous/next month to fill complete weeks
- **VALIDATE**: Grid displays 7 columns with proper day headers

```javascript
import {
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { CalendarDay } from './CalendarDay';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarGrid({ month, completions, habitColor, onToggle }) {
  // Generate calendar days including padding from adjacent months
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calendarStart = startOfWeek(monthStart); // Sunday before month start
  const calendarEnd = endOfWeek(monthEnd); // Saturday after month end

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-medium text-gray-500 py-1"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <CalendarDay
            key={day.toISOString()}
            date={day}
            month={month}
            status={completions?.get(day.toISOString().slice(0, 10))}
            habitColor={habitColor}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}
```

---

### Task 4: CREATE `frontend/src/features/calendar/components/Calendar.jsx`

Create the main calendar component with month navigation.

- **IMPLEMENT**: Calendar wrapper with prev/next month buttons, month/year display, grid
- **PATTERN**: Mirror layout patterns from `Dashboard.jsx`
- **IMPORTS**: `useState` from `react`, `addMonths`, `subMonths`, `format` from `date-fns`, `ChevronLeft`, `ChevronRight` from `lucide-react`
- **GOTCHA**: Initialize month to current month
- **GOTCHA**: Wire up completion toggle to mutations
- **VALIDATE**: Can navigate months, see completion status

```javascript
import { useState } from 'react';
import { addMonths, subMonths, format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarGrid } from './CalendarGrid';
import { useCompletions } from '../hooks/useCompletions';
import { useCompleteHabit, useUncompleteHabit } from '../../habits';
import { Card } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Spinner';

export function Calendar({ habitId, habitColor = '#10B981' }) {
  const [month, setMonth] = useState(new Date());

  const { data: completions, isLoading, error } = useCompletions(habitId, month);
  const { mutate: complete } = useCompleteHabit();
  const { mutate: uncomplete } = useUncompleteHabit();

  const handlePrevMonth = () => setMonth((m) => subMonths(m, 1));
  const handleNextMonth = () => setMonth((m) => addMonths(m, 1));

  const handleToggle = (dateStr, currentStatus) => {
    if (currentStatus === 'completed') {
      uncomplete({ id: habitId, date: dateStr });
    } else {
      complete({ id: habitId, date: dateStr });
    }
  };

  if (error) {
    return (
      <Card className="p-4">
        <p className="text-red-600 text-center">Failed to load calendar</p>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header className="flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <h3 className="font-semibold text-gray-900">
          {format(month, 'MMMM yyyy')}
        </h3>

        <button
          onClick={handleNextMonth}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </Card.Header>

      <Card.Body>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <CalendarGrid
            month={month}
            completions={completions}
            habitColor={habitColor}
            onToggle={handleToggle}
          />
        )}
      </Card.Body>
    </Card>
  );
}
```

---

### Task 5: CREATE `frontend/src/features/calendar/index.js`

Create barrel exports for the calendar feature.

- **IMPLEMENT**: Export Calendar component and useCompletions hook
- **PATTERN**: Mirror `features/habits/index.js`
- **VALIDATE**: Can import from `../features/calendar`

```javascript
export { Calendar } from './components/Calendar';
export { useCompletions } from './hooks/useCompletions';
```

---

### Task 6: UPDATE `frontend/src/features/habits/components/HabitCard.jsx`

Add calendar view toggle to HabitCard for viewing completion history.

- **IMPLEMENT**: Add expand/collapse button to show Calendar component inline
- **IMPORTS**: Add `useState` from `react`, `Calendar`, `ChevronDown` from `lucide-react`
- **PATTERN**: Conditional rendering like modal in Dashboard.jsx
- **GOTCHA**: Pass habitId and habit.color to Calendar
- **VALIDATE**: Click chevron shows calendar below habit card

Add to existing imports:
```javascript
import { useState } from 'react';
import { Check, Flame, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { Calendar } from '../../calendar';
```

Add state after existing hooks:
```javascript
const [showCalendar, setShowCalendar] = useState(false);
```

Add toggle button after stats div and calendar section:
```javascript
{/* Calendar toggle */}
<button
  onClick={() => setShowCalendar(!showCalendar)}
  className="mt-3 w-full flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700 py-1"
  aria-expanded={showCalendar}
  aria-label={showCalendar ? 'Hide calendar' : 'Show calendar'}
>
  {showCalendar ? (
    <>
      <ChevronUp className="w-4 h-4" />
      Hide Calendar
    </>
  ) : (
    <>
      <ChevronDown className="w-4 h-4" />
      Show Calendar
    </>
  )}
</button>

{/* Calendar view */}
{showCalendar && (
  <div className="mt-4 -mx-4 -mb-4">
    <Calendar habitId={habit.id} habitColor={habit.color} />
  </div>
)}
```

---

### Task 7: UPDATE `frontend/src/features/habits/hooks/useHabits.js`

Update mutations to also invalidate completions cache when toggling.

- **IMPLEMENT**: Add completions invalidation to useCompleteHabit and useUncompleteHabit
- **PATTERN**: Already using queryClient.invalidateQueries
- **GOTCHA**: Use partial match on queryKey to invalidate all months
- **VALIDATE**: Toggling completion updates calendar view

Update `useCompleteHabit`:
```javascript
export function useCompleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, date }) => completeHabit(id, date),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['completions', id] });
    },
  });
}
```

Update `useUncompleteHabit`:
```javascript
export function useUncompleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, date }) => uncompleteHabit(id, date),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['completions', id] });
    },
  });
}
```

---

### Task 8: FIX CalendarGrid completions lookup

Fix the date key format to match API response format.

- **IMPLEMENT**: Use `format(day, 'yyyy-MM-dd')` for map lookup instead of `toISOString().slice()`
- **GOTCHA**: API returns dates as `YYYY-MM-DD` strings, not ISO timestamps
- **VALIDATE**: Calendar displays correct completion status

Update CalendarGrid.jsx days mapping:
```javascript
{days.map((day) => {
  const dateKey = format(day, 'yyyy-MM-dd');
  return (
    <CalendarDay
      key={dateKey}
      date={day}
      month={month}
      status={completions?.get(dateKey)}
      habitColor={habitColor}
      onToggle={onToggle}
    />
  );
})}
```

Add `format` to imports:
```javascript
import {
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
} from 'date-fns';
```

---

### Task 9: CREATE `README.md`

Create project README with overview, quick start, and architecture documentation.

- **IMPLEMENT**: Concise README with overview paragraph, prerequisites, quick start, and architecture sections
- **PATTERN**: Standard open-source README format
- **GOTCHA**: Must reflect actual project structure after calendar feature is complete
- **GOTCHA**: Quick start should have both backend and frontend commands
- **VALIDATE**: README renders correctly in GitHub/VS Code markdown preview

```markdown
# Habit Tracker

A personal habit tracking web application for building and maintaining daily habits through streak tracking, completion rates, and calendar visualization. Built with FastAPI (Python) backend and React frontend, this local-first application runs entirely on your machine with no account required—just simple, distraction-free habit tracking.

## Prerequisites

- **Python 3.11+** with [uv](https://github.com/astral-sh/uv) package manager
- **Node.js 18+** with npm
- **Git** (optional, for cloning)

## Quick Start

### 1. Clone and Setup Backend

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

Backend runs at http://localhost:8000 (API docs at http://localhost:8000/docs)

### 2. Setup Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173

### 3. Open the App

Navigate to **http://localhost:5173** in your browser. Create your first habit and start tracking!

## Architecture

```
┌─────────────────┐     HTTP/JSON      ┌─────────────────┐
│  React + Vite   │ ◄───────────────► │    FastAPI      │
│   Port 5173     │                    │   Port 8000     │
└─────────────────┘                    └────────┬────────┘
                                                │
                                       ┌─────────────────┐
                                       │     SQLite      │
                                       │   habits.db     │
                                       └─────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.11, FastAPI, SQLAlchemy, SQLite |
| Frontend | React 18, Vite, TanStack Query, Tailwind CSS |
| Date Handling | date-fns |

### Project Structure

```
habit-tracker/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI entry point
│   │   ├── database.py       # SQLite connection
│   │   ├── models.py         # SQLAlchemy models (Habit, Completion)
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   └── routers/          # API endpoints
│   │       ├── habits.py     # CRUD + streak calculation
│   │       └── completions.py
│   └── tests/                # pytest tests
├── frontend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── habits/       # Habit components, hooks, API
│   │   │   └── calendar/     # Calendar view components
│   │   ├── components/ui/    # Shared UI components
│   │   ├── pages/            # Route pages
│   │   └── lib/              # Utilities
│   └── package.json
└── README.md
```

## Features

- **Daily Habit Tracking** — Create habits, mark them complete with one click
- **Streak Tracking** — See current streak and completion rate per habit
- **Calendar View** — Monthly grid showing completion history with color-coded days
- **Planned Absences** — Skip days without breaking your streak
- **Local & Private** — All data stored locally in SQLite, no account needed

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/habits` | List all habits with stats |
| POST | `/api/habits` | Create a new habit |
| POST | `/api/habits/{id}/complete` | Mark habit complete for a date |
| DELETE | `/api/habits/{id}/completions/{date}` | Undo a completion |
| GET | `/api/habits/{id}/completions` | Get completion history |

Full API documentation available at http://localhost:8000/docs when backend is running.
```

---

## TESTING STRATEGY

### Manual Testing with Playwright MCP

1. **Calendar Display Test**
   - Navigate to http://localhost:5173
   - Create a habit if none exists
   - Click "Show Calendar" on a habit card
   - Verify calendar grid displays with current month
   - Verify weekday headers (Sun-Sat)
   - Verify today is highlighted

2. **Month Navigation Test**
   - Click left arrow to go to previous month
   - Verify month/year label updates
   - Click right arrow to go to next month
   - Verify grid updates with new dates

3. **Completion Toggle Test**
   - Click on a past day in the calendar
   - Verify day turns green (completed)
   - Click same day again
   - Verify day turns red (incomplete/missed)
   - Verify streak on habit card updates

4. **Status Display Test**
   - Complete a habit for today via main toggle
   - Open calendar
   - Verify today shows green in calendar

### Edge Cases to Test

- First day of month is Sunday (no padding needed before)
- First day of month is Saturday (6 padding days before)
- Current month view with future dates (should be dimmed/disabled)
- Empty completions (all days should be red/empty)
- Habit created mid-month (days before creation could show different)

---

## VALIDATION COMMANDS

### Level 1: Syntax & Build

```bash
cd frontend && npm run build
```

### Level 2: Development Server

```bash
# Terminal 1: Backend
cd backend && uv run uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend && npm run dev
```

### Level 3: Manual Browser Test

1. Open http://localhost:5173
2. Create habit if needed
3. Click "Show Calendar" on habit card
4. Navigate months
5. Click days to toggle completion
6. Verify no console errors

### Level 4: Playwright MCP E2E Validation

Using Playwright MCP tools:
1. `browser_navigate` to http://localhost:5173
2. `browser_snapshot` to see current state
3. `browser_click` on "Show Calendar" button
4. `browser_snapshot` to verify calendar appears
5. `browser_click` on a day in the calendar
6. `browser_snapshot` to verify status changed

---

## ACCEPTANCE CRITERIA

- [x] Calendar displays monthly grid with 7 columns (Sun-Sat)
- [ ] Weekday headers display above grid
- [ ] Current month and year shown in header
- [ ] Previous/Next month navigation works
- [ ] Days show completion status: green (completed), gray (skipped), red (missed)
- [ ] Today's date is highlighted with ring
- [ ] Future dates are dimmed and not clickable
- [ ] Days outside current month are dimmed
- [ ] Clicking a day toggles completion status
- [ ] Calendar data fetches from API with date range
- [ ] Calendar appears inline under habit card when expanded
- [ ] Toggling completion from calendar updates habit card streak
- [ ] Loading spinner shows while fetching data
- [ ] Error state displayed on API failure
- [ ] No console errors during normal operation
- [ ] README.md exists at project root with overview, quick start, and architecture

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed immediately
- [ ] `npm run build` completes without errors
- [ ] Development server starts without errors
- [ ] Calendar displays correctly with proper styling
- [ ] Month navigation works
- [ ] Day click toggles completion
- [ ] Cache invalidation works (calendar updates after toggle)
- [ ] Playwright MCP E2E validation passes
- [ ] Code follows project conventions (CLAUDE.md)
- [ ] README.md created with all required sections

---

## NOTES

### Design Decisions

1. **Inline Calendar vs Separate Page**: Calendar appears inline under habit card for quick access. A full HabitDetail page can be added later as an enhancement.

2. **6-Week Grid**: Always show 42 days (6 complete weeks) to maintain consistent grid size regardless of month length or starting day.

3. **Completion Map**: Convert API response array to Map for O(1) lookup per day instead of O(n) array search.

4. **No Optimistic Updates**: Initial implementation uses server-confirmed updates. Can add optimistic updates later if performance is insufficient.

5. **Red for Missed**: Past days without completion show red background to indicate missed days, creating visual urgency. This matches PRD spec.

### Potential Issues

1. **Timezone**: Using local date which should match backend. If timezone issues occur, may need to standardize on UTC.

2. **Performance with Many Days**: 42 CalendarDay components render per month. Should be fine, but could memoize if needed.

3. **Cache Key Strategy**: Query key includes month string (`yyyy-MM`) to properly cache by month. Invalidation uses partial match to clear all months for a habit.

### Future Enhancements

- Skip functionality on calendar click (hold or right-click?)
- Habit detail page with larger calendar
- Year view / heatmap visualization
- Export calendar data
