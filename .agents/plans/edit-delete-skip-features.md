# Feature: Edit Habit, Delete with Confirmation, Skip Day, and Completion Rate Bug Fix

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

This implementation adds three missing UI features (Edit Habit, Delete Habit with Confirmation, Skip Day) and fixes a bug where completion rate can exceed 100%. All backend APIs already exist - this is primarily a frontend implementation with one backend bug fix.

## User Story

As a habit tracker user,
I want to edit my habits, delete them with confirmation, and mark days as skipped
So that I can manage my habits effectively and take planned absences without breaking my streaks

## Problem Statement

1. **Edit Habit**: Users cannot modify habit name/description/color after creation
2. **Delete Habit**: No way to remove habits from the UI; no confirmation prevents accidental deletion
3. **Skip Day**: Backend supports skipping, but no UI exists to mark planned absences
4. **Bug**: Completion rate can exceed 100% when completing days before habit creation

## Solution Statement

1. Add an Edit button to HabitCard that opens a modal with pre-filled HabitForm
2. Add a Delete button with a reusable ConfirmDialog component
3. Extend calendar day interactions to support skip (right-click or cycling toggle)
4. Fix backend `calculate_completion_rate` to filter completions by creation date

## Feature Metadata

**Feature Type**: Enhancement + Bug Fix
**Estimated Complexity**: Medium
**Primary Systems Affected**: Frontend (HabitCard, Calendar), Backend (habits router)
**Dependencies**: No new external libraries required

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING!

**Frontend - Components:**
- `frontend/src/features/habits/components/HabitCard.jsx` (all) - Main component to modify, add edit/delete buttons
- `frontend/src/features/habits/components/HabitForm.jsx` (all) - Reuse for edit modal, need to support edit mode
- `frontend/src/pages/Dashboard.jsx` (lines 29-47) - Modal overlay pattern to follow
- `frontend/src/components/ui/Card.jsx` (all) - Compound component for modals
- `frontend/src/components/ui/Button.jsx` (all) - Button variants including `danger`

**Frontend - Hooks:**
- `frontend/src/features/habits/hooks/useHabits.js` (all) - Has `useUpdateHabit`, `useDeleteHabit`, need to add `useSkipHabit`
- `frontend/src/features/habits/api/habits.js` (all) - Already has `skipHabit` function

**Frontend - Calendar:**
- `frontend/src/features/calendar/components/Calendar.jsx` (all) - Add skip mutation and handler
- `frontend/src/features/calendar/components/CalendarDay.jsx` (all) - Already has skipped styling, extend toggle
- `frontend/src/features/calendar/components/CalendarGrid.jsx` (all) - Pass handlers through

**Frontend - Exports:**
- `frontend/src/features/habits/index.js` (all) - Export new hooks

**Backend:**
- `backend/app/routers/habits.py` (lines 112-121) - `calculate_completion_rate` bug location
- `backend/tests/test_streak.py` (all) - Test patterns to follow

### New Files to Create

- `frontend/src/components/ui/ConfirmDialog.jsx` - Reusable confirmation dialog component

### Patterns to Follow

**Modal Overlay Pattern (from Dashboard.jsx):**
```jsx
{showModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <Card className="w-full max-w-md">
      <Card.Header className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Title</h2>
        <button onClick={() => setShowModal(false)} aria-label="Close">
          <X className="w-5 h-5" />
        </button>
      </Card.Header>
      <Card.Body>
        {/* Content */}
      </Card.Body>
    </Card>
  </div>
)}
```

**Mutation Hook Pattern (from useHabits.js):**
```javascript
export function useSkipHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, date, reason }) => skipHabit(id, date, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['completions', id] });
    },
  });
}
```

**Button Variants (from Button.jsx):**
- `primary`: Green background (default)
- `secondary`: Gray background
- `danger`: Red background - use for delete
- `ghost`: Transparent background

**Icon Usage:**
```jsx
import { Pencil, Trash2, X } from 'lucide-react';
```

---

## IMPLEMENTATION PLAN

### Phase 1: Bug Fix - Completion Rate

Fix the backend calculation to prevent rates > 100%.

**Tasks:**
- Filter completions to only count dates on/after habit creation
- Add unit tests for edge cases

### Phase 2: UI Foundation

