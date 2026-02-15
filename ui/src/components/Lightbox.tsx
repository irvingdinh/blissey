import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface LightboxImage {
  id: string;
  fileName: string;
  filePath: string;
}

interface LightboxProps {
  images: LightboxImage[];
  initialIndex: number;
  onClose: () => void;
}

export function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [current, setCurrent] = useState(initialIndex);
  const overlayRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchDelta = useRef(0);

  const count = images.length;

  const goTo = useCallback(
    (index: number) => {
      setCurrent(Math.max(0, Math.min(index, count - 1)));
    },
    [count],
  );

  const prev = useCallback(() => goTo(current - 1), [current, goTo]);
  const next = useCallback(() => goTo(current + 1), [current, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          prev();
          break;
        case "ArrowRight":
          next();
          break;
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, prev, next]);

  // Prevent body scroll while lightbox is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Click outside to close
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        onClose();
      }
    },
    [onClose],
  );

  // Touch handlers for swipe
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    touchDelta.current = 0;
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
  }, [next, prev]);

  const image = images[current];
  if (!image) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={handleOverlayClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      data-testid="lightbox"
    >
      {/* Close button */}
      <button
        className="btn btn-circle btn-ghost btn-sm absolute right-4 top-4 text-white"
        onClick={onClose}
        aria-label="Close lightbox"
        data-testid="lightbox-close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Counter */}
      {count > 1 && (
        <div
          className="absolute left-4 top-4 text-sm text-white/70"
          data-testid="lightbox-counter"
        >
          {current + 1} / {count}
        </div>
      )}

      {/* Left arrow */}
      {current > 0 && (
        <button
          className="btn btn-circle btn-ghost absolute left-4 top-1/2 -translate-y-1/2 text-white"
          onClick={prev}
          aria-label="Previous image"
          data-testid="lightbox-prev"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
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
        </button>
      )}

      {/* Image */}
      <img
        src={`/uploads/${image.filePath}`}
        alt={image.fileName}
        className={cn(
          "max-h-[90vh] max-w-[90vw] object-contain",
          "select-none",
        )}
        draggable={false}
        decoding="async"
        data-testid="lightbox-image"
      />

      {/* Right arrow */}
      {current < count - 1 && (
        <button
          className="btn btn-circle btn-ghost absolute right-4 top-1/2 -translate-y-1/2 text-white"
          onClick={next}
          aria-label="Next image"
          data-testid="lightbox-next"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
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
        </button>
      )}
    </div>
  );
}
