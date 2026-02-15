import { act, renderHook } from "@testing-library/react";

import { useTheme } from "./use-theme";

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    // Reset to light by toggling if needed
    const { result } = renderHook(() => useTheme());
    if (result.current.theme === "dark") {
      act(() => result.current.toggle());
    }
  });

  it("defaults to light when no preference is stored", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
  });

  it("applies dark class on <html> when toggled to dark", () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggle();
    });

    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes dark class on <html> when toggled back to light", () => {
    const { result } = renderHook(() => useTheme());

    // Toggle to dark first
    act(() => {
      result.current.toggle();
    });
    expect(result.current.theme).toBe("dark");

    // Toggle back to light
    act(() => {
      result.current.toggle();
    });
    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("persists theme to localStorage", () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggle();
    });

    expect(localStorage.getItem("blissey-theme")).toBe("dark");
  });

  it("does not use data-theme attribute", () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggle();
    });

    expect(document.documentElement.getAttribute("data-theme")).toBeNull();
  });
});
