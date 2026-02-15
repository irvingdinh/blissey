import type { OutputData } from "@editorjs/editorjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";

import type { EditorWrapperHandle } from "@/components/EditorWrapper";
import EditorWrapper from "@/components/EditorWrapper";

interface Attachment {
  id: string;
  category: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  thumbnailPath: string | null;
}

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editorRef = useRef<EditorWrapperHandle>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState<OutputData | undefined>(
    undefined,
  );
  const [galleryAttachments, setGalleryAttachments] = useState<Attachment[]>(
    [],
  );
  const [fileAttachments, setFileAttachments] = useState<Attachment[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  }, []);

  // Fetch post data on mount
  useEffect(() => {
    if (!id) return;

    async function fetchPost() {
      try {
        const res = await fetch(`/api/posts/${id}`);
        if (!res.ok) {
          showToast("Failed to load post");
          return;
        }
        const post = await res.json();

        const content: OutputData = JSON.parse(post.content);
        setInitialData(content);

        const attachments: Attachment[] = post.attachments ?? [];
        setGalleryAttachments(
          attachments.filter((a: Attachment) => a.category === "gallery"),
        );
        setFileAttachments(
          attachments.filter((a: Attachment) => a.category === "attachment"),
        );
      } catch {
        showToast("Failed to load post");
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [id, showToast]);

  // Upload gallery image
  const handleGalleryUpload = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = async () => {
      if (!input.files || !id) return;

      for (const file of Array.from(input.files)) {
        const form = new FormData();
        form.append("file", file);
        form.append("attachable_type", "post");
        form.append("attachable_id", id);
        form.append("category", "gallery");

        try {
          const res = await fetch("/api/attachments", {
            method: "POST",
            body: form,
          });
          if (res.ok) {
            const attachment: Attachment = await res.json();
            setGalleryAttachments((prev) => [...prev, attachment]);
          }
        } catch {
          // Silent fail
        }
      }
    };
    input.click();
  }, [id]);

  // Upload file attachment (audio/video)
  const handleFileUpload = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*,video/*";
    input.multiple = true;
    input.onchange = async () => {
      if (!input.files || !id) return;

      for (const file of Array.from(input.files)) {
        const form = new FormData();
        form.append("file", file);
        form.append("attachable_type", "post");
        form.append("attachable_id", id);
        form.append("category", "attachment");

        try {
          const res = await fetch("/api/attachments", {
            method: "POST",
            body: form,
          });
          if (res.ok) {
            const attachment: Attachment = await res.json();
            setFileAttachments((prev) => [...prev, attachment]);
          }
        } catch {
          // Silent fail
        }
      }
    };
    input.click();
  }, [id]);

  // Remove an attachment
  const removeAttachment = useCallback(async (attachment: Attachment) => {
    try {
      await fetch(`/api/attachments/${attachment.id}`, { method: "DELETE" });
      if (attachment.category === "gallery") {
        setGalleryAttachments((prev) =>
          prev.filter((a) => a.id !== attachment.id),
        );
      } else {
        setFileAttachments((prev) =>
          prev.filter((a) => a.id !== attachment.id),
        );
      }
    } catch {
      // Silent fail
    }
  }, []);

  // Save post
  const handleSave = useCallback(async () => {
    if (!editorRef.current || !id) return;
    setSaving(true);

    try {
      const data = await editorRef.current.getData();
      if (data.blocks.length === 0) {
        showToast("Cannot save empty post");
        setSaving(false);
        return;
      }

      const content = JSON.stringify(data);

      const res = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        showToast("Failed to save");
        setSaving(false);
        return;
      }

      navigate(`/posts/${id}`);
    } catch {
      showToast("Failed to save");
    } finally {
      setSaving(false);
    }
  }, [id, navigate, showToast]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  return (
    <>
      <EditorWrapper
        ref={editorRef}
        initialData={initialData}
        fullscreen
        attachableType="post"
        attachableId={id ?? ""}
        toolbar={{
          left: (
            <div className="flex items-center gap-2">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate(-1)}
                data-testid="back-btn"
              >
                Back
              </button>
            </div>
          ),
          right: (
            <div className="flex items-center gap-1">
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleGalleryUpload}
                title="Add gallery images"
                data-testid="gallery-upload-btn"
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
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleFileUpload}
                title="Add audio/video"
                data-testid="file-upload-btn"
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
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSave}
                disabled={saving}
                data-testid="save-btn"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          ),
          bottom: (galleryAttachments.length > 0 ||
            fileAttachments.length > 0) && (
            <div className="space-y-2 border-t border-base-300 px-4 py-2">
              {/* Gallery thumbnails */}
              {galleryAttachments.length > 0 && (
                <div
                  className="flex flex-wrap gap-2"
                  data-testid="gallery-preview"
                >
                  {galleryAttachments.map((att) => (
                    <div key={att.id} className="group relative">
                      <img
                        src={`/uploads/${att.thumbnailPath ?? att.filePath}`}
                        alt={att.fileName}
                        className="h-16 w-16 rounded object-cover"
                      />
                      <button
                        className="btn btn-circle btn-error btn-xs absolute -right-1 -top-1 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => removeAttachment(att)}
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
                      </button>
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
                      className="flex items-center gap-2 rounded bg-base-200 px-2 py-1 text-sm"
                    >
                      <span className="truncate">{att.fileName}</span>
                      <span className="shrink-0 text-base-content/50">
                        {(att.fileSize / 1024).toFixed(0)} KB
                      </span>
                      <button
                        className="btn btn-ghost btn-xs ml-auto"
                        onClick={() => removeAttachment(att)}
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
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ),
        }}
      />

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 z-[70] -translate-x-1/2">
          <div className="alert shadow-lg">
            <span className="text-sm">{toast}</span>
          </div>
        </div>
      )}
    </>
  );
}