Create the reusable ConfirmDialog component.

**Tasks:**
- Build ConfirmDialog with title, message, confirm/cancel buttons
- Support danger variant styling

### Phase 3: Edit Habit Feature

Add edit functionality to HabitCard.

**Tasks:**
- Modify HabitForm to support edit mode with defaultValues
- Add edit button and modal to HabitCard
- Wire up useUpdateHabit mutation

### Phase 4: Delete Habit Feature

Add delete with confirmation to HabitCard.

**Tasks:**
- Add delete button to HabitCard
- Integrate ConfirmDialog for delete confirmation
- Wire up useDeleteHabit mutation

### Phase 5: Skip Day Feature

Add skip functionality to calendar.

**Tasks:**
- Create useSkipHabit hook
- Modify calendar toggle to cycle: incomplete → completed → skipped → incomplete
- Update CalendarDay click behavior

### Phase 6: Testing & Validation

Verify all features work correctly.

**Tasks:**
- Run backend tests
- Manual E2E testing with Playwright MCP
- Verify no regressions

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE `backend/app/routers/habits.py` - Fix completion rate bug

**IMPLEMENT**: Modify `calculate_completion_rate` to filter completions by creation date

```python
def calculate_completion_rate(habit: Habit, completions: list[Completion], today: date) -> float:
    """Calculate completion rate as percentage."""
    created = date.fromisoformat(habit.created_at[:10])
    total_days = (today - created).days + 1

    if total_days <= 0:
        return 0.0

    # Only count completions on or after the habit was created
    completed_count = sum(
        1 for c in completions
        if c.status == "completed" and date.fromisoformat(c.completed_date) >= created
    )
    return round((completed_count / total_days) * 100, 1)
```

**PATTERN**: Follow existing function structure at lines 112-121
**GOTCHA**: Ensure date parsing uses same format as existing code
**VALIDATE**: `cd backend && uv run pytest tests/test_streak.py -v`

---

### Task 2: UPDATE `backend/tests/test_streak.py` - Add completion rate tests

**IMPLEMENT**: Add test class for completion rate edge cases

```python
class TestCompletionRate:
    """Unit tests for completion rate calculation."""

    def test_completion_rate_never_exceeds_100_percent(self):
        """BUG FIX: Completion rate should never exceed 100% with pre-creation dates."""
        from datetime import date, timedelta
        from app.routers.habits import calculate_completion_rate

        # Mock habit created today
        class MockHabit:
            created_at = date.today().isoformat() + "T00:00:00"

        class MockCompletion:
            def __init__(self, date_str, status="completed"):
                self.completed_date = date_str
                self.status = status

        habit = MockHabit()
        today = date.today()

        # 5 completions including pre-creation dates
        completions = [
            MockCompletion((today - timedelta(days=i)).isoformat())
            for i in range(5)
        ]

        rate = calculate_completion_rate(habit, completions, today)
        assert rate == 100.0
        assert rate <= 100.0

    def test_completion_rate_ignores_pre_creation_completions(self):
        """Only completions on/after creation date should count."""
        from datetime import date, timedelta
        from app.routers.habits import calculate_completion_rate

        class MockHabit:
            created_at = "2025-01-03T00:00:00"  # Created Jan 3

        class MockCompletion:
            def __init__(self, date_str, status="completed"):
                self.completed_date = date_str
                self.status = status

        habit = MockHabit()
        today = date(2025, 1, 5)  # Today is Jan 5 (3 days since creation)

        completions = [
            MockCompletion("2025-01-01"),  # Before creation - should be ignored
            MockCompletion("2025-01-02"),  # Before creation - should be ignored
            MockCompletion("2025-01-03"),  # On creation - counts
            MockCompletion("2025-01-04"),  # After creation - counts
            MockCompletion("2025-01-05"),  # Today - counts
        ]

        rate = calculate_completion_rate(habit, completions, today)
        assert rate == 100.0  # 3 valid completions in 3 days
```

**PATTERN**: Follow existing test class structure in file
**VALIDATE**: `cd backend && uv run pytest tests/test_streak.py::TestCompletionRate -v`

---

### Task 3: CREATE `frontend/src/components/ui/ConfirmDialog.jsx`

**IMPLEMENT**: Reusable confirmation dialog component

