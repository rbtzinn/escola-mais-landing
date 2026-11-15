import clsx from 'clsx';

export function FieldLabel({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <label id={`${id}-label`} htmlFor={id} className="mb-1.5 block text-sm font-semibold">
      {children}
    </label>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-danger">
      {message}
    </p>
  );
}

/** Classes compartilhadas entre campo de texto e gatilhos de dropdown. */
export function fieldClasses(invalid: boolean) {
  return clsx(
    'bg-surface text-fg placeholder:text-fg-muted min-h-12 w-full rounded-xl border px-4 py-2.5 text-base transition-colors',
    invalid ? 'border-danger' : 'border-border hover:border-fg-muted',
  );
}
