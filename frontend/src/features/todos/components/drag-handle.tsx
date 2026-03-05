import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import type { DraggableAttributes } from "@dnd-kit/core";
import { useTranslation } from "react-i18next";

export interface DragHandleProps {
  listeners?: SyntheticListenerMap;
  attributes?: DraggableAttributes;
}

export function DragHandle({ listeners, attributes }: DragHandleProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className="flex h-11 w-11 shrink-0 cursor-grab items-center justify-center rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text)] active:cursor-grabbing"
      aria-label={t("todos.dragHandle")}
      {...attributes}
      {...listeners}
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 16 16"
        fill="currentColor"
      >
        <circle cx="5" cy="3" r="1.5" />
        <circle cx="11" cy="3" r="1.5" />
        <circle cx="5" cy="8" r="1.5" />
        <circle cx="11" cy="8" r="1.5" />
        <circle cx="5" cy="13" r="1.5" />
        <circle cx="11" cy="13" r="1.5" />
      </svg>
    </button>
  );
}
