import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLongPress } from "./use-long-press.ts";

describe("useLongPress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires callback after default delay on touchStart", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useLongPress(callback));

    act(() => {
      result.current.onTouchStart({ preventDefault: vi.fn() } as never);
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledOnce();
  });

  it("fires callback after custom delay", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useLongPress(callback, 200));

    act(() => {
      result.current.onTouchStart({ preventDefault: vi.fn() } as never);
    });

    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(callback).toHaveBeenCalledOnce();
  });

  it("cancels on touchEnd before delay", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useLongPress(callback));

    act(() => {
      result.current.onTouchStart({ preventDefault: vi.fn() } as never);
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => {
      result.current.onTouchEnd();
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it("cancels on touchMove", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useLongPress(callback));

    act(() => {
      result.current.onTouchStart({ preventDefault: vi.fn() } as never);
    });
    act(() => {
      result.current.onTouchMove();
    });
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it("calls preventDefault on touchStart", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useLongPress(callback));
    const preventDefault = vi.fn();

    act(() => {
      result.current.onTouchStart({ preventDefault } as never);
    });

    expect(preventDefault).toHaveBeenCalled();
  });
});
