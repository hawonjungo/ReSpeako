export default function PrimaryButton({
  children,
  type = "button",
  className = "",
  disabled = false,
  variant = "primary",
  ...props
}) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

  const variants = {
    primary:
      "bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100",
    secondary:
      "border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800",
    ghost:
      "bg-transparent text-slate-950 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800",
    light:
      "bg-white text-slate-950 hover:bg-slate-100 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100",
    glass:
      "border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/15 dark:border-white/20 dark:bg-white/10 dark:text-white",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}