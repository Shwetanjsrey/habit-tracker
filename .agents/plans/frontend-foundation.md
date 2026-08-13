# Feature: Frontend Foundation

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files, etc.

## Feature Description

Build the React frontend foundation for the Habit Tracker application. This includes scaffolding a Vite + React project, configuring Tailwind CSS, setting up TanStack Query for server state management, creating the API client layer, and implementing the core Dashboard page with habit list and creation functionality. End-to-end validation will use the Playwright MCP server.

## User Story

As a user
I want to see my habits on a dashboard and create new ones
So that I can track my daily habits visually

## Problem Statement

The backend API is complete and tested, but there's no user interface. Users cannot interact with the habit tracking system without a frontend application.

## Solution Statement

Implement a React SPA using Vite that connects to the FastAPI backend. The frontend will use TanStack Query for efficient data fetching and caching, Tailwind CSS for styling, and provide a clean, responsive dashboard for habit management.

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: Medium
**Primary Systems Affected**: Frontend (new), Backend (existing API consumer)
**Dependencies**: React 18, Vite 5, TanStack Query v5, Tailwind CSS v3, react-router-dom v6, date-fns, lucide-react

---

## CONTEXT REFERENCES

### Relevant Codebase Files - READ BEFORE IMPLEMENTING!

| File | Lines | Why Read |
|------|-------|----------|
| `backend/app/schemas.py` | 1-98 | API response shapes - TypeScript types must match |
| `backend/app/routers/habits.py` | 151-269 | Habit endpoints structure and response format |
| `backend/app/routers/completions.py` | 35-179 | Completion endpoints for toggle functionality |
| `.claude/reference/react-frontend-best-practices.md` | 1-1320 | Component patterns, TanStack Query, hooks, forms |
| `.claude/reference/testing-and-logging.md` | 620-750 | Playwright E2E testing patterns |
| `.claude/PRD.md` | 136-178 | Directory structure specification |
| `CLAUDE.md` | 95-103 | Frontend code conventions |

### New Files to Create

```
frontend/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .gitignore
├── src/
│   ├── main.jsx                     # React entry point + QueryClient
│   ├── App.jsx                      # Router setup
│   ├── index.css                    # Tailwind imports
│   ├── lib/
│   │   └── api.js                   # Base API client
│   ├── features/
│   │   └── habits/
│   │       ├── api/
│   │       │   └── habits.js        # Habit API functions
│   │       ├── hooks/
│   │       │   └── useHabits.js     # TanStack Query hooks
│   │       ├── components/
│   │       │   ├── HabitCard.jsx    # Individual habit display
│   │       │   ├── HabitForm.jsx    # Create/edit form
│   │       │   └── HabitList.jsx    # Habit list container
│   │       └── index.js             # Barrel exports
│   ├── components/
│   │   └── ui/
│   │       ├── Button.jsx           # Reusable button
│   │       ├── Card.jsx             # Card wrapper
│   │       └── Spinner.jsx          # Loading indicator
│   └── pages/
│       └── Dashboard.jsx            # Main dashboard page
└── tests/
    └── e2e/
        └── habits.spec.js           # Playwright E2E tests
```

### Relevant Documentation - READ BEFORE IMPLEMENTING!

- [TanStack Query v5 Installation](https://tanstack.com/query/v5/docs/framework/react/installation)
  - QueryClient setup and provider configuration
  - Why: Required for proper data fetching setup
- [Vite Configuration](https://vitejs.dev/config/)
  - Proxy setup for API requests
  - Why: Needed to proxy /api requests to backend
- [Tailwind CSS with Vite](https://tailwindcss.com/docs/guides/vite)
  - PostCSS and Tailwind configuration
  - Why: Proper Tailwind setup with Vite
- [Playwright MCP Server](https://github.com/microsoft/playwright-mcp)
  - MCP server for browser automation
  - Why: E2E validation using Playwright MCP

### Patterns to Follow

**API Response Types (from backend schemas.py):**
```javascript
// Habit response shape
{
  id: number,
  name: string,
  description: string | null,
  color: string,
  current_streak: number,
  longest_streak: number,
  completion_rate: number,
  completed_today: boolean,
  created_at: string,
  archived_at: string | null
}

// HabitListResponse
{ habits: Habit[] }

// CompletionResponse
{ date: string, status: string, notes: string | null }
```

**API Client Pattern (from react-frontend-best-practices.md:460-487):**
```javascript
const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'An error occurred');
  }

  if (response.status === 204) return null;
  return response.json();
}
```

**TanStack Query Pattern (from react-frontend-best-practices.md:330-420):**
```javascript
// Query hook
export function useHabits() {
  return useQuery({
    queryKey: ['habits'],
    queryFn: fetchHabits,
  });
}

// Mutation with invalidation
export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}
```

**Component Naming:**
- Files: `PascalCase.jsx`
- Hooks: `camelCase.js` with `use` prefix
- Utilities: `camelCase.js`

---

## IMPLEMENTATION PLAN

### Phase 1: Project Scaffolding

Set up the Vite + React project with all configuration files.

**Tasks:**
- Create frontend directory and initialize npm project
- Configure Vite with proxy for API
- Set up Tailwind CSS
- Create base directory structure

### Phase 2: API Layer

Build the API client and habit-specific API functions.

**Tasks:**
- Create base API client with error handling
- Implement habit CRUD API functions
- Implement completion API functions

### Phase 3: State Management

Set up TanStack Query with custom hooks.

**Tasks:**
- Configure QueryClient in main.jsx
- Create habit query and mutation hooks
- Create completion mutation hooks

### Phase 4: Core Components

Build the UI components needed for the dashboard.

**Tasks:**
- Create reusable UI components (Button, Card, Spinner)
- Create HabitCard component with completion toggle
- Create HabitForm component
- Create HabitList container component

### Phase 5: Pages & Routing

Wire everything together with routing.

**Tasks:**
- Create Dashboard page
- Set up React Router
- Configure App component

### Phase 6: E2E Testing with Playwright MCP

Validate the implementation using Playwright MCP server.

**Tasks:**
- Create E2E test file
- Test habit creation flow
- Test completion toggle flow

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

---

### Task 1: CREATE `frontend/package.json`

Initialize the frontend project with all dependencies.

- **IMPLEMENT**: Package configuration with React 18, Vite 5, TanStack Query v5, Tailwind
- **GOTCHA**: Use exact versions to avoid compatibility issues
- **GOTCHA**: Include proxy script for development
- **VALIDATE**: `cd frontend && npm install`

```json
{
  "name": "habit-tracker-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.60.0",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.460.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.15",
    "vite": "^5.4.11"
  }
}
```

---

### Task 2: CREATE `frontend/vite.config.js`

Configure Vite with API proxy.

- **IMPLEMENT**: React plugin and proxy configuration
- **PATTERN**: Reference `.claude/PRD.md` lines 309-315
- **GOTCHA**: Proxy target must match backend port (8000)
- **VALIDATE**: File exists and is valid JavaScript

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

---

### Task 3: CREATE `frontend/tailwind.config.js`

Configure Tailwind CSS.

- **IMPLEMENT**: Content paths and theme extension
- **PATTERN**: Reference `.claude/reference/react-frontend-best-practices.md` lines 595-606
- **VALIDATE**: File exists and is valid JavaScript

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#10B981',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
      },
    },
  },
  plugins: [],
};
```

---

### Task 4: CREATE `frontend/postcss.config.js`

Configure PostCSS for Tailwind.

- **IMPLEMENT**: Tailwind and autoprefixer plugins
- **VALIDATE**: File exists and is valid JavaScript

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

### Task 5: CREATE `frontend/index.html`

Create the HTML entry point.

- **IMPLEMENT**: HTML with root div and script module
- **VALIDATE**: File exists and is valid HTML

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Habit Tracker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

### Task 6: CREATE `frontend/src/index.css`

Create Tailwind CSS entry point.

- **IMPLEMENT**: Tailwind directives
- **PATTERN**: Reference `.claude/reference/react-frontend-best-practices.md` lines 608-611
- **VALIDATE**: File exists

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

### Task 7: CREATE `frontend/src/lib/api.js`

Create the base API client.

- **IMPLEMENT**: Fetch wrapper with error handling
- **PATTERN**: Reference `.claude/reference/react-frontend-best-practices.md` lines 460-487
- **GOTCHA**: Handle 204 No Content responses (returns null)
- **VALIDATE**: `cd frontend && node -c src/lib/api.js` (syntax check)

```javascript
const API_BASE = '/api';

