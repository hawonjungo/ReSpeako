export default function PageContainer({ title, description, children }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h1>
          )}
          {description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 sm:text-base">
              {description}
            </p>
          )}
        </div>
      )}

      {children}
    </div>
  );
}