import { fireEvent, render, screen } from "@testing-library/react";

import { Lightbox } from "./Lightbox";

function makeImages(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `img-${i}`,
    fileName: `photo-${i}.jpg`,
    filePath: `2024/photo-${i}.jpg`,
  }));
}

describe("Lightbox", () => {
  it("renders the lightbox overlay", () => {
    render(
      <Lightbox images={makeImages(3)} initialIndex={0} onClose={() => {}} />,
    );
    expect(screen.getByTestId("lightbox")).toBeInTheDocument();
  });

  it("displays the image at initialIndex", () => {
    render(
      <Lightbox images={makeImages(3)} initialIndex={1} onClose={() => {}} />,
    );
    const img = screen.getByTestId("lightbox-image");
    expect(img).toHaveAttribute("src", "/uploads/2024/photo-1.jpg");
  });

  it("shows counter for multiple images", () => {
    render(
      <Lightbox images={makeImages(3)} initialIndex={0} onClose={() => {}} />,
    );
    expect(screen.getByTestId("lightbox-counter")).toHaveTextContent("1 / 3");
  });

  it("does not show counter for single image", () => {
    render(
      <Lightbox images={makeImages(1)} initialIndex={0} onClose={() => {}} />,
    );
    expect(screen.queryByTestId("lightbox-counter")).not.toBeInTheDocument();
  });

  it("shows next but not prev arrow on first image", () => {
    render(
      <Lightbox images={makeImages(3)} initialIndex={0} onClose={() => {}} />,
    );
    expect(screen.queryByTestId("lightbox-prev")).not.toBeInTheDocument();
    expect(screen.getByTestId("lightbox-next")).toBeInTheDocument();
  });

  it("shows prev but not next arrow on last image", () => {
    render(
      <Lightbox images={makeImages(3)} initialIndex={2} onClose={() => {}} />,
    );
    expect(screen.getByTestId("lightbox-prev")).toBeInTheDocument();
    expect(screen.queryByTestId("lightbox-next")).not.toBeInTheDocument();
  });

  it("navigates to next image when clicking next", () => {
    render(
      <Lightbox images={makeImages(3)} initialIndex={0} onClose={() => {}} />,
    );
    fireEvent.click(screen.getByTestId("lightbox-next"));
    const img = screen.getByTestId("lightbox-image");
    expect(img).toHaveAttribute("src", "/uploads/2024/photo-1.jpg");
    expect(screen.getByTestId("lightbox-counter")).toHaveTextContent("2 / 3");
  });

  it("navigates to previous image when clicking prev", () => {
    render(
      <Lightbox images={makeImages(3)} initialIndex={2} onClose={() => {}} />,
    );
    fireEvent.click(screen.getByTestId("lightbox-prev"));
    const img = screen.getByTestId("lightbox-image");
    expect(img).toHaveAttribute("src", "/uploads/2024/photo-1.jpg");
  });

  it("calls onClose when clicking close button", () => {
    const onClose = vi.fn();
    render(
      <Lightbox images={makeImages(1)} initialIndex={0} onClose={onClose} />,
    );
    fireEvent.click(screen.getByTestId("lightbox-close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when clicking the overlay background", () => {
    const onClose = vi.fn();
    render(
      <Lightbox images={makeImages(1)} initialIndex={0} onClose={onClose} />,
    );
    fireEvent.click(screen.getByTestId("lightbox"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when pressing Escape key", () => {
    const onClose = vi.fn();
    render(
      <Lightbox images={makeImages(1)} initialIndex={0} onClose={onClose} />,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("navigates with arrow keys", () => {
    render(
      <Lightbox images={makeImages(3)} initialIndex={1} onClose={() => {}} />,
    );
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(screen.getByTestId("lightbox-image")).toHaveAttribute(
      "src",
      "/uploads/2024/photo-2.jpg",
    );
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(screen.getByTestId("lightbox-image")).toHaveAttribute(
      "src",
      "/uploads/2024/photo-1.jpg",
    );
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(screen.getByTestId("lightbox-image")).toHaveAttribute(
      "src",
      "/uploads/2024/photo-0.jpg",
    );
  });

  it("does not navigate past boundaries with arrow keys", () => {
    render(
      <Lightbox images={makeImages(2)} initialIndex={0} onClose={() => {}} />,
    );
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(screen.getByTestId("lightbox-image")).toHaveAttribute(
      "src",
      "/uploads/2024/photo-0.jpg",
    );
  });

  it("prevents body scrolling when open", () => {
    const { unmount } = render(
      <Lightbox images={makeImages(1)} initialIndex={0} onClose={() => {}} />,
    );
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});
