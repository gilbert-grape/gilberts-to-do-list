import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { resolveApiBaseUrl } from "./resolve-base-url.ts";

describe("resolveApiBaseUrl", () => {
  const originalIngressPath = window.__INGRESS_PATH__;
  const originalEnv = import.meta.env.VITE_API_BASE_URL;
  const originalPathname = window.location.pathname;

  function mockPathname(value: string) {
    Object.defineProperty(window, "location", {
      value: { ...window.location, pathname: value },
      writable: true,
      configurable: true,
    });
  }

  beforeEach(() => {
    delete window.__INGRESS_PATH__;
    delete import.meta.env.VITE_API_BASE_URL;
    mockPathname("/");
  });

  afterEach(() => {
    if (originalIngressPath !== undefined) {
      window.__INGRESS_PATH__ = originalIngressPath;
    } else {
      delete window.__INGRESS_PATH__;
    }
    if (originalEnv !== undefined) {
      import.meta.env.VITE_API_BASE_URL = originalEnv;
    } else {
      delete import.meta.env.VITE_API_BASE_URL;
    }
    mockPathname(originalPathname);
  });

  it("detects ingress path from URL pathname", () => {
    mockPathname("/api/hassio_ingress/abc123/settings");
    expect(resolveApiBaseUrl()).toBe("/api/hassio_ingress/abc123");
  });

  it("URL detection takes priority over window.__INGRESS_PATH__", () => {
    mockPathname("/api/hassio_ingress/from-url/");
    window.__INGRESS_PATH__ = "/api/hassio_ingress/from-window";
    expect(resolveApiBaseUrl()).toBe("/api/hassio_ingress/from-url");
  });

  it("falls back to window.__INGRESS_PATH__ when URL has no ingress", () => {
    mockPathname("/settings");
    window.__INGRESS_PATH__ = "/api/hassio_ingress/abc123";
    expect(resolveApiBaseUrl()).toBe("/api/hassio_ingress/abc123");
  });

  it("ignores ingress path when it is the placeholder", () => {
    window.__INGRESS_PATH__ = "__INGRESS_PATH__";
    expect(resolveApiBaseUrl()).toBe("");
  });

  it("ignores ingress path when empty string", () => {
    window.__INGRESS_PATH__ = "";
    expect(resolveApiBaseUrl()).toBe("");
  });

  it("returns VITE_API_BASE_URL when set and no ingress", () => {
    import.meta.env.VITE_API_BASE_URL = "http://localhost:8099";
    expect(resolveApiBaseUrl()).toBe("http://localhost:8099");
  });

  it("returns empty string as default", () => {
    expect(resolveApiBaseUrl()).toBe("");
  });

  it("ingress takes priority over env var", () => {
    mockPathname("/api/hassio_ingress/token123/");
    import.meta.env.VITE_API_BASE_URL = "http://localhost:8099";
    expect(resolveApiBaseUrl()).toBe("/api/hassio_ingress/token123");
  });
});
