import { describe, it, expect } from "vitest";
import { renderMarkdownHtml } from "./markdown-renderer.ts";

describe("renderMarkdownHtml", () => {
  it("renders heading", () => {
    const html = renderMarkdownHtml("# Work");
    expect(html).toContain("<h1>");
    expect(html).toContain("Work");
  });

  it("renders checkbox list items", () => {
    const html = renderMarkdownHtml("- [ ] Open task\n- [x] Done task");
    expect(html).toContain("Open task");
    expect(html).toContain("Done task");
    expect(html).toContain("<li>");
  });

  it("strips script tags", () => {
    const html = renderMarkdownHtml('<script>alert("xss")</script>');
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("alert");
  });

  it("strips event handlers", () => {
    const html = renderMarkdownHtml('<img onerror="alert(1)" src="x">');
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("alert");
  });
});
