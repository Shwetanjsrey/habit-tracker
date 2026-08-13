import { CheckCircle2, Flame, ListChecks, Percent, Target, Trophy } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { StatCard } from './StatCard';
import { WeeklyChart } from './WeeklyChart';
import { MonthlyTrendChart } from './MonthlyTrendChart';
import { Spinner } from '../../../components/ui/Spinner';

export function AnalyticsDashboard() {
  const { data, isLoading, error } = useAnalytics();

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
        <p className="text-red-600 mb-2">Failed to load analytics</p>
        <p className="text-sm text-gray-500">{error.message}</p>
      </div>
    );
  }

  if (!data || data.total_habits === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No analytics yet.</p>
        <p className="text-sm text-gray-400 mt-1">
          Create a habit and start completing it to see your stats here.
        </p>
      </div>
    );
  }

  const stats = [
    { label: 'Total Habits', value: data.total_habits, icon: Target },
    { label: 'Completed Today', value: data.completed_today, icon: CheckCircle2 },
    { label: 'Overall Completion Rate', value: `${data.overall_completion_rate}%`, icon: Percent },
    { label: 'Current Longest Streak', value: data.current_longest_streak, icon: Flame },
    { label: 'Best Streak', value: data.best_streak, icon: Trophy },
    { label: 'Total Completions', value: data.total_completions, icon: ListChecks },
  ];

  return (
    <div className="space-y-6" data-testid="analytics-dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WeeklyChart data={data.weekly} />
        <MonthlyTrendChart data={data.daily_30} />
      </div>
    </div>
  );
}
