import { render, screen } from "@testing-library/react";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

describe("Table", () => {
  it("renders with default classes", () => {
    render(
      <Table data-testid="table">
        <TableBody>
          <TableRow>
            <TableCell>cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const el = screen.getByTestId("table");
    expect(el).toBeInTheDocument();
    expect(el.className).toContain("w-full");
    expect(el.className).toContain("text-sm");
  });

  it("merges custom className", () => {
    render(
      <Table data-testid="table" className="mt-4">
        <TableBody>
          <TableRow>
            <TableCell>cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const el = screen.getByTestId("table");
    expect(el.className).toContain("mt-4");
    expect(el.className).toContain("w-full");
  });

  it("wraps table in overflow container", () => {
    render(
      <Table data-testid="table">
        <TableBody>
          <TableRow>
            <TableCell>cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const table = screen.getByTestId("table");
    const wrapper = table.parentElement!;
    expect(wrapper.className).toContain("overflow-auto");
  });

  it("forwards ref", () => {
    const ref = { current: null } as React.RefObject<HTMLTableElement | null>;
    render(
      <Table ref={ref}>
        <TableBody>
          <TableRow>
            <TableCell>cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(ref.current).toBeInstanceOf(HTMLTableElement);
  });
});

describe("TableHeader", () => {
  it("renders with default classes", () => {
    render(
      <table>
        <TableHeader data-testid="thead">
          <TableRow>
            <TableHead>heading</TableHead>
          </TableRow>
        </TableHeader>
      </table>,
    );
    const el = screen.getByTestId("thead");
    expect(el).toBeInTheDocument();
    expect(el.className).toContain("[&_tr]:border-b");
  });
});

describe("TableBody", () => {
  it("renders with default classes", () => {
    render(
      <table>
        <TableBody data-testid="tbody">
          <TableRow>
            <TableCell>cell</TableCell>
          </TableRow>
        </TableBody>
      </table>,
    );
    const el = screen.getByTestId("tbody");
    expect(el).toBeInTheDocument();
    expect(el.className).toContain("[&_tr:last-child]:border-0");
  });
});

describe("TableRow", () => {
  it("renders with default classes", () => {
    render(
      <table>
        <tbody>
          <TableRow data-testid="tr">
            <TableCell>cell</TableCell>
          </TableRow>
        </tbody>
      </table>,
    );
    const el = screen.getByTestId("tr");
    expect(el.className).toContain("border-b");
    expect(el.className).toContain("hover:bg-muted/50");
  });
});

describe("TableHead", () => {
  it("renders with default classes", () => {
    render(
      <table>
        <thead>
          <tr>
            <TableHead data-testid="th">heading</TableHead>
          </tr>
        </thead>
      </table>,
    );
    const el = screen.getByTestId("th");
    expect(el.className).toContain("font-medium");
    expect(el.className).toContain("text-muted-foreground");
  });
});

describe("TableCell", () => {
  it("renders with default classes", () => {
    render(
      <table>
        <tbody>
          <tr>
            <TableCell data-testid="td">cell</TableCell>
          </tr>
        </tbody>
      </table>,
    );
    const el = screen.getByTestId("td");
    expect(el.className).toContain("p-2");
    expect(el.className).toContain("align-middle");
  });

  it("merges custom className", () => {
    render(
      <table>
        <tbody>
          <tr>
            <TableCell data-testid="td" className="text-right">
              cell
            </TableCell>
          </tr>
        </tbody>
      </table>,
    );
    const el = screen.getByTestId("td");
    expect(el.className).toContain("text-right");
    expect(el.className).toContain("p-2");
  });
});

describe("TableCaption", () => {
  it("renders with default classes", () => {
    render(
      <table>
        <TableCaption data-testid="caption">caption text</TableCaption>
      </table>,
    );
    const el = screen.getByTestId("caption");
    expect(el.className).toContain("text-sm");
    expect(el.className).toContain("text-muted-foreground");
    expect(el).toHaveTextContent("caption text");
  });
});