```jsx
import { X } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-sm">
        <Card.Header className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </Card.Header>
        <Card.Body>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={onClose}>
              {cancelText}
            </Button>
            <Button variant={variant} onClick={onConfirm}>
              {confirmText}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
```

**PATTERN**: Follow modal pattern from `Dashboard.jsx` lines 29-47
**IMPORTS**: Use existing Card, Button components
**VALIDATE**: Visual inspection - component renders correctly

---

### Task 4: UPDATE `frontend/src/features/habits/components/HabitForm.jsx` - Support edit mode

**IMPLEMENT**: Add `habit` prop for edit mode with default values

Changes needed:
1. Accept optional `habit` prop
2. Initialize state from habit if provided
3. Use updateHabit mutation when editing
4. Change button text based on mode

```jsx
// Add to imports
import { useUpdateHabit } from '../hooks/useHabits';

// Modify component signature
export function HabitForm({ onSuccess, habit = null }) {
  const isEditing = !!habit;

  // Initialize state from habit if editing
  const [name, setName] = useState(habit?.name || '');
  const [description, setDescription] = useState(habit?.description || '');
  const [color, setColor] = useState(habit?.color || COLORS[0]);
  const [error, setError] = useState('');

  const { mutate: createHabit, isPending: isCreating } = useCreateHabit();
  const { mutate: updateHabit, isPending: isUpdating } = useUpdateHabit();

  const isPending = isCreating || isUpdating;

  const handleSubmit = (e) => {
    e.preventDefault();
    // ... validation ...

    const data = {
      name: name.trim(),
      description: description.trim() || null,
      color,
    };

    if (isEditing) {
      updateHabit(
        { id: habit.id, data },
        {
          onSuccess: () => onSuccess?.(),
          onError: (err) => setError(err.message),
        }
      );
    } else {
      createHabit(data, {
        onSuccess: () => {
          setName('');
          setDescription('');
          setColor(COLORS[0]);
          onSuccess?.();
        },
        onError: (err) => setError(err.message),
      });
    }
  };

  // Change button text
  <Button type="submit" className="w-full" isLoading={isPending}>
    {isEditing ? 'Save Changes' : 'Create Habit'}
  </Button>
```

**PATTERN**: Follow existing form structure
**IMPORTS**: Add `useUpdateHabit` from hooks
**GOTCHA**: Reset form only on create, not on edit
**VALIDATE**: Manual test - form pre-fills values in edit mode

---

### Task 5: UPDATE `frontend/src/features/habits/hooks/useHabits.js` - Add useSkipHabit

**IMPLEMENT**: Create skip habit mutation hook

```javascript
// Add import
import { skipHabit } from '../api/habits';

// Add after useUncompleteHabit
export function useSkipHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, date, reason }) => skipHabit(id, date, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['completions', id] });
    },
  });
}
```

**PATTERN**: Mirror `useCompleteHabit` at lines 47-57
**IMPORTS**: Already has `skipHabit` imported at line 10 - verify
**VALIDATE**: Import check - no errors in console

---

### Task 6: UPDATE `frontend/src/features/habits/index.js` - Export useSkipHabit

**IMPLEMENT**: Add export for new hook

```javascript
export {
  useHabits,
  useHabit,
  useCreateHabit,
  useUpdateHabit,
  useDeleteHabit,
  useCompleteHabit,
  useUncompleteHabit,
  useSkipHabit,  // Add this line
} from './hooks/useHabits';
```

**PATTERN**: Follow existing export pattern
**VALIDATE**: Import should work from feature barrel

---

### Task 7: UPDATE `frontend/src/features/habits/components/HabitCard.jsx` - Add edit/delete

**IMPLEMENT**: Add edit and delete buttons with modal/dialog integration

Add state for modals:
```jsx
const [showEditModal, setShowEditModal] = useState(false);
const [showDeleteDialog, setShowDeleteDialog] = useState(false);
```

Add imports:
```jsx
import { Pencil, Trash2 } from 'lucide-react';
import { useDeleteHabit } from '../hooks/useHabits';
import { HabitForm } from './HabitForm';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
```

Add delete mutation:
```jsx
const { mutate: deleteHabit, isPending: isDeleting } = useDeleteHabit();
```