export async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'An error occurred');
  }

  if (response.status === 204) return null;
  return response.json();
}
```

---

### Task 8: CREATE `frontend/src/features/habits/api/habits.js`

Create habit-specific API functions.

- **IMPLEMENT**: CRUD operations matching backend endpoints
- **PATTERN**: Reference `backend/app/routers/habits.py` for endpoint structure
- **IMPORTS**: `import { request } from '../../../lib/api';`
- **GOTCHA**: `completeHabit` needs date in body as `{ date: "YYYY-MM-DD" }`
- **VALIDATE**: `cd frontend && node -c src/features/habits/api/habits.js`

```javascript
import { request } from '../../../lib/api';

export const fetchHabits = () => request('/habits');

export const fetchHabit = (id) => request(`/habits/${id}`);

export const createHabit = (data) =>
  request('/habits', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateHabit = (id, data) =>
  request(`/habits/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteHabit = (id) =>
  request(`/habits/${id}`, {
    method: 'DELETE',
  });

export const archiveHabit = (id) =>
  request(`/habits/${id}/archive`, {
    method: 'PATCH',
  });

export const completeHabit = (id, date) =>
  request(`/habits/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify({ date }),
  });

export const skipHabit = (id, date, reason = null) =>
  request(`/habits/${id}/skip`, {
    method: 'POST',
    body: JSON.stringify({ date, reason }),
  });

export const uncompleteHabit = (id, date) =>
  request(`/habits/${id}/completions/${date}`, {
    method: 'DELETE',
  });

export const fetchCompletions = (id, start = null, end = null) => {
  const params = new URLSearchParams();
  if (start) params.append('start', start);
  if (end) params.append('end', end);
  const query = params.toString();
  return request(`/habits/${id}/completions${query ? `?${query}` : ''}`);
};
```

---

### Task 9: CREATE `frontend/src/features/habits/hooks/useHabits.js`

Create TanStack Query hooks for habits.

- **IMPLEMENT**: Query and mutation hooks with cache invalidation
- **PATTERN**: Reference `.claude/reference/react-frontend-best-practices.md` lines 330-420
- **IMPORTS**: `import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';`
- **GOTCHA**: Invalidate queries on success for mutations
- **VALIDATE**: `cd frontend && node -c src/features/habits/hooks/useHabits.js`

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchHabits,
  fetchHabit,
  createHabit,
  updateHabit,
  deleteHabit,
  completeHabit,
  uncompleteHabit,
} from '../api/habits';

export function useHabits() {
  return useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const data = await fetchHabits();
      return data.habits;
    },
  });
}

export function useHabit(id) {
  return useQuery({
    queryKey: ['habits', id],
    queryFn: () => fetchHabit(id),
    enabled: !!id,
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateHabit(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habits', id] });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

export function useCompleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, date }) => completeHabit(id, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

export function useUncompleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, date }) => uncompleteHabit(id, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}
```

---

### Task 10: CREATE `frontend/src/features/habits/index.js`

Create barrel exports.

- **IMPLEMENT**: Export all public components and hooks
- **VALIDATE**: File exists

```javascript
export { HabitCard } from './components/HabitCard';
export { HabitForm } from './components/HabitForm';
export { HabitList } from './components/HabitList';
export {
  useHabits,
  useHabit,
  useCreateHabit,
  useUpdateHabit,
  useDeleteHabit,
  useCompleteHabit,
  useUncompleteHabit,
} from './hooks/useHabits';
```

---

### Task 11: CREATE `frontend/src/components/ui/Spinner.jsx`

Create loading spinner component.

- **IMPLEMENT**: Animated spinner using Tailwind
- **VALIDATE**: File exists

```jsx
export function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
```

---

### Task 12: CREATE `frontend/src/components/ui/Button.jsx`

Create reusable button component.

- **IMPLEMENT**: Button with variants and loading state
- **PATTERN**: Reference `.claude/reference/react-frontend-best-practices.md` lines 617-631
- **VALIDATE**: File exists

```jsx
import clsx from 'clsx';
import { Spinner } from './Spinner';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-600 focus:ring-primary',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Spinner size="sm" className="mr-2" />}
      {children}
    </button>
  );
}
```

---

### Task 13: CREATE `frontend/src/components/ui/Card.jsx`

Create card wrapper component.

- **IMPLEMENT**: Card with optional header
- **PATTERN**: Reference `.claude/reference/react-frontend-best-practices.md` lines 122-139
- **VALIDATE**: File exists

```jsx
import clsx from 'clsx';

