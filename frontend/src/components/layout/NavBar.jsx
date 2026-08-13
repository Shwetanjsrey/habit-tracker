import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

const NAV_LINKS = [
  { to: '/', label: 'Habits', end: true },
  { to: '/analytics', label: 'Analytics', end: false },
];

/**
 * Shared header + navigation bar. Renders the app title, primary nav links,
 * and any page-specific actions passed as children (e.g. the "Add Habit"
 * button on the Dashboard).
 */
export function NavBar({ children }) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-gray-900">Habit Tracker</h1>
          <nav className="flex gap-1" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  clsx(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
        {children}
      </div>
    </header>
  );
}
