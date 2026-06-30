import { cn } from '../lib/cn';

interface ToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  showLabel?: boolean;
}

export function Toggle({ label, checked, onChange, disabled, className, showLabel = true }: ToggleProps) {
  return (
    <div className={cn("flex items-center justify-between gap-2 bg-muted border border-border rounded-lg px-3 py-2", className)}>
      {showLabel && label && <span className="text-[12px] text-gray-400">{label}</span>}
      <button
        type="button"
        disabled={disabled}
        aria-label={label}
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-[38px] shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
          checked ? "bg-primary" : "bg-muted-foreground",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
            checked ? "translate-x-[18px]" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
