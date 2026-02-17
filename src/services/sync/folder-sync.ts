import { create } from "zustand";
import { todosToMarkdown } from "@/services/markdown/markdown-serializer.ts";
import { parseMarkdown } from "@/services/markdown/markdown-parser.ts";
import { useTodoStore } from "@/features/todos/store.ts";
import { useTagStore } from "@/features/tags/store.ts";
import { TAG_COLORS } from "@/features/tags/colors.ts";
import { db } from "@/services/storage/indexeddb/db.ts";

// Chrome/Edge extension: queryPermission/requestPermission on FileSystemHandle
interface ChromeFileSystemHandle extends FileSystemDirectoryHandle {
  queryPermission(desc: {
    mode: "readwrite";
  }): Promise<PermissionState>;
  requestPermission(desc: {
    mode: "readwrite";
  }): Promise<PermissionState>;
}

// --- Zustand store for reactive UI ---

export type SyncStatus = "disconnected" | "connected";

export interface FolderSyncState {
  status: SyncStatus;
  folderName: string;
}

export const useFolderSyncStore = create<FolderSyncState>(() => ({
  status: "disconnected",
  folderName: "",
}));

// --- Module state ---

let directoryHandle: FileSystemDirectoryHandle | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let writeTimeout: ReturnType<typeof setTimeout> | null = null;
let storeUnsubscribes: (() => void)[] = [];
const lastWrittenContents = new Map<string, string>();
let writing = false;

// --- Feature detection ---

export function isFolderSyncSupported(): boolean {
  return typeof window.showDirectoryPicker === "function";
}

// --- Handle persistence via IndexedDB (Dexie meta table) ---

async function saveHandle(
  handle: FileSystemDirectoryHandle,
): Promise<void> {
  await db.meta.put({ key: "folderHandle", value: handle });
}

async function loadHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const entry = await db.meta.get("folderHandle");
    return (entry?.value as FileSystemDirectoryHandle) ?? null;
  } catch {
    return null;
  }
}

async function removeHandle(): Promise<void> {
  try {
    await db.meta.delete("folderHandle");
  } catch {
    // Ignore errors
  }
}

// --- Permission verification (Chrome/Edge) ---

async function verifyPermission(
  handle: FileSystemDirectoryHandle,
): Promise<boolean> {
  try {
    const chromeHandle = handle as ChromeFileSystemHandle;
    if (typeof chromeHandle.queryPermission === "function") {
      const perm = await chromeHandle.queryPermission({ mode: "readwrite" });
      if (perm === "granted") return true;
    }
    if (typeof chromeHandle.requestPermission === "function") {
      const perm = await chromeHandle.requestPermission({ mode: "readwrite" });
      return perm === "granted";
    }
    return true;
  } catch {
    return false;
  }
}

// --- File I/O ---

