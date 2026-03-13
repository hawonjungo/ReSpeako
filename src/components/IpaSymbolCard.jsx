export default function IpaSymbolCard({ item, onPlay }) {
  const parts = item.label.split(item.highlight);

  return (
    <button
      type="button"
      onClick={() => onPlay(item)}
      className="group flex h-full flex-col items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-950"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:bg-cyan-950 dark:text-cyan-200">
        IPA
      </div>
      <div className="mt-4 space-y-2">
        <div className="font-ipa text-4xl font-semibold text-gray-900 dark:text-white">{item.symbol}</div>
        <p className="text-base font-medium text-gray-900 dark:text-white">
          {parts[0]}
          <span className="underline decoration-cyan-500 decoration-2 underline-offset-4">
            {item.highlight}
          </span>
          {parts[1]}
        </p>
      </div>
      <img
        src={item.icon}
        alt={item.label}
        className="mt-4 h-10 w-10 object-contain transition group-hover:scale-105"
      />
    </button>
  );
}
