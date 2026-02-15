import type { OutputData } from "@editorjs/editorjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { AttachmentPreview } from "@/components/AttachmentPreview";
import type { EditorWrapperHandle } from "@/components/EditorWrapper";
import EditorWrapper from "@/components/EditorWrapper";
import { Button } from "@/components/ui/button";
import type { Attachment } from "@/lib/types";
import { useToast } from "@/lib/use-toast";

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
  const toast = useToast();

  // Fetch post data on mount
  useEffect(() => {
    if (!id) return;

    async function fetchPost() {
      try {
        const res = await fetch(`/api/posts/${id}`);
        if (!res.ok) {
          toast.show("Failed to load post");
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
        toast.show("Failed to load post");
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [id, toast]);

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
          } else {
            toast.show("Failed to upload image");
          }
        } catch {
          toast.show("Failed to upload image");
        }
      }
    };
    input.click();
  }, [id, toast]);

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
          } else {
            toast.show("Failed to upload file");
          }
        } catch {
          toast.show("Failed to upload file");
        }
      }
    };
    input.click();
  }, [id, toast]);

  // Remove an attachment
  const removeAttachment = useCallback(
    async (attachment: Attachment) => {
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
        toast.show("Failed to remove attachment");
      }
    },
    [toast],
  );

  // Save post
  const handleSave = useCallback(async () => {
    if (!editorRef.current || !id) return;
    setSaving(true);

    try {
      const data = await editorRef.current.getData();
      if (data.blocks.length === 0) {
        toast.show("Cannot save empty post");
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
        toast.show("Failed to save");
        setSaving(false);
        return;
      }

      navigate(`/posts/${id}`);
    } catch {
      toast.show("Failed to save");
    } finally {
      setSaving(false);
    }
  }, [id, navigate, toast]);

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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                data-testid="back-btn"
              >
                Back
              </Button>
            </div>
          ),
          right: (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGalleryUpload}
                title="Add gallery images"
                aria-label="Add gallery images"
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
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFileUpload}
                title="Add audio/video"
                aria-label="Add audio/video"
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
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                data-testid="save-btn"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          ),
          bottom: (galleryAttachments.length > 0 ||
            fileAttachments.length > 0) && (
            <AttachmentPreview
              galleryAttachments={galleryAttachments}
              fileAttachments={fileAttachments}
              onRemove={removeAttachment}
            />
          ),
        }}
      />

      {/* Toast notification */}
      {toast.message && (
        <div className="fixed bottom-4 left-1/2 z-[70] -translate-x-1/2">
          <div className="alert shadow-lg">
            <span className="text-sm">{toast.message}</span>
          </div>
        </div>
      )}
    </>
  );
}
