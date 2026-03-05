import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolveApiBaseUrl } from "./resolve-base-url.ts";

describe("resolveApiBaseUrl", () => {
  const originalIngressPath = window.__INGRESS_PATH__;
  const originalEnv = import.meta.env.VITE_API_BASE_URL;

  beforeEach(() => {
    delete window.__INGRESS_PATH__;
    delete import.meta.env.VITE_API_BASE_URL;
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
  });

  it("returns ingress path when set and not placeholder", () => {
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
    window.__INGRESS_PATH__ = "/ingress/path";
    import.meta.env.VITE_API_BASE_URL = "http://localhost:8099";
    expect(resolveApiBaseUrl()).toBe("/ingress/path");
  });
});
