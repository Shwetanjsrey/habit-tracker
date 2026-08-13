import clsx from 'clsx';
import { Card } from '../../../components/ui/Card';

export function StatCard({ label, value, icon: Icon, iconClassName = '' }) {
  return (
    <Card>
      <Card.Body className="flex items-center gap-3">
        {Icon && (
          <div
            className={clsx(
              'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-primary-50 text-primary-600',
              iconClassName
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm text-gray-500 truncate">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </Card.Body>
    </Card>
  );
}
