import { render, screen } from "@testing-library/react";

import { Checkbox } from "./checkbox";

describe("Checkbox", () => {
  it("renders with default classes", () => {
    render(<Checkbox data-testid="checkbox" />);
    const el = screen.getByTestId("checkbox");
    expect(el).toBeInTheDocument();
    expect(el.className).toContain("rounded-sm");
    expect(el.className).toContain("border");
    expect(el.className).toContain("border-primary");
  });

  it("merges custom className", () => {
    render(<Checkbox data-testid="checkbox" className="mt-4" />);
    const el = screen.getByTestId("checkbox");
    expect(el.className).toContain("mt-4");
    expect(el.className).toContain("rounded-sm");
  });

  it("forwards ref", () => {
    const ref = { current: null } as React.RefObject<HTMLButtonElement | null>;
    render(<Checkbox ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("renders as unchecked by default", () => {
    render(<Checkbox data-testid="checkbox" />);
    const el = screen.getByTestId("checkbox");
    expect(el).toHaveAttribute("data-state", "unchecked");
  });

  it("renders as checked when checked prop is true", () => {
    render(<Checkbox data-testid="checkbox" checked />);
    const el = screen.getByTestId("checkbox");
    expect(el).toHaveAttribute("data-state", "checked");
  });

  it("can be disabled", () => {
    render(<Checkbox data-testid="checkbox" disabled />);
    const el = screen.getByTestId("checkbox");
    expect(el).toBeDisabled();
  });

  it("renders children (check icon) when checked", () => {
    const { container } = render(<Checkbox checked />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
