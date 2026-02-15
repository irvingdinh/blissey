import { fireEvent, render, screen } from "@testing-library/react";

import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("renders nothing when totalPages is 1", () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when totalPages is 0", () => {
    const { container } = render(
      <Pagination page={1} totalPages={0} onPageChange={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders page numbers for small total pages", () => {
    render(<Pagination page={1} totalPages={3} onPageChange={() => {}} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders Previous and Next buttons", () => {
    render(<Pagination page={2} totalPages={5} onPageChange={() => {}} />);
    expect(
      screen.getByRole("button", { name: /previous/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
  });

  it("disables Previous on first page", () => {
    render(<Pagination page={1} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).not.toBeDisabled();
  });

  it("disables Next on last page", () => {
    render(<Pagination page={5} totalPages={5} onPageChange={() => {}} />);
    expect(
      screen.getByRole("button", { name: /previous/i }),
    ).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("calls onPageChange when clicking a page number", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByText("3"));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("calls onPageChange with next page when clicking Next", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("calls onPageChange with previous page when clicking Previous", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole("button", { name: /previous/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("highlights the active page", () => {
    render(<Pagination page={2} totalPages={5} onPageChange={() => {}} />);
    const activeButton = screen.getByText("2");
    expect(activeButton.className).toContain("btn-active");
  });

  it("renders ellipsis for large page counts", () => {
    render(<Pagination page={5} totalPages={10} onPageChange={() => {}} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    const ellipses = screen.getAllByText("...");
    expect(ellipses.length).toBeGreaterThanOrEqual(1);
  });
});
