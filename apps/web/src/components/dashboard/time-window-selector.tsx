type TimeWindowSelectorProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: readonly T[];
};

export function TimeWindowSelector<T extends string>({
  value,
  onChange,
  options,
}: TimeWindowSelectorProps<T>) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-1 p-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            value === option
              ? 'bg-brand-lime text-bg-canvas'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
