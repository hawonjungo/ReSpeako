import { Link } from 'react-router-dom';

// Shows which engine scores speaking answers, with a shortcut to change it.
export default function EngineBadge({ engine, t }) {
  return (
    <Link
      to="/settings"
      className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      title={t.engineChange}
    >
      {engine === 'azure' ? t.engineAzure : t.engineBrowser}
    </Link>
  );
}
