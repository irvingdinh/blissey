import { render, screen } from "@testing-library/react";

import { Input } from "./input";

describe("Input", () => {
  it("renders with default classes", () => {
    render(<Input data-testid="input" />);
    const el = screen.getByTestId("input");
    expect(el).toBeInTheDocument();
    expect(el.tagName).toBe("INPUT");
    expect(el.className).toContain("rounded-md");
    expect(el.className).toContain("border");
    expect(el.className).toContain("border-input");
  });

  it("merges custom className", () => {
    render(<Input data-testid="input" className="mt-4 h-8" />);
    const el = screen.getByTestId("input");
    expect(el.className).toContain("mt-4");
    expect(el.className).toContain("h-8");
    expect(el.className).toContain("rounded-md");
  });

  it("forwards ref", () => {
    const ref = { current: null } as React.RefObject<HTMLInputElement | null>;
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("renders with the specified type", () => {
    render(<Input data-testid="input" type="email" />);
    const el = screen.getByTestId("input");
    expect(el).toHaveAttribute("type", "email");
  });

  it("renders with placeholder", () => {
    render(<Input placeholder="Enter text..." />);
    expect(screen.getByPlaceholderText("Enter text...")).toBeInTheDocument();
  });

  it("can be disabled", () => {
    render(<Input data-testid="input" disabled />);
    const el = screen.getByTestId("input");
    expect(el).toBeDisabled();
  });

  it("passes through additional props", () => {
    render(<Input data-testid="input" aria-label="test input" />);
    const el = screen.getByTestId("input");
    expect(el).toHaveAttribute("aria-label", "test input");
  });
});
