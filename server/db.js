import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "crypto";

let _db;

export function getDb(dbPath) {
  if (!_db) {
    _db = new DatabaseSync(dbPath);
    _db.exec("PRAGMA journal_mode = WAL");
    _db.exec("PRAGMA foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      isDefault INTEGER NOT NULL DEFAULT 0,
      parentId TEXT REFERENCES tags(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      tagIds TEXT NOT NULL DEFAULT '[]',
      parentId TEXT REFERENCES todos(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'open',
      dueDate TEXT,
      recurrence TEXT,
      recurrenceInterval INTEGER,
      createdAt TEXT NOT NULL,
      completedAt TEXT,
      sortOrder INTEGER NOT NULL DEFAULT 0
    );
  `);
}

// --- Tag helpers ---

function rowToTag(row) {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    isDefault: row.isDefault === 1,
    parentId: row.parentId ?? null,
  };
}

export function getAllTags(db) {
  return db.prepare("SELECT * FROM tags").all().map(rowToTag);
}

export function createTag(db, input) {
  const tag = {
    id: input.id || randomUUID(),
    name: input.name,
    color: input.color,
    isDefault: input.isDefault ? 1 : 0,
    parentId: input.parentId ?? null,
  };
  db.prepare(
    "INSERT INTO tags (id, name, color, isDefault, parentId) VALUES (@id, @name, @color, @isDefault, @parentId)"
  ).run(tag);
  return rowToTag({ ...tag });
}

export function updateTag(db, id, changes) {
  const fields = [];
  const params = { id };
  if (changes.name !== undefined) {
    fields.push("name = @name");
    params.name = changes.name;
  }
  if (changes.color !== undefined) {
    fields.push("color = @color");
    params.color = changes.color;
  }
  if (changes.isDefault !== undefined) {
    fields.push("isDefault = @isDefault");
    params.isDefault = changes.isDefault ? 1 : 0;
  }
  if (changes.parentId !== undefined) {
    fields.push("parentId = @parentId");
    params.parentId = changes.parentId;
  }
  if (fields.length === 0) return;
  db.prepare(`UPDATE tags SET ${fields.join(", ")} WHERE id = @id`).run(params);
}

export function deleteTag(db, id) {
  db.prepare("DELETE FROM tags WHERE id = ?").run(id);
}

// --- Todo helpers ---

function rowToTodo(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    tagIds: JSON.parse(row.tagIds),
    parentId: row.parentId ?? null,
    status: row.status,
    dueDate: row.dueDate ?? null,
    recurrence: row.recurrence ?? null,
    recurrenceInterval: row.recurrenceInterval ?? null,
    createdAt: row.createdAt,
    completedAt: row.completedAt ?? null,
    sortOrder: row.sortOrder,
  };
}

export function getAllTodos(db) {
  return db.prepare("SELECT * FROM todos").all().map(rowToTodo);
}

export function createTodo(db, input) {
  const maxRow = db
    .prepare("SELECT MAX(sortOrder) as maxSort FROM todos")
    .get();
  const sortOrder =
    input.sortOrder !== undefined
      ? input.sortOrder
      : (maxRow?.maxSort ?? -1) + 1;

  const todo = {
    id: input.id || randomUUID(),
    title: input.title,
    description: input.description ?? null,
    tagIds: JSON.stringify(input.tagIds ?? []),
    parentId: input.parentId ?? null,
    status: input.status || "open",
    dueDate: input.dueDate ?? null,
    recurrence: input.recurrence ?? null,
    recurrenceInterval: input.recurrenceInterval ?? null,
    createdAt: input.createdAt || new Date().toISOString(),
    completedAt: input.completedAt ?? null,
    sortOrder,
  };
  db.prepare(
    `INSERT INTO todos (id, title, description, tagIds, parentId, status, dueDate, recurrence, recurrenceInterval, createdAt, completedAt, sortOrder)
     VALUES (@id, @title, @description, @tagIds, @parentId, @status, @dueDate, @recurrence, @recurrenceInterval, @createdAt, @completedAt, @sortOrder)`
  ).run(todo);
  return rowToTodo({ ...todo });
}

export function updateTodo(db, id, changes) {
  const fields = [];
  const params = { id };
  if (changes.title !== undefined) {
    fields.push("title = @title");
    params.title = changes.title;
  }
  if (changes.description !== undefined) {
    fields.push("description = @description");
    params.description = changes.description;
  }
  if (changes.tagIds !== undefined) {
    fields.push("tagIds = @tagIds");
    params.tagIds = JSON.stringify(changes.tagIds);
  }
  if (changes.parentId !== undefined) {
    fields.push("parentId = @parentId");
    params.parentId = changes.parentId;
  }
  if (changes.status !== undefined) {
    fields.push("status = @status");
    params.status = changes.status;
  }
  if (changes.dueDate !== undefined) {
    fields.push("dueDate = @dueDate");
    params.dueDate = changes.dueDate;
  }
  if (changes.recurrence !== undefined) {
    fields.push("recurrence = @recurrence");
    params.recurrence = changes.recurrence;
  }
  if (changes.recurrenceInterval !== undefined) {
    fields.push("recurrenceInterval = @recurrenceInterval");
    params.recurrenceInterval = changes.recurrenceInterval;
  }
  if (changes.completedAt !== undefined) {
    fields.push("completedAt = @completedAt");
    params.completedAt = changes.completedAt;
  }
  if (changes.sortOrder !== undefined) {
    fields.push("sortOrder = @sortOrder");
    params.sortOrder = changes.sortOrder;
  }
  if (changes.createdAt !== undefined) {
    fields.push("createdAt = @createdAt");
    params.createdAt = changes.createdAt;
  }
  if (fields.length === 0) return;
  db.prepare(`UPDATE todos SET ${fields.join(", ")} WHERE id = @id`).run(
    params
  );
}

export function deleteTodo(db, id) {
  db.prepare("DELETE FROM todos WHERE id = ?").run(id);
}
