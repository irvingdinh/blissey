import { render } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("@/lib/use-theme", () => ({
  useTheme: () => ({ theme: "light" as const, toggle: vi.fn() }),
}));

import { Toaster } from "./sonner";

describe("Toaster", () => {
  it("renders without crashing", () => {
    expect(() => render(<Toaster />)).not.toThrow();
  });

  it("accepts custom props", () => {
    expect(() => render(<Toaster position="top-right" />)).not.toThrow();
  });
});