async function writeAllFiles(): Promise<void> {
  if (!directoryHandle || writing) return;
  writing = true;

  try {
    const todos = useTodoStore.getState().todos;
    const tags = useTagStore.getState().tags;

    for (const tag of tags) {
      const tagTodos = todos.filter((t) => t.tagIds.includes(tag.id));
      const content = todosToMarkdown(tag.name, tagTodos);
      const filename = `${tag.name}.md`;

      if (lastWrittenContents.get(filename) === content) continue;

      const fileHandle = await directoryHandle.getFileHandle(filename, {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      lastWrittenContents.set(filename, content);
    }
  } catch {
    // File write error — ignore silently
  } finally {
    writing = false;
  }
}

function scheduleWrite(): void {
  if (writeTimeout) clearTimeout(writeTimeout);
  writeTimeout = setTimeout(() => void writeAllFiles(), 500);
}

// --- Poll for external changes ---

async function pollForChanges(): Promise<void> {
  if (!directoryHandle || writing) return;

  const tags = useTagStore.getState().tags;

  for (const tag of tags) {
    const filename = `${tag.name}.md`;

    try {
      const fileHandle = await directoryHandle.getFileHandle(filename);
      const file = await fileHandle.getFile();
      const content = await file.text();

      if (content === lastWrittenContents.get(filename)) continue;

      // External change detected — parse and merge
      const parsed = parseMarkdown(content);
      const existingTodos = useTodoStore
        .getState()
        .todos.filter((t) => t.tagIds.includes(tag.id));

      for (const parsedTodo of parsed.todos) {
        const existing = existingTodos.find(
          (t) => t.title === parsedTodo.title,
        );

        if (existing) {
          const newStatus = parsedTodo.completed ? "completed" : "open";
          if (existing.status !== newStatus) {
            await useTodoStore.getState().updateTodo(existing.id, {
              status: newStatus,
              completedAt:
                newStatus === "completed"
                  ? new Date().toISOString()
                  : null,
            });
          }
        } else {
          // Resolve parent from depth
          let parentId: string | null = null;
          if (parsedTodo.depth > 0) {
            const idx = parsed.todos.indexOf(parsedTodo);
            for (let j = idx - 1; j >= 0; j--) {
              if (parsed.todos[j]!.depth === parsedTodo.depth - 1) {
                const parentTitle = parsed.todos[j]!.title;
                const parentTodo = useTodoStore
                  .getState()
                  .todos.find(
                    (t) =>
                      t.title === parentTitle &&
                      t.tagIds.includes(tag.id),
                  );
                parentId = parentTodo?.id ?? null;
                break;
              }
            }
          }

          await useTodoStore.getState().createTodo({
            title: parsedTodo.title,
            description: null,
            tagIds: [tag.id],
            parentId,
            dueDate: null,
            recurrence: null,
            recurrenceInterval: null,
          });

          if (parsedTodo.completed) {
            const newTodo = useTodoStore
              .getState()
              .todos.find(
                (t) =>
                  t.title === parsedTodo.title &&
                  t.tagIds.includes(tag.id),
              );
            if (newTodo) {
              await useTodoStore.getState().updateTodo(newTodo.id, {
                status: "completed",
                completedAt: new Date().toISOString(),
              });
            }
          }
        }
      }

      // Update lastWritten to avoid re-triggering write-back
      lastWrittenContents.set(filename, content);
    } catch {
      // File doesn't exist or access error — skip
    }
  }

  // Also check for new .md files not matching existing tags
  try {
    for await (const [name, entry] of directoryHandle.entries()) {
      if (entry.kind !== "file" || !name.endsWith(".md")) continue;
      if (lastWrittenContents.has(name)) continue;

      const tagName = name.replace(/\.md$/, "");
      const existingTag = useTagStore
        .getState()
        .tags.find(
          (t) => t.name.toLowerCase() === tagName.toLowerCase(),
        );
      if (existingTag) continue; // Already handled above

      // New external file — read, create tag, import todos
      const fileHandle = await directoryHandle.getFileHandle(name);
      const file = await fileHandle.getFile();
      const content = await file.text();
      const parsed = parseMarkdown(content);
      const resolvedName = parsed.tagName ?? tagName;

      const existingColors = new Set(
        useTagStore.getState().tags.map((t) => t.color),
      );
      const availableColor =
        TAG_COLORS.find((c) => !existingColors.has(c)) ?? TAG_COLORS[0]!;

      await useTagStore
        .getState()
        .createTag({ name: resolvedName, color: availableColor, isDefault: false });

      const newTag = useTagStore
        .getState()
        .tags.find(
          (t) => t.name.toLowerCase() === resolvedName.toLowerCase(),
        );
      if (!newTag) continue;

      for (const parsedTodo of parsed.todos) {
        await useTodoStore.getState().createTodo({
          title: parsedTodo.title,
          description: null,
          tagIds: [newTag.id],
          parentId: null,
          dueDate: null,
          recurrence: null,
          recurrenceInterval: null,
        });

        if (parsedTodo.completed) {
          const created = useTodoStore
            .getState()
            .todos.find(
              (t) =>
                t.title === parsedTodo.title &&
                t.tagIds.includes(newTag.id),
            );
          if (created) {
            await useTodoStore.getState().updateTodo(created.id, {
              status: "completed",
              completedAt: new Date().toISOString(),
            });
          }
        }
      }

      lastWrittenContents.set(name, content);
    }
  } catch {
    // Directory enumeration not supported or access error
  }
}

// --- Polling lifecycle ---

function startPolling(): void {
  if (pollTimer) return;
  pollTimer = setInterval(() => void pollForChanges(), 5000);
}

function stopPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (writeTimeout) {
    clearTimeout(writeTimeout);
    writeTimeout = null;
  }
}

function subscribeToStores(): void {
  const todoUnsub = useTodoStore.subscribe(scheduleWrite);
  const tagUnsub = useTagStore.subscribe(scheduleWrite);
  storeUnsubscribes = [todoUnsub, tagUnsub];
}

function unsubscribeFromStores(): void {
  for (const unsub of storeUnsubscribes) unsub();
  storeUnsubscribes = [];
}

// --- Public API ---

export async function connectFolder(): Promise<void> {
  const handle = await window.showDirectoryPicker({ mode: "readwrite" });
  directoryHandle = handle;
  await saveHandle(handle);

  useFolderSyncStore.setState({
    status: "connected",
    folderName: handle.name,
  });

  await writeAllFiles();
  subscribeToStores();
  startPolling();
}

export async function disconnectFolder(): Promise<void> {
  stopPolling();
  unsubscribeFromStores();
  directoryHandle = null;
  lastWrittenContents.clear();
  writing = false;
  await removeHandle();

  useFolderSyncStore.setState({
    status: "disconnected",
    folderName: "",
  });
}

export async function restoreFolder(): Promise<void> {
  if (directoryHandle) return; // Already connected

  const handle = await loadHandle();
  if (!handle) return;

  const granted = await verifyPermission(handle);
  if (!granted) return;

  directoryHandle = handle;

  useFolderSyncStore.setState({
    status: "connected",
    folderName: handle.name,
  });

  subscribeToStores();
  startPolling();
  await writeAllFiles();
}
