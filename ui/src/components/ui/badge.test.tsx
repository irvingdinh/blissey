import { render, screen } from "@testing-library/react";

import { Badge } from "./badge";

describe("Badge", () => {
  it("renders with default classes", () => {
    render(<Badge data-testid="badge">content</Badge>);
    const el = screen.getByTestId("badge");
    expect(el).toBeInTheDocument();
    expect(el.tagName).toBe("SPAN");
    expect(el.className).toContain("rounded-md");
    expect(el.className).toContain("bg-primary");
  });

  it("renders secondary variant", () => {
    render(
      <Badge data-testid="badge" variant="secondary">
        secondary
      </Badge>,
    );
    const el = screen.getByTestId("badge");
    expect(el.className).toContain("bg-secondary");
  });

  it("renders destructive variant", () => {
    render(
      <Badge data-testid="badge" variant="destructive">
        error
      </Badge>,
    );
    const el = screen.getByTestId("badge");
    expect(el.className).toContain("bg-destructive");
  });

  it("renders outline variant", () => {
    render(
      <Badge data-testid="badge" variant="outline">
        outline
      </Badge>,
    );
    const el = screen.getByTestId("badge");
    expect(el.className).toContain("text-foreground");
    expect(el.className).not.toContain("bg-primary");
  });

  it("renders warning variant", () => {
    render(
      <Badge data-testid="badge" variant="warning">
        warning
      </Badge>,
    );
    const el = screen.getByTestId("badge");
    expect(el.className).toContain("text-amber-700");
  });

  it("merges custom className", () => {
    render(
      <Badge data-testid="badge" className="mt-4">
        content
      </Badge>,
    );
    const el = screen.getByTestId("badge");
    expect(el.className).toContain("mt-4");
    expect(el.className).toContain("rounded-md");
  });

  it("forwards ref", () => {
    const ref = { current: null } as React.RefObject<HTMLSpanElement | null>;
    render(<Badge ref={ref}>content</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("renders children", () => {
    render(<Badge>badge text</Badge>);
    expect(screen.getByText("badge text")).toBeInTheDocument();
  });
});
