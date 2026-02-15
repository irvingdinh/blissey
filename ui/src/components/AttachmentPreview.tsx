import { Button } from "@/components/ui/button";
import type { Attachment } from "@/lib/types";

interface AttachmentPreviewProps {
  galleryAttachments: Attachment[];
  fileAttachments: Attachment[];
  onRemove: (attachment: Attachment) => void;
}

export function AttachmentPreview({
  galleryAttachments,
  fileAttachments,
  onRemove,
}: AttachmentPreviewProps) {
  if (galleryAttachments.length === 0 && fileAttachments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 border-t border-border px-4 py-2">
      {/* Gallery thumbnails */}
      {galleryAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="gallery-preview">
          {galleryAttachments.map((att) => (
            <div key={att.id} className="group relative">
              <img
                src={`/uploads/${att.thumbnailPath ?? att.filePath}`}
                alt={att.fileName}
                className="h-16 w-16 rounded object-cover"
                loading="lazy"
                decoding="async"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                onClick={() => onRemove(att)}
                data-testid={`remove-gallery-${att.id}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
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
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* File attachments */}
      {fileAttachments.length > 0 && (
        <div className="space-y-1" data-testid="file-preview">
          {fileAttachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 rounded bg-muted px-2 py-1 text-sm"
            >
              <span className="truncate">{att.fileName}</span>
              <span className="shrink-0 text-muted-foreground">
                {(att.fileSize / 1024).toFixed(0)} KB
              </span>
              <Button
                variant="ghost"
                size="xs"
                className="ml-auto"
                onClick={() => onRemove(att)}
                data-testid={`remove-file-${att.id}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
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
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
