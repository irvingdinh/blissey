import { fireEvent, render, screen } from "@testing-library/react";

import { GalleryCarousel } from "./GalleryCarousel";

function makeImages(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `img-${i}`,
    fileName: `photo-${i}.jpg`,
    filePath: `2024/photo-${i}.jpg`,
    thumbnailPath: `thumbnails/photo-${i}.jpg`,
  }));
}

describe("GalleryCarousel", () => {
  it("renders nothing when images array is empty", () => {
    const { container } = render(
      <GalleryCarousel images={[]} onImageClick={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders a single image without arrows or dots", () => {
    render(<GalleryCarousel images={makeImages(1)} onImageClick={() => {}} />);
    expect(screen.getByTestId("gallery-carousel")).toBeInTheDocument();
    expect(screen.getByTestId("gallery-image-0")).toBeInTheDocument();
    expect(screen.queryByTestId("carousel-prev")).not.toBeInTheDocument();
    expect(screen.queryByTestId("carousel-next")).not.toBeInTheDocument();
    expect(screen.queryByTestId("carousel-dots")).not.toBeInTheDocument();
  });

  it("renders multiple images with dot indicators", () => {
    render(<GalleryCarousel images={makeImages(3)} onImageClick={() => {}} />);
    expect(screen.getByTestId("carousel-dots")).toBeInTheDocument();
    expect(screen.getByTestId("carousel-dot-0")).toBeInTheDocument();
    expect(screen.getByTestId("carousel-dot-1")).toBeInTheDocument();
    expect(screen.getByTestId("carousel-dot-2")).toBeInTheDocument();
  });

  it("shows next arrow but not prev arrow on first image", () => {
    render(<GalleryCarousel images={makeImages(3)} onImageClick={() => {}} />);
    expect(screen.queryByTestId("carousel-prev")).not.toBeInTheDocument();
    expect(screen.getByTestId("carousel-next")).toBeInTheDocument();
  });

  it("navigates to next image when clicking next arrow", () => {
    render(<GalleryCarousel images={makeImages(3)} onImageClick={() => {}} />);
    fireEvent.click(screen.getByTestId("carousel-next"));
    // Now on image 1, both arrows should be visible
    expect(screen.getByTestId("carousel-prev")).toBeInTheDocument();
    expect(screen.getByTestId("carousel-next")).toBeInTheDocument();
  });

  it("navigates to last image and hides next arrow", () => {
    render(<GalleryCarousel images={makeImages(2)} onImageClick={() => {}} />);
    fireEvent.click(screen.getByTestId("carousel-next"));
    // Now on last image
    expect(screen.getByTestId("carousel-prev")).toBeInTheDocument();
    expect(screen.queryByTestId("carousel-next")).not.toBeInTheDocument();
  });

  it("navigates back using prev arrow", () => {
    render(<GalleryCarousel images={makeImages(3)} onImageClick={() => {}} />);
    fireEvent.click(screen.getByTestId("carousel-next")); // go to 1
    fireEvent.click(screen.getByTestId("carousel-prev")); // back to 0
    expect(screen.queryByTestId("carousel-prev")).not.toBeInTheDocument();
    expect(screen.getByTestId("carousel-next")).toBeInTheDocument();
  });

  it("navigates when clicking a dot indicator", () => {
    render(<GalleryCarousel images={makeImages(3)} onImageClick={() => {}} />);
    fireEvent.click(screen.getByTestId("carousel-dot-2"));
    // Now on last image
    expect(screen.getByTestId("carousel-prev")).toBeInTheDocument();
    expect(screen.queryByTestId("carousel-next")).not.toBeInTheDocument();
  });

  it("calls onImageClick when clicking an image", () => {
    const onImageClick = vi.fn();
    render(
      <GalleryCarousel images={makeImages(3)} onImageClick={onImageClick} />,
    );
    fireEvent.click(screen.getByTestId("gallery-image-0"));
    expect(onImageClick).toHaveBeenCalledWith(0);
  });

  it("uses thumbnailPath for image src when available", () => {
    render(<GalleryCarousel images={makeImages(1)} onImageClick={() => {}} />);
    const img = screen.getByTestId("gallery-image-0");
    expect(img).toHaveAttribute("src", "/uploads/thumbnails/photo-0.jpg");
  });

  it("falls back to filePath when thumbnailPath is null", () => {
    const images = [
      {
        id: "img-0",
        fileName: "photo.jpg",
        filePath: "2024/photo.jpg",
        thumbnailPath: null,
      },
    ];
    render(<GalleryCarousel images={images} onImageClick={() => {}} />);
    const img = screen.getByTestId("gallery-image-0");
    expect(img).toHaveAttribute("src", "/uploads/2024/photo.jpg");
  });
});