Add buttons in the header area (after habit name, before completion toggle):
```jsx
<div className="flex items-center gap-1">
  <button
    onClick={() => setShowEditModal(true)}
    className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
    aria-label="Edit habit"
  >
    <Pencil className="w-4 h-4" />
  </button>
  <button
    onClick={() => setShowDeleteDialog(true)}
    className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100"
    aria-label="Delete habit"
  >
    <Trash2 className="w-4 h-4" />
  </button>
</div>
```

Add modals at end of component (before closing Card):
```jsx
{/* Edit Modal */}
{showEditModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <Card className="w-full max-w-md">
      <Card.Header className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Edit Habit</h2>
        <button
          onClick={() => setShowEditModal(false)}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </Card.Header>
      <Card.Body>
        <HabitForm
          habit={habit}
          onSuccess={() => setShowEditModal(false)}
        />
      </Card.Body>
    </Card>
  </div>
)}

{/* Delete Confirmation */}
<ConfirmDialog
  isOpen={showDeleteDialog}
  onClose={() => setShowDeleteDialog(false)}
  onConfirm={() => {
    deleteHabit(habit.id, {
      onSuccess: () => setShowDeleteDialog(false),
    });
  }}
  title="Delete Habit"
  message={`Are you sure you want to delete "${habit.name}"? This will permanently remove the habit and all its completion history.`}
  confirmText={isDeleting ? 'Deleting...' : 'Delete'}
  variant="danger"
/>
```

**PATTERN**: Follow modal pattern from `Dashboard.jsx`
**IMPORTS**: Pencil, Trash2 from lucide-react; ConfirmDialog, HabitForm
**GOTCHA**: Place buttons between name and completion toggle for good UX
**VALIDATE**: Manual test - edit and delete buttons appear and work

---

### Task 8: UPDATE `frontend/src/features/calendar/components/Calendar.jsx` - Add skip

**IMPLEMENT**: Add skip mutation and modify toggle to cycle through states

Add import:
```jsx
import { useCompleteHabit, useUncompleteHabit, useSkipHabit } from '../../habits';
```

Add skip mutation:
```jsx
const { mutate: skip } = useSkipHabit();
```

Modify handleToggle to cycle states:
```jsx
const handleToggle = (dateStr, currentStatus) => {
  // Cycle: no status → completed → skipped → no status
  if (!currentStatus) {
    // Not completed/skipped → Mark completed
    complete({ id: habitId, date: dateStr });
  } else if (currentStatus === 'completed') {
    // Completed → Mark skipped
    // First uncomplete, then skip
    uncomplete({ id: habitId, date: dateStr }, {
      onSuccess: () => {
        skip({ id: habitId, date: dateStr });
      },
    });
  } else if (currentStatus === 'skipped') {
    // Skipped → Clear (uncomplete removes the record)
    uncomplete({ id: habitId, date: dateStr });
  }
};
```

**PATTERN**: Follow existing mutation usage pattern
**IMPORTS**: Add useSkipHabit to imports from habits feature
**GOTCHA**: Skipping requires uncompleting first since backend uses same date unique constraint
**VALIDATE**: Manual test - clicking cycles through complete → skipped → cleared

---

### Task 9: ALTERNATIVE Task 8 - Simpler skip implementation

**IMPLEMENT**: If Task 8 is too complex, use simpler approach - skip requires Shift+Click

Modify handleToggle:
```jsx
const handleToggle = (dateStr, currentStatus, event) => {
  const isShiftClick = event?.shiftKey;

  if (currentStatus === 'completed' || currentStatus === 'skipped') {
    // Any existing status → Clear
    uncomplete({ id: habitId, date: dateStr });
  } else if (isShiftClick) {
    // Shift+Click on empty → Skip
    skip({ id: habitId, date: dateStr });
  } else {
    // Normal click on empty → Complete
    complete({ id: habitId, date: dateStr });
  }
};
```

Update CalendarGrid to pass event:
```jsx
onToggle={(dateStr, status, event) => handleToggle(dateStr, status, event)}
```

Update CalendarDay onClick:
```jsx
const handleClick = (event) => {
  if (!isFutureDate && isCurrentMonth) {
    onToggle(dateStr, status, event);
  }
};
```

**GOTCHA**: This is simpler but less discoverable for users
**VALIDATE**: Manual test - Shift+Click creates skipped day

---

## TESTING STRATEGY

### Unit Tests

**Backend (pytest):**
- Test completion rate never exceeds 100%
- Test completions before creation date are ignored
- Test edge case: habit created today with only today completed

Run: `cd backend && uv run pytest tests/ -v`

### Integration Tests

**Backend API:**
- Existing tests should continue to pass
- New completion rate tests added

Run: `cd backend && uv run pytest tests/test_api_habits.py -v`

### E2E Tests (Manual with Playwright MCP)

1. **Edit Habit Flow:**
   - Create habit → Click edit → Change name → Save → Verify update

2. **Delete Habit Flow:**
   - Create habit → Click delete → Cancel → Habit exists
   - Click delete → Confirm → Habit removed

3. **Skip Day Flow:**
   - Click calendar day → Shows completed (green)
   - Click again → Shows skipped (gray)
   - Click again → Cleared

4. **Completion Rate Bug:**
   - Create habit today
   - Complete yesterday via calendar
   - Verify rate is 100%, not 200%

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
# Backend
cd backend && uv run ruff check app/ tests/

# Frontend (if eslint configured)
cd frontend && npm run lint
```

### Level 2: Unit Tests

```bash
# Backend - all tests
cd backend && uv run pytest tests/ -v

# Backend - just new completion rate tests
cd backend && uv run pytest tests/test_streak.py::TestCompletionRate -v
```

### Level 3: Integration Tests

```bash
# Backend API tests
cd backend && uv run pytest tests/test_api_habits.py tests/test_api_completions.py -v
```

### Level 4: Manual Validation

Start servers:
```bash
# Terminal 1
cd backend && uv run uvicorn app.main:app --reload --port 8000

# Terminal 2
cd frontend && npm run dev
```

Use Playwright MCP to test:
1. Navigate to http://localhost:5174
2. Test edit button → opens modal with pre-filled form
3. Test delete button → shows confirmation → deletes habit
4. Test calendar click cycling (complete → skip → clear)
5. Verify completion rate stays ≤ 100%

### Level 5: Full Validation

```bash
# Run all backend tests with coverage
cd backend && uv run pytest --cov=app --cov-report=term-missing
```

---

## ACCEPTANCE CRITERIA

- [ ] Edit habit: Click edit icon → Modal opens with current values → Save updates habit
- [ ] Delete habit: Click delete icon → Confirmation dialog → Confirm deletes, Cancel keeps
- [ ] Skip day: Calendar day can be marked as skipped (gray color)
- [ ] Skip toggle: Clicking completed day → skipped → cleared → completed cycle works
- [ ] Bug fix: Completion rate never exceeds 100%
- [ ] Bug fix: Days before habit creation don't count toward completion rate
- [ ] All existing tests pass (no regressions)
- [ ] New completion rate tests pass
- [ ] UI matches existing patterns (consistent styling)
- [ ] Accessibility: All buttons have aria-labels

---

## COMPLETION CHECKLIST

- [ ] Task 1: Backend completion rate fix implemented
- [ ] Task 2: Completion rate unit tests added and passing
- [ ] Task 3: ConfirmDialog component created
- [ ] Task 4: HabitForm supports edit mode
- [ ] Task 5: useSkipHabit hook created
- [ ] Task 6: useSkipHabit exported from feature
- [ ] Task 7: HabitCard has edit/delete buttons with modals
- [ ] Task 8/9: Calendar supports skip functionality
- [ ] All backend tests passing
- [ ] Manual E2E testing completed
- [ ] No linting errors

---

## NOTES

### Design Decisions

1. **Edit uses modal, not inline editing**: Consistent with create flow, better for mobile
2. **Delete requires confirmation**: Prevents accidental data loss
3. **Skip cycles via click**: Simpler than context menu, discoverable via click-through
4. **Completion rate fix filters completions**: More robust than validation-only approach

### Trade-offs

- **Skip via cycling** is simpler but less obvious than a dedicated skip button
- Alternative: Add context menu on right-click (more complex, better UX)
- Chose cycling for MVP simplicity; can add context menu later

### Future Improvements

- Add toast notifications for success/error feedback
- Add undo capability for delete (soft delete already exists via archive)
- Add skip reason input dialog
- Add keyboard shortcuts (e.g., 'e' for edit, 'd' for delete)
