import { AnalyticsDashboard } from '../features/analytics';
import { NavBar } from '../components/layout/NavBar';

export function Analytics() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <AnalyticsDashboard />
      </main>
    </div>
  );
}
