import { parseISO, format } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '../../../components/ui/Card';

export function WeeklyChart({ data }) {
  const chartData = data.map((point) => ({
    ...point,
    label: format(parseISO(point.date), 'EEE'),
  }));

  return (
    <Card>
      <Card.Header>
        <h2 className="font-semibold text-gray-900">This Week</h2>
        <p className="text-sm text-gray-500">Completions per day, last 7 days</p>
      </Card.Header>
      <Card.Body>
        <div className="h-64" data-testid="weekly-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                width={32}
              />
              <Tooltip
                cursor={{ fill: '#F3F4F6' }}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.date
                    ? format(parseISO(payload[0].payload.date), 'MMM d, yyyy')
                    : ''
                }
                formatter={(value) => [value, 'Completed']}
              />
              <Bar dataKey="completed_count" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card.Body>
    </Card>
  );
}
