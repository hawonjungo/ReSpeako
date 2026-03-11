export default function SectionCard({ children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/80 sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}