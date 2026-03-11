export default function PrimaryButton({
  children,
  type = "button",
  className = "",
  disabled = false,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition
        bg-black text-white hover:opacity-90
        disabled:cursor-not-allowed disabled:opacity-50
        dark:bg-white dark:text-black ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}