import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { HabitList, HabitForm } from '../features/habits';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { NavBar } from '../components/layout/NavBar';

export function Dashboard() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Habit
        </Button>
      </NavBar>

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
