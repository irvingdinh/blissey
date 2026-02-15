import type { OutputData } from "@editorjs/editorjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import type { EditorWrapperHandle } from "@/components/EditorWrapper";
import EditorWrapper from "@/components/EditorWrapper";
import { relativeTime } from "@/lib/relative-time";
import type { Attachment } from "@/lib/types";

interface Draft {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const EMPTY_CONTENT: OutputData = { time: Date.now(), blocks: [] };

export default function ComposePage() {
  const navigate = useNavigate();
  const editorRef = useRef<EditorWrapperHandle>(null);

  const [draftId, setDraftId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [galleryAttachments, setGalleryAttachments] = useState<Attachment[]>(
    [],
  );
  const [fileAttachments, setFileAttachments] = useState<Attachment[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const draftIdRef = useRef(draftId);
  draftIdRef.current = draftId;

  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show toast with auto-dismiss
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  }, []);

  // Autosave handler
  const autosave = useCallback(async (data: OutputData) => {
    if (data.blocks.length === 0) return;

    const content = JSON.stringify(data);
    setSaving(true);

    try {
      if (draftIdRef.current) {
        await fetch(`/api/drafts/${draftIdRef.current}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
      } else {
        const res = await fetch("/api/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (res.ok) {
          const draft = await res.json();
          setDraftId(draft.id);
        }
      }
    } catch {
      // Silent fail for autosave
    } finally {
      setSaving(false);
    }
  }, []);

  // Debounced onChange
  const handleEditorChange = useCallback(
    (data: OutputData) => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      autosaveTimerRef.current = setTimeout(() => {
        autosave(data);
      }, 300);
    },
    [autosave],
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  // Fetch drafts list
  const fetchDrafts = useCallback(async () => {
    setLoadingDrafts(true);
    try {
      const res = await fetch("/api/drafts");
      if (res.ok) {
        setDrafts(await res.json());
      }
    } catch {
      showToast("Failed to load drafts");
    } finally {
      setLoadingDrafts(false);
    }
  }, [showToast]);

  // Load a draft into the editor
  const loadDraft = useCallback(
    async (draft: Draft) => {
      try {
        const res = await fetch(`/api/drafts/${draft.id}`);
        if (!res.ok) return;
        const fullDraft = await res.json();

        const content: OutputData = JSON.parse(fullDraft.content);
        await editorRef.current?.setData(content);
        setDraftId(draft.id);

        // Load draft attachments
        const attachments: Attachment[] = fullDraft.attachments ?? [];
        setGalleryAttachments(
          attachments.filter((a: Attachment) => a.category === "gallery"),
        );
        setFileAttachments(
          attachments.filter((a: Attachment) => a.category === "attachment"),
        );

        setShowDrafts(false);
        showToast("Draft loaded");
      } catch {
        showToast("Failed to load draft");
      }
    },
    [showToast],
  );

  // Delete a draft from the list
  const deleteDraft = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/drafts/${id}`, { method: "DELETE" });
        setDrafts((prev) => prev.filter((d) => d.id !== id));
        if (draftIdRef.current === id) {
          setDraftId(null);
          setGalleryAttachments([]);
          setFileAttachments([]);
          await editorRef.current?.setData(EMPTY_CONTENT);
        }
      } catch {
        showToast("Failed to delete draft");
      }
    },
    [showToast],
  );

  // Upload gallery image
  const handleGalleryUpload = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = async () => {
      if (!input.files) return;

      // Ensure a draft exists first
      let currentDraftId = draftIdRef.current;
      if (!currentDraftId) {
        const data = await editorRef.current?.getData();
        const content = JSON.stringify(data ?? EMPTY_CONTENT);
        const res = await fetch("/api/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (res.ok) {
          const draft = await res.json();
          currentDraftId = draft.id;
          setDraftId(draft.id);
        }
      }
      if (!currentDraftId) return;

      for (const file of Array.from(input.files)) {
        const form = new FormData();
        form.append("file", file);
        form.append("attachable_type", "draft");
        form.append("attachable_id", currentDraftId);
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
            showToast("Failed to upload image");
          }
        } catch {
          showToast("Failed to upload image");
        }
      }
    };
    input.click();
  }, [showToast]);

  // Upload file attachment (audio/video)
  const handleFileUpload = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*,video/*";
    input.multiple = true;
    input.onchange = async () => {
      if (!input.files) return;

      // Ensure a draft exists first
      let currentDraftId = draftIdRef.current;
      if (!currentDraftId) {
        const data = await editorRef.current?.getData();
        const content = JSON.stringify(data ?? EMPTY_CONTENT);
        const res = await fetch("/api/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (res.ok) {
          const draft = await res.json();
          currentDraftId = draft.id;
          setDraftId(draft.id);
        }
      }
      if (!currentDraftId) return;

      for (const file of Array.from(input.files)) {
        const form = new FormData();
        form.append("file", file);
        form.append("attachable_type", "draft");
        form.append("attachable_id", currentDraftId);
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
            showToast("Failed to upload file");
          }
        } catch {
          showToast("Failed to upload file");
        }
      }
    };
    input.click();
  }, [showToast]);

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
        showToast("Failed to remove attachment");
      }
    },
    [showToast],
  );

  // Publish post
  const handlePublish = useCallback(async () => {
    if (!editorRef.current) return;
    setPublishing(true);

    try {
      const data = await editorRef.current.getData();
      if (data.blocks.length === 0) {
        showToast("Cannot publish empty post");
        setPublishing(false);
        return;
      }

      const content = JSON.stringify(data);

      // Create the post
      const postRes = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!postRes.ok) {
        showToast("Failed to publish");
        setPublishing(false);
        return;
      }

      const post = await postRes.json();

      // Transfer draft attachments to the new post
      const allAttachments = [...galleryAttachments, ...fileAttachments];
      for (const att of allAttachments) {
        await fetch(`/api/attachments/${att.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attachable_type: "post",
            attachable_id: post.id,
          }),
        });
      }

      // Delete the draft
      if (draftIdRef.current) {
        await fetch(`/api/drafts/${draftIdRef.current}`, { method: "DELETE" });
      }

      navigate("/");
    } catch {
      showToast("Failed to publish");
    } finally {
      setPublishing(false);
    }
  }, [galleryAttachments, fileAttachments, navigate, showToast]);

  return (
    <>
      <EditorWrapper
        ref={editorRef}
        fullscreen
        attachableType="draft"
        attachableId={draftId ?? ""}
        onChange={handleEditorChange}
        toolbar={{
          left: (
            <div className="flex items-center gap-2">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate(-1)}
              >
                Back
              </button>
              {saving && (
                <span className="text-xs text-base-content/50">Saving...</span>
              )}
              {!saving && draftId && (
                <span className="text-xs text-base-content/50">
                  Draft saved
                </span>
              )}
            </div>
          ),
          right: (
            <div className="flex items-center gap-1">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  fetchDrafts();
                  setShowDrafts(true);
                }}
                title="Drafts"
                aria-label="Drafts"
                data-testid="drafts-btn"
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </button>
              <button
                className="btn btn-ghost btn-sm"
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
              </button>
              <button
                className="btn btn-ghost btn-sm"
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
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handlePublish}
                disabled={publishing}
                data-testid="publish-btn"
              >
                {publishing ? "Publishing..." : "Publish"}
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
                        className="btn btn-circle btn-error btn-xs absolute -right-1 -top-1 opacity-100 sm:opacity-0 transition-opacity sm:group-hover:opacity-100"
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

      {/* Drafts panel */}
      {showDrafts && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 pt-16"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDrafts(false);
          }}
          data-testid="drafts-panel"
        >
          <div className="mx-4 w-full max-w-sm rounded-lg bg-base-100 shadow-xl sm:max-w-md">
            <div className="flex items-center justify-between border-b border-base-300 px-4 py-3">
              <h3 className="font-semibold">Drafts</h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowDrafts(false)}
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {loadingDrafts && (
                <div className="py-4 text-center text-sm text-base-content/50">
                  Loading...
                </div>
              )}
              {!loadingDrafts && drafts.length === 0 && (
                <div className="py-4 text-center text-sm text-base-content/50">
                  No drafts
                </div>
              )}
              {!loadingDrafts &&
                drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="flex items-center gap-2 rounded px-3 py-2 hover:bg-base-200"
                  >
                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={() => loadDraft(draft)}
                      data-testid={`load-draft-${draft.id}`}
                    >
                      <div className="truncate text-sm">
                        {draftPreview(draft.content)}
                      </div>
                      <div className="text-xs text-base-content/50">
                        {relativeTime(draft.updatedAt)}
                      </div>
                    </button>
                    <button
                      className="btn btn-ghost btn-xs shrink-0"
                      onClick={() => deleteDraft(draft.id)}
                      data-testid={`delete-draft-${draft.id}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

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

function draftPreview(content: string): string {
  try {
    const parsed = JSON.parse(content);
    const blocks = parsed?.blocks ?? [];
    for (const block of blocks) {
      const text =
        block.data?.text || block.data?.caption || block.data?.message || "";
      if (text) {
        const stripped = text.replace(/<[^>]*>/g, "").trim();
        if (stripped) return stripped.slice(0, 60);
      }
    }
    return "Empty draft";
  } catch {
    return "Empty draft";
  }
}
