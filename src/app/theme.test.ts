import { describe, it, expect, beforeEach, vi } from "vitest";
import { setTheme, applyColorAccent, initTheme, initColorAccent } from "./theme.ts";

// Mock matchMedia for jsdom
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe("theme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.remove("accent-purple", "accent-green", "accent-orange");
  });

  describe("setTheme", () => {
    it("applies dark class for dark theme", () => {
      setTheme("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("removes dark class for light theme", () => {
      document.documentElement.classList.add("dark");
      setTheme("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("persists theme to localStorage", () => {
      setTheme("dark");
      expect(localStorage.getItem("theme")).toBe("dark");
    });

    it("handles auto theme based on media query", () => {
      setTheme("auto");
      // In jsdom, matchMedia returns false by default, so "light" is applied
      expect(localStorage.getItem("theme")).toBe("auto");
    });
  });

  describe("initTheme", () => {
    it("applies saved theme from localStorage", () => {
      localStorage.setItem("theme", "dark");
      initTheme();
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("defaults to auto when no saved theme", () => {
      initTheme();
      // In jsdom, auto resolves to light (matchMedia returns false)
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });

  describe("applyColorAccent", () => {
    it("adds accent-purple class for purple", () => {
      applyColorAccent("purple");
      expect(document.documentElement.classList.contains("accent-purple")).toBe(true);
    });

    it("adds accent-green class for green", () => {
      applyColorAccent("green");
      expect(document.documentElement.classList.contains("accent-green")).toBe(true);
    });

    it("adds accent-orange class for orange", () => {
      applyColorAccent("orange");
      expect(document.documentElement.classList.contains("accent-orange")).toBe(true);
    });

    it("removes other accent classes when changing", () => {
      applyColorAccent("purple");
      applyColorAccent("green");
      expect(document.documentElement.classList.contains("accent-purple")).toBe(false);
      expect(document.documentElement.classList.contains("accent-green")).toBe(true);
    });

    it("does not add class for blue (default)", () => {
      applyColorAccent("blue");
      expect(document.documentElement.classList.contains("accent-blue")).toBe(false);
      expect(document.documentElement.classList.contains("accent-purple")).toBe(false);
    });

    it("removes all accent classes when switching to blue", () => {
      applyColorAccent("purple");
      applyColorAccent("blue");
      expect(document.documentElement.classList.contains("accent-purple")).toBe(false);
    });
  });

  describe("initColorAccent", () => {
    it("applies saved accent from localStorage", () => {
      localStorage.setItem("color-accent", "purple");
      initColorAccent();
      expect(document.documentElement.classList.contains("accent-purple")).toBe(true);
    });

    it("does nothing when no saved accent", () => {
      initColorAccent();
      expect(document.documentElement.classList.contains("accent-purple")).toBe(false);
    });

    it("does nothing when saved accent is blue", () => {
      localStorage.setItem("color-accent", "blue");
      initColorAccent();
      expect(document.documentElement.classList.contains("accent-blue")).toBe(false);
    });
  });
});
