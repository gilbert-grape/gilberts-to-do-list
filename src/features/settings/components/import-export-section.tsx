import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTodoStore } from "@/features/todos/store.ts";
import { useTagStore } from "@/features/tags/store.ts";
import { todosToMarkdown } from "@/services/markdown/markdown-serializer.ts";
import { parseMarkdown } from "@/services/markdown/markdown-parser.ts";
import { TAG_COLORS } from "@/features/tags/colors.ts";

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportExportSection() {
  const { t } = useTranslation();
  const todos = useTodoStore((s) => s.todos);
  const tags = useTagStore((s) => s.tags);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number;
    skipped: number;
  } | null>(null);

  function handleExport(tagId: string) {
    const tag = tags.find((tg) => tg.id === tagId);
    if (!tag) return;

    const tagTodos = todos.filter((todo) => todo.tagIds.includes(tagId));
    const markdown = todosToMarkdown(tag.name, tagTodos);
    downloadFile(`${tag.name}.md`, markdown);
  }

  function handleExportAll() {
    for (const tag of tags) {
      handleExport(tag.id);
    }
  }

  async function handleImport(files: FileList | null) {
    if (!files || files.length === 0) return;

    setImporting(true);
    setImportResult(null);
    let created = 0;
    let skipped = 0;

    try {
      for (const file of Array.from(files)) {
        const content = await file.text();
        const result = parseMarkdown(content);

        // Determine tag name: from header or filename
        const tagName =
          result.tagName ?? file.name.replace(/\.md$/i, "");

        // Find or create the tag
        let tag = useTagStore
          .getState()
          .tags.find(
            (tg) => tg.name.toLowerCase() === tagName.toLowerCase(),
          );

        if (!tag) {
          const existingColors = new Set(
            useTagStore.getState().tags.map((tg) => tg.color),
          );
          const availableColor =
            TAG_COLORS.find((c) => !existingColors.has(c)) ?? TAG_COLORS[0]!;
          await useTagStore
            .getState()
            .createTag({ name: tagName, color: availableColor, isDefault: false });
          tag = useTagStore
            .getState()
            .tags.find(
              (tg) => tg.name.toLowerCase() === tagName.toLowerCase(),
            );
        }

        if (!tag) continue;

        // Track created todo IDs for parent resolution
        const createdIds = new Map<number, string>();

        for (let i = 0; i < result.todos.length; i++) {
          const parsed = result.todos[i];

          // Duplicate detection: same title under same tag
          const existingTodos = useTodoStore.getState().todos;
          const isDuplicate = existingTodos.some(
            (td) =>
              td.title === parsed.title && td.tagIds.includes(tag!.id),
          );

          if (isDuplicate) {
            skipped++;
            continue;
          }

          // Resolve parent from previously created todos
          let parentId: string | null = null;
          if (parsed.depth > 0) {
            for (let j = i - 1; j >= 0; j--) {
              if (result.todos[j].depth === parsed.depth - 1) {
                parentId = createdIds.get(j) ?? null;
                break;
              }
            }
          }

          await useTodoStore.getState().createTodo({
            title: parsed.title,
            description: null,
            tagIds: [tag.id],
            parentId,
            dueDate: null,
            recurrence: null,
            recurrenceInterval: null,
          });

          // Find the newly created todo to get its ID
          const currentTodos = useTodoStore.getState().todos;
          const newTodo = currentTodos.find(
            (td) =>
              td.title === parsed.title &&
              td.tagIds.includes(tag!.id) &&
              td.parentId === parentId,
          );

          if (newTodo) {
            createdIds.set(i, newTodo.id);

            // If parsed as completed, mark it
            if (parsed.completed) {
              await useTodoStore
                .getState()
                .updateTodo(newTodo.id, {
                  status: "completed",
                  completedAt: new Date().toISOString(),
                });
            }
          }

          created++;
        }
      }

      setImportResult({ created, skipped });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-[var(--color-text)]">
        {t("settings.importExport")}
      </h2>

      {/* Export */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">
          {t("settings.export")}
        </h3>
        <div className="space-y-1">
          {tags.map((tag) => {
            const count = todos.filter((todo) =>
              todo.tagIds.includes(tag.id),
            ).length;
            return (
              <div
                key={tag.id}
                className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[var(--color-surface)]"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm text-[var(--color-text)]">
                    {tag.name}
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    ({count})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleExport(tag.id)}
                  className="rounded px-2 py-1 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10"
                >
                  {t("settings.downloadMd")}
                </button>
              </div>
            );
          })}
        </div>
        {tags.length > 1 && (
          <button
            type="button"
            onClick={handleExportAll}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {t("settings.exportAll")}
          </button>
        )}
      </div>

      {/* Import */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">
          {t("settings.import")}
        </h3>
        <p className="text-xs text-[var(--color-text-secondary)]">
          {t("settings.importDescription")}
        </p>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:opacity-90">
          {importing ? t("settings.importing") : t("settings.selectFiles")}
          <input
            type="file"
            accept=".md"
            multiple
            disabled={importing}
            onChange={(e) => {
              handleImport(e.target.files);
              e.target.value = "";
            }}
            className="hidden"
          />
        </label>
        {importResult && (
          <p className="text-xs text-[var(--color-text-secondary)]">
            {t("settings.importResult", {
              created: importResult.created,
              skipped: importResult.skipped,
            })}
          </p>
        )}
      </div>
    </div>
  );
}
