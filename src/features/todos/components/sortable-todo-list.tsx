import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableTodoItem } from "./sortable-todo-item.tsx";
import { TodoItem } from "./todo-item.tsx";
import type { Todo } from "../types.ts";

export interface SortableTodoListProps {
  items: Array<{ todo: Todo; depth: number }>;
  onReorder: (activeId: string, overId: string) => void;
  onReparent: (activeId: string, newParentId: string) => void;
  onUnparent?: (activeId: string) => void;
  onToggle: (id: string) => void;
  onTitleClick?: (todo: Todo) => void;
  onEdit?: (todo: Todo) => void;
  onDelete?: (todo: Todo) => void;
  onCreateSibling?: (todo: Todo) => void;
  onCreateChild?: (todo: Todo) => void;
}

const REPARENT_THRESHOLD = 40;

export function SortableTodoList({
  items,
  onReorder,
  onReparent,
  onUnparent,
  onToggle,
  onTitleClick,
  onEdit,
  onDelete,
  onCreateSibling,
  onCreateChild,
}: SortableTodoListProps) {
  const [activeItem, setActiveItem] = useState<Todo | null>(null);
  const [reparentTargetId, setReparentTargetId] = useState<string | null>(null);
  const [unparentActiveId, setUnparentActiveId] = useState<string | null>(null);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);

  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const todo = items.find((item) => item.todo.id === event.active.id)?.todo;
      setActiveItem(todo ?? null);
    },
    [items],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const deltaX = event.delta.x;
      if (deltaX < -REPARENT_THRESHOLD && onUnparent) {
        setUnparentActiveId(event.active.id as string);
        setReparentTargetId(null);
      } else if (deltaX > REPARENT_THRESHOLD && event.over) {
        setReparentTargetId(event.over.id as string);
        setUnparentActiveId(null);
      } else {
        setReparentTargetId(null);
        setUnparentActiveId(null);
      }
    },
    [onUnparent],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over, delta } = event;
      setActiveItem(null);
      setReparentTargetId(null);
      setUnparentActiveId(null);

      if (delta.x < -REPARENT_THRESHOLD && onUnparent) {
        onUnparent(active.id as string);
        return;
      }

      if (!over || active.id === over.id) return;

      if (delta.x > REPARENT_THRESHOLD) {
        onReparent(active.id as string, over.id as string);
      } else {
        onReorder(active.id as string, over.id as string);
      }
    },
    [onReorder, onReparent, onUnparent],
  );

  const handleDragCancel = useCallback(() => {
    setActiveItem(null);
    setReparentTargetId(null);
  }, []);

  const itemIds = items.map((item) => item.todo.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {items.map(({ todo, depth }) => (
            <div
              key={todo.id}
              className={
                reparentTargetId === todo.id
                  ? "rounded-lg border-l-4 border-l-[var(--color-primary)]"
                  : ""
              }
            >
              <SortableTodoItem
                todo={todo}
                depth={depth}
                onToggle={onToggle}
                onTitleClick={onTitleClick}
                onEdit={onEdit}
                onDelete={onDelete}
                onCreateSibling={onCreateSibling}
                onCreateChild={onCreateChild}
              />
            </div>
          ))}
        </ul>
      </SortableContext>
      <DragOverlay>
        {activeItem ? (
          <div className="opacity-80">
            <TodoItem todo={activeItem} onToggle={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
