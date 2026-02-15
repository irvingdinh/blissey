import { render, screen } from "@testing-library/react";

import { Alert, AlertDescription, AlertTitle } from "./alert";

describe("Alert", () => {
  it("renders with default classes", () => {
    render(<Alert data-testid="alert">content</Alert>);
    const el = screen.getByTestId("alert");
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("role", "alert");
    expect(el.className).toContain("rounded-lg");
    expect(el.className).toContain("border");
    expect(el.className).toContain("bg-background");
  });

  it("renders destructive variant", () => {
    render(
      <Alert data-testid="alert" variant="destructive">
        error
      </Alert>,
    );
    const el = screen.getByTestId("alert");
    expect(el.className).toContain("text-destructive");
  });

  it("renders success variant", () => {
    render(
      <Alert data-testid="alert" variant="success">
        success
      </Alert>,
    );
    const el = screen.getByTestId("alert");
    expect(el.className).toContain("text-emerald-700");
  });

  it("renders warning variant", () => {
    render(
      <Alert data-testid="alert" variant="warning">
        warning
      </Alert>,
    );
    const el = screen.getByTestId("alert");
    expect(el.className).toContain("text-amber-700");
  });

  it("merges custom className", () => {
    render(
      <Alert data-testid="alert" className="mt-4">
        content
      </Alert>,
    );
    const el = screen.getByTestId("alert");
    expect(el.className).toContain("mt-4");
    expect(el.className).toContain("rounded-lg");
  });

  it("forwards ref", () => {
    const ref = { current: null } as React.RefObject<HTMLDivElement | null>;
    render(<Alert ref={ref}>content</Alert>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("AlertTitle", () => {
  it("renders with default classes", () => {
    render(<AlertTitle data-testid="title">title</AlertTitle>);
    const el = screen.getByTestId("title");
    expect(el.tagName).toBe("H5");
    expect(el.className).toContain("font-medium");
  });

  it("forwards ref", () => {
    const ref = {
      current: null,
    } as React.RefObject<HTMLHeadingElement | null>;
    render(<AlertTitle ref={ref}>title</AlertTitle>);
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });
});

describe("AlertDescription", () => {
  it("renders with default classes", () => {
    render(<AlertDescription data-testid="desc">description</AlertDescription>);
    const el = screen.getByTestId("desc");
    expect(el.className).toContain("text-sm");
  });

  it("forwards ref", () => {
    const ref = {} as React.MutableRefObject<HTMLParagraphElement | null>;
    ref.current = null;
    render(<AlertDescription ref={ref}>desc</AlertDescription>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
