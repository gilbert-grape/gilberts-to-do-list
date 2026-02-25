import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import {
  getDb,
  getAllTags,
  createTag,
  updateTag,
  deleteTag,
  getAllTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  getAllSettings,
  updateSettings,
} from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || "8099", 10);
const DB_PATH = process.env.DB_PATH || "/data/gilberts-todo.db";

const db = getDb(DB_PATH);
const app = express();

app.use(express.json());

// --- Health ---
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// --- Tags ---
app.get("/api/tags", (_req, res) => {
  res.json(getAllTags(db));
});

app.post("/api/tags", (req, res) => {
  try {
    const tag = createTag(db, req.body);
    res.status(201).json(tag);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/tags/:id", (req, res) => {
  try {
    updateTag(db, req.params.id, req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/tags/:id", (req, res) => {
  try {
    deleteTag(db, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Todos ---
app.get("/api/todos", (_req, res) => {
  res.json(getAllTodos(db));
});

app.post("/api/todos", (req, res) => {
  try {
    const todo = createTodo(db, req.body);
    res.status(201).json(todo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/todos/:id", (req, res) => {
  try {
    updateTodo(db, req.params.id, req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/todos/:id", (req, res) => {
  try {
    deleteTodo(db, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Settings ---
app.get("/api/settings", (_req, res) => {
  res.json(getAllSettings(db));
});

app.patch("/api/settings", (req, res) => {
  try {
    updateSettings(db, req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Static files ---
const distDir = path.resolve(__dirname, "..", "dist");
let indexHtml;
try {
  indexHtml = readFileSync(path.join(distDir, "index.html"), "utf-8");
} catch {
  indexHtml = null;
}

app.use(express.static(distDir));

// SPA fallback — inject ingress path for HA
app.get("*splat", (req, res) => {
  if (!indexHtml) {
    return res.status(404).send("Frontend not built. Run npm run build first.");
  }
  const ingressPath = req.headers["x-ingress-path"] || "";
  const html = indexHtml.replace(/__INGRESS_PATH__/g, ingressPath);
  res.type("html").send(html);
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Database: ${DB_PATH}`);
});
