import { render, screen } from "@testing-library/react";

import { Card, CardContent, CardFooter, CardHeader } from "./card";

describe("Card", () => {
  it("renders with default classes", () => {
    render(<Card data-testid="card">content</Card>);
    const el = screen.getByTestId("card");
    expect(el).toBeInTheDocument();
    expect(el.className).toContain("rounded-lg");
    expect(el.className).toContain("bg-card");
    expect(el.className).toContain("shadow-sm");
  });

  it("merges custom className", () => {
    render(
      <Card data-testid="card" className="mt-4">
        content
      </Card>,
    );
    const el = screen.getByTestId("card");
    expect(el.className).toContain("mt-4");
    expect(el.className).toContain("bg-card");
  });

  it("forwards ref", () => {
    const ref = { current: null } as React.RefObject<HTMLDivElement | null>;
    render(<Card ref={ref}>content</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("CardHeader", () => {
  it("renders with default classes", () => {
    render(<CardHeader data-testid="header">header</CardHeader>);
    const el = screen.getByTestId("header");
    expect(el.className).toContain("p-6");
    expect(el.className).toContain("flex");
  });
});

describe("CardContent", () => {
  it("renders with default padding", () => {
    render(<CardContent data-testid="content">body</CardContent>);
    const el = screen.getByTestId("content");
    expect(el.className).toContain("p-6");
  });

  it("allows custom padding override", () => {
    render(
      <CardContent data-testid="content" className="p-4">
        body
      </CardContent>,
    );
    const el = screen.getByTestId("content");
    expect(el.className).toContain("p-4");
    // tailwind-merge should remove the default p-6
    expect(el.className).not.toContain("p-6");
  });
});

describe("CardFooter", () => {
  it("renders with default classes", () => {
    render(<CardFooter data-testid="footer">footer</CardFooter>);
    const el = screen.getByTestId("footer");
    expect(el.className).toContain("flex");
    expect(el.className).toContain("items-center");
  });
});
