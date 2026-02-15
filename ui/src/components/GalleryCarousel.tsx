import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GalleryImage {
  id: string;
  fileName: string;
  filePath: string;
  thumbnailPath: string | null;
}

interface GalleryCarouselProps {
  images: GalleryImage[];
  onImageClick?: (index: number) => void;
}

export function GalleryCarousel({
  images,
  onImageClick,
}: GalleryCarouselProps) {
  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchDelta = useRef(0);
  const [dragging, setDragging] = useState(false);

  const count = images.length;

  const goTo = useCallback(
    (index: number) => {
      setCurrent(Math.max(0, Math.min(index, count - 1)));
    },
    [count],
  );

  const prev = useCallback(() => goTo(current - 1), [current, goTo]);
  const next = useCallback(() => goTo(current + 1), [current, goTo]);

  // Touch handlers for swipe
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    touchDelta.current = 0;
    setDragging(true);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    touchDelta.current = e.touches[0].clientX - touchStart.current.x;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current) return;
    const threshold = 50;
    if (touchDelta.current < -threshold) {
      next();
    } else if (touchDelta.current > threshold) {
      prev();
    }
    touchStart.current = null;
    touchDelta.current = 0;
    setDragging(false);
  }, [next, prev]);

  // Sync scroll position
  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${current * 100}%)`;
    }
  }, [current]);

  if (count === 0) return null;

  return (
    <div
      className="group relative overflow-hidden rounded-lg"
      data-testid="gallery-carousel"
    >
      {/* Track */}
      <div
        ref={trackRef}
        className={cn(
          "flex",
          !dragging && "transition-transform duration-300 ease-in-out",
        )}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {images.map((img, i) => (
          <div key={img.id} className="w-full shrink-0">
            <img
              src={`/uploads/${img.thumbnailPath ?? img.filePath}`}
              alt={img.fileName}
              className="aspect-video w-full cursor-pointer object-cover"
              loading="lazy"
              decoding="async"
              onClick={() => onImageClick?.(i)}
              data-testid={`gallery-image-${i}`}
            />
          </div>
        ))}
      </div>

      {/* Left arrow — always visible on touch, hover-reveal on desktop */}
      {current > 0 && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full opacity-70 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
          onClick={prev}
          aria-label="Previous image"
          data-testid="carousel-prev"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Button>
      )}

      {/* Right arrow — always visible on touch, hover-reveal on desktop */}
      {current < count - 1 && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full opacity-70 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
          onClick={next}
          aria-label="Next image"
          data-testid="carousel-next"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Button>
      )}

      {/* Dot indicators */}
      {count > 1 && (
        <div
          className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5"
          data-testid="carousel-dots"
        >
          {images.map((_, i) => (
            <button
              key={i}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                i === current ? "bg-foreground" : "bg-foreground/40",
              )}
              onClick={() => goTo(i)}
              aria-label={`Go to image ${i + 1}`}
              data-testid={`carousel-dot-${i}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
