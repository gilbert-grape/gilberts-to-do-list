export type Theme = "light" | "dark" | "auto";
export type ColorAccent = "blue" | "purple" | "green" | "orange";

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function initTheme() {
  const saved = localStorage.getItem("theme") as Theme | null;
  const theme = saved ?? "auto";
  const resolved = theme === "auto" ? getSystemTheme() : theme;
  applyTheme(resolved);

  if (theme === "auto") {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        const current = localStorage.getItem("theme") as Theme | null;
        if (!current || current === "auto") {
          applyTheme(e.matches ? "dark" : "light");
        }
      });
  }
}

export function setTheme(theme: Theme) {
  localStorage.setItem("theme", theme);
  const resolved = theme === "auto" ? getSystemTheme() : theme;
  applyTheme(resolved);
}

const ACCENT_CLASSES = ["accent-purple", "accent-green", "accent-orange"];

export function applyColorAccent(accent: ColorAccent) {
  const el = document.documentElement;
  ACCENT_CLASSES.forEach((cls) => el.classList.remove(cls));
  if (accent !== "blue") {
    el.classList.add(`accent-${accent}`);
  }
}

export function initColorAccent() {
  const saved = localStorage.getItem("color-accent") as ColorAccent | null;
  if (saved && saved !== "blue") {
    applyColorAccent(saved);
  }
}