export function Card({ children, className = '' }) {
  return (
    <div className={clsx('bg-white rounded-lg shadow-md', className)}>
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ children, className = '' }) {
  return (
    <div className={clsx('px-4 py-3 border-b border-gray-100', className)}>
      {children}
    </div>
  );
};

Card.Body = function CardBody({ children, className = '' }) {
  return <div className={clsx('p-4', className)}>{children}</div>;
};
```

---

### Task 14: CREATE `frontend/src/features/habits/components/HabitCard.jsx`

Create the habit card component.

- **IMPLEMENT**: Card displaying habit info with completion toggle
- **IMPORTS**: Use lucide-react for icons
- **PATTERN**: Reference `backend/app/schemas.py` lines 41-53 for data shape
- **GOTCHA**: Use today's date in ISO format for completion
- **VALIDATE**: File exists

```jsx
import { format } from 'date-fns';
import { Check, Flame, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '../../../components/ui/Card';
import { useCompleteHabit, useUncompleteHabit } from '../hooks/useHabits';

export function HabitCard({ habit }) {
  const { mutate: complete, isPending: isCompleting } = useCompleteHabit();
  const { mutate: uncomplete, isPending: isUncompleting } = useUncompleteHabit();

  const today = format(new Date(), 'yyyy-MM-dd');
  const isPending = isCompleting || isUncompleting;

  const handleToggle = () => {
    if (habit.completed_today) {
      uncomplete({ id: habit.id, date: today });
    } else {
      complete({ id: habit.id, date: today });
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-stretch">
        {/* Color bar */}
        <div
          className="w-2 flex-shrink-0"
          style={{ backgroundColor: habit.color }}
        />

        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {habit.name}
              </h3>
              {habit.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {habit.description}
                </p>
              )}
            </div>

            {/* Completion toggle */}
            <button
              onClick={handleToggle}
              disabled={isPending}
              className={clsx(
                'ml-4 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                habit.completed_today
                  ? 'bg-primary text-white'
                  : 'border-2 border-gray-300 text-gray-400 hover:border-primary hover:text-primary',
                isPending && 'opacity-50 cursor-wait'
              )}
              aria-label={
                habit.completed_today ? 'Mark as incomplete' : 'Mark as complete'
              }
            >
              <Check className="w-5 h-5" />
            </button>
          </div>

          {/* Stats */}
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-orange-500">
              <Flame className="w-4 h-4" />
              <span className="font-medium">{habit.current_streak}</span>
              <span className="text-gray-500">day streak</span>
            </div>

            <div className="flex items-center gap-1 text-blue-500">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">{habit.completion_rate}%</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
```

---

### Task 15: CREATE `frontend/src/features/habits/components/HabitForm.jsx`

Create the habit creation form.

- **IMPLEMENT**: Form with name, description, color fields
- **PATTERN**: Reference `.claude/reference/react-frontend-best-practices.md` lines 550-577
- **GOTCHA**: Color picker with preset options
- **VALIDATE**: File exists

```jsx
import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { useCreateHabit } from '../hooks/useHabits';

const COLOR_OPTIONS = [
  '#10B981', // Green (default)
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
];

export function HabitForm({ onSuccess }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [error, setError] = useState('');

  const { mutate: createHabit, isPending } = useCreateHabit();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    createHabit(
      {
        name: name.trim(),
        description: description.trim() || null,
        color,
      },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          setColor(COLOR_OPTIONS[0]);
          onSuccess?.();
        },
        onError: (err) => {
          setError(err.message);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="habit-name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Habit Name
        </label>
        <input
          id="habit-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Morning meditation"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          maxLength={100}
        />
      </div>

      <div>
        <label
          htmlFor="habit-description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description (optional)
        </label>
        <textarea
          id="habit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this habit involve?"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          maxLength={500}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color
        </label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full transition-transform ${
                color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Select color ${c}`}
            />
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" isLoading={isPending} className="w-full">
        Create Habit
      </Button>
    </form>
  );
}
```

---

### Task 16: CREATE `frontend/src/features/habits/components/HabitList.jsx`

Create the habit list container.

- **IMPLEMENT**: List with loading, error, and empty states
- **PATTERN**: Reference `.claude/reference/react-frontend-best-practices.md` lines 344-356
- **VALIDATE**: File exists

```jsx
import { useHabits } from '../hooks/useHabits';
import { HabitCard } from './HabitCard';
import { Spinner } from '../../../components/ui/Spinner';

export function HabitList() {
  const { data: habits, isLoading, error } = useHabits();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-2">Failed to load habits</p>
        <p className="text-sm text-gray-500">{error.message}</p>
      </div>
    );
  }

  if (!habits || habits.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No habits yet.</p>
        <p className="text-sm text-gray-400 mt-1">
          Create your first habit to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="habit-list">
      {habits.map((habit) => (
        <HabitCard key={habit.id} habit={habit} />
      ))}
    </div>
  );
}
```

---

### Task 17: CREATE `frontend/src/pages/Dashboard.jsx`

Create the main dashboard page.

- **IMPLEMENT**: Page with habit list and creation form in modal
- **IMPORTS**: Use lucide-react for Plus icon
- **VALIDATE**: File exists

```jsx
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { HabitList, HabitForm } from '../features/habits';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export function Dashboard() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Habit Tracker</h1>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Habit
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <HabitList />
      </main>

      {/* Modal overlay */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <Card.Header className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Create New Habit</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </Card.Header>
            <Card.Body>
              <HabitForm onSuccess={() => setShowForm(false)} />
            </Card.Body>
          </Card>
        </div>
      )}
    </div>
  );
}
```

---

### Task 18: CREATE `frontend/src/App.jsx`

Create the router configuration.

- **IMPLEMENT**: React Router with Dashboard route
- **PATTERN**: Reference `.claude/reference/react-frontend-best-practices.md` lines 888-906
- **VALIDATE**: File exists

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

### Task 19: CREATE `frontend/src/main.jsx`

Create the React entry point with QueryClient.

- **IMPLEMENT**: QueryClient configuration and providers
- **PATTERN**: Reference `.claude/reference/react-frontend-best-practices.md` lines 308-327
- **GOTCHA**: Import CSS file
- **VALIDATE**: File exists

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

---

### Task 20: CREATE `frontend/.gitignore`

Create gitignore for frontend.

- **IMPLEMENT**: Ignore node_modules, dist, and IDE files
- **VALIDATE**: File exists

```
node_modules
dist
dist-ssr
*.local
.DS_Store
```

---

### Task 21: INSTALL dependencies and validate build

Install npm dependencies and run the dev server.

- **VALIDATE**: `cd frontend && npm install && npm run build`

---

### Task 22: VALIDATE with Playwright MCP

Use Playwright MCP server to validate the frontend works end-to-end.

- **PREREQUISITE**: Backend must be running on port 8000
- **PREREQUISITE**: Frontend must be running on port 5173
- **VALIDATE**: Using Playwright MCP browser_navigate, browser_click, browser_type tools:
  1. Navigate to http://localhost:5173
  2. Don't take snapshots - takes too much context (verify other ways)
  3. Click "Add Habit" button
  4. Fill in habit name "Test Habit"
  5. Click "Create Habit" button
  6. Verify habit appears in list
  7. Click completion toggle on the habit
  8. Verify streak updates to 1

---

## TESTING STRATEGY

### E2E Tests with Playwright MCP

Use the Playwright MCP server for interactive E2E validation:

1. **Dashboard Load Test**
   - Navigate to /
   - Verify "Habit Tracker" header visible
   - Verify "Add Habit" button visible

2. **Create Habit Test**
   - Click "Add Habit"
   - Fill form with name "Exercise"
   - Select color
   - Submit form
   - Verify habit card appears

3. **Complete Habit Test**
   - With existing habit, click completion toggle
   - Verify checkmark appears (filled state)
   - Verify streak counter shows 1

4. **Undo Completion Test**
   - With completed habit, click toggle again
   - Verify returns to incomplete state
   - Verify streak counter shows 0

### Manual Validation Steps

1. Start backend: `cd backend && uv run uvicorn app.main:app --reload`
2. Start frontend: `cd frontend && npm run dev`
3. Open http://localhost:5173
4. Create a habit and verify it appears
5. Complete the habit and verify streak updates
6. Undo completion and verify state reverts

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Dependency Installation

```bash
cd frontend && npm install
```

### Level 2: Build Check

```bash
cd frontend && npm run build
```

### Level 3: Development Server

```bash
# Terminal 1: Backend
cd backend && uv run uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend && npm run dev
```

### Level 4: Manual Browser Test

1. Open http://localhost:5173
2. Verify dashboard loads without errors
3. Create a habit
4. Complete the habit
5. Check browser console for errors

### Level 5: Playwright MCP E2E Validation

Using Playwright MCP tools:
1. `browser_navigate` to http://localhost:5173
2. `browser_click` on "Add Habit" button
3. `browser_type` to fill in habit name
4. `browser_click` to submit form
5. `browser_click` on completion toggle

---

## ACCEPTANCE CRITERIA

- [ ] Frontend serves at http://localhost:5173
- [ ] Dashboard page displays with header and "Add Habit" button
- [ ] Empty state shown when no habits exist
- [ ] Can create a new habit via form
- [ ] Habit card displays name, description, color bar
- [ ] Habit card shows current streak and completion rate
- [ ] Completion toggle marks habit complete for today
- [ ] Completion toggle can undo (mark incomplete)
- [ ] Loading spinner shown while fetching data
- [ ] Error states displayed on API failures
- [ ] Form validation prevents empty habit names
- [ ] API proxy correctly forwards to backend
- [ ] Build completes without errors
- [ ] E2E validation passes with Playwright MCP

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed immediately
- [ ] npm install completes without errors
- [ ] npm run build completes without errors
- [ ] Development server starts without errors
- [ ] API requests proxied to backend correctly
- [ ] Create habit flow works end-to-end
- [ ] Complete habit flow works end-to-end
- [ ] Playwright MCP E2E validation passes
- [ ] Code follows project conventions (CLAUDE.md)

---

## NOTES

### Design Decisions

1. **Feature-based structure**: Components, hooks, and API functions grouped by feature (`features/habits/`) for better organization and scalability.

2. **TanStack Query for server state**: No local state for habit data - TanStack Query handles caching, refetching, and synchronization with the server.

3. **Controlled forms without library**: Simple form with useState since we only have one form. Can add react-hook-form + zod later if forms grow complex.

4. **Modal for create form**: Simple overlay modal rather than separate page to keep user context on the dashboard.

5. **Optimistic updates deferred**: Initial implementation uses server-confirmed updates. Can add optimistic updates in Phase 3 for snappier UX.

### Potential Issues

1. **CORS in production**: Current setup relies on Vite proxy. Production deployment will need proper CORS config or same-origin hosting.

2. **Date timezone**: Using local date for completion toggle. Backend expects ISO format (YYYY-MM-DD).

3. **Modal accessibility**: Current modal implementation is basic. May need focus trap and escape key handling for full accessibility.

### Future Enhancements (Phase 3)

- Calendar view component
- Habit detail page with history
- Edit habit functionality
- Skip habit functionality
- Optimistic updates for completion toggle
