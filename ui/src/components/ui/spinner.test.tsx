import { render, screen } from "@testing-library/react";

import { Spinner } from "./spinner";

describe("Spinner", () => {
  it("renders with default md size", () => {
    render(<Spinner />);
    const el = screen.getByTestId("spinner");
    expect(el).toBeInTheDocument();
    expect(el.tagName.toLowerCase()).toBe("svg");
    expect(el.getAttribute("class")).toContain("animate-spin");
    expect(el).toHaveAttribute("width", "20");
    expect(el).toHaveAttribute("height", "20");
  });

  it("renders xs size", () => {
    render(<Spinner size="xs" />);
    const el = screen.getByTestId("spinner");
    expect(el).toHaveAttribute("width", "12");
    expect(el).toHaveAttribute("height", "12");
  });

  it("renders sm size", () => {
    render(<Spinner size="sm" />);
    const el = screen.getByTestId("spinner");
    expect(el).toHaveAttribute("width", "16");
    expect(el).toHaveAttribute("height", "16");
  });

  it("renders lg size", () => {
    render(<Spinner size="lg" />);
    const el = screen.getByTestId("spinner");
    expect(el).toHaveAttribute("width", "28");
    expect(el).toHaveAttribute("height", "28");
  });

  it("merges custom className", () => {
    render(<Spinner className="mt-4" />);
    const el = screen.getByTestId("spinner");
    expect(el.getAttribute("class")).toContain("mt-4");
    expect(el.getAttribute("class")).toContain("animate-spin");
  });

  it("applies text-muted-foreground by default", () => {
    render(<Spinner />);
    const el = screen.getByTestId("spinner");
    expect(el.getAttribute("class")).toContain("text-muted-foreground");
  });
});
