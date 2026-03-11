export default function AppShell({ header, children }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors dark:bg-black dark:text-white">
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-black/70">
        {header}
      </div>

      <main className="pb-10">
        {children}
      </main>
    </div>
  );
}