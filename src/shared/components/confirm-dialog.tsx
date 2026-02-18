import { useEffect, useRef, useCallback } from "react";

export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "default";
}

export interface ChoiceDialogProps {
  title: string;
  message: string;
  choices: { label: string; value: string; variant?: "danger" | "default" }[];
  cancelLabel: string;
  onChoice: (value: string) => void;
  onCancel: () => void;
}

function useFocusTrap(onEscape: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onEscape();
        return;
      }

      if (e.key !== "Tab") return;

      const container = containerRef.current;
      if (!container) return;

      const focusable = container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onEscape],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    // Auto-focus the first focusable element
    const container = containerRef.current;
    if (container) {
      const firstButton = container.querySelector<HTMLElement>("button");
      firstButton?.focus();
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return containerRef;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant = "danger",
}: ConfirmDialogProps) {
  const containerRef = useFocusTrap(onCancel);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      ref={containerRef}
    >
      <div className="w-full max-w-sm rounded-lg bg-[var(--color-surface)] p-6 shadow-lg">
        <h3 className="mb-2 text-base font-semibold text-[var(--color-text)]">
          {title}
        </h3>
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          {message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
              variant === "danger"
                ? "bg-[var(--color-danger)] hover:bg-[var(--color-danger)]/80"
                : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChoiceDialog({
  title,
  message,
  choices,
  cancelLabel,
  onChoice,
  onCancel,
}: ChoiceDialogProps) {
  const containerRef = useFocusTrap(onCancel);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      ref={containerRef}
    >
      <div className="w-full max-w-sm rounded-lg bg-[var(--color-surface)] p-6 shadow-lg">
        <h3 className="mb-2 text-base font-semibold text-[var(--color-text)]">
          {title}
        </h3>
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          {message}
        </p>
        <div className="flex flex-col gap-2">
          {choices.map((choice) => (
            <button
              key={choice.value}
              type="button"
              onClick={() => onChoice(choice.value)}
              className={`w-full rounded-lg px-4 py-2 text-sm font-medium text-white ${
                choice.variant === "default"
                  ? "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
                  : "bg-[var(--color-danger)] hover:bg-[var(--color-danger)]/80"
              }`}
            >
              {choice.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-lg px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
