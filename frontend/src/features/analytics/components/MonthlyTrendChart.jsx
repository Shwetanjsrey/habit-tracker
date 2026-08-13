import { parseISO, format } from 'date-fns';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '../../../components/ui/Card';

export function MonthlyTrendChart({ data }) {
  const chartData = data.map((point) => ({
    ...point,
    label: format(parseISO(point.date), 'MMM d'),
  }));

  return (
    <Card>
      <Card.Header>
        <h2 className="font-semibold text-gray-900">Last 30 Days</h2>
        <p className="text-sm text-gray-500">Completion trend across all habits</p>
      </Card.Header>
      <Card.Body>
        <div className="h-64" data-testid="monthly-trend-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#6B7280', fontSize: 11 }}
                interval={4}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                width={32}
              />
              <Tooltip
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.date
                    ? format(parseISO(payload[0].payload.date), 'MMM d, yyyy')
                    : ''
                }
                formatter={(value) => [value, 'Completed']}
              />
              <Line
                type="monotone"
                dataKey="completed_count"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card.Body>
    </Card>
  );
}
