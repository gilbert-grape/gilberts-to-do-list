import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TodoItem } from "./todo-item.tsx";
import { DragHandle } from "./drag-handle.tsx";
import type { TodoItemProps } from "./todo-item.tsx";

export interface SortableTodoItemProps extends TodoItemProps {
  depth?: number;
}

export function SortableTodoItem({
  todo,
  depth = 0,
  ...rest
}: SortableTodoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    marginLeft: depth * 24,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TodoItem
        todo={todo}
        dragHandleSlot={
          <DragHandle listeners={listeners} attributes={attributes} />
        }
        {...rest}
      />
    </div>
  );
}
