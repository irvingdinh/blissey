import type { OutputBlockData } from "@editorjs/editorjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import { BlockRenderer } from "@/components/BlockRenderer";

interface Reaction {
  emoji: string;
  count: number;
}

interface Attachment {
  id: string;
  category: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  thumbnailPath: string | null;
}

export interface Post {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  reactions: Reaction[];
  commentCount: number;
  attachments: Attachment[];
}

function parseBlocks(content: string): OutputBlockData[] {
  try {
    return JSON.parse(content)?.blocks ?? [];
  } catch {
    return [];
  }
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const blocks = useMemo(() => parseBlocks(post.content), [post.content]);
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete post");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const handleShare = async () => {
    const text = post.content;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API may not be available
    }
  };

  const galleryAttachments = post.attachments.filter(
    (a) => a.category === "gallery",
  );
  const fileAttachments = post.attachments.filter(
    (a) => a.category === "attachment",
  );

  return (
    <div className="card bg-base-100 shadow-sm" data-testid="post-card">
      <div className="card-body p-4 sm:p-6">
        {/* Content */}
        <div className="prose max-w-none">
          <BlockRenderer blocks={blocks} />
        </div>

        {/* Gallery thumbnails */}
        {galleryAttachments.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {galleryAttachments.map((att) => (
              <img
                key={att.id}
                src={`/uploads/${att.thumbnailPath ?? att.filePath}`}
                alt={att.fileName}
                className="h-24 w-24 rounded-lg object-cover"
                loading="lazy"
              />
            ))}
          </div>
        )}

        {/* Audio/Video attachments */}
        {fileAttachments.length > 0 && (
          <div className="mt-3 space-y-2">
            {fileAttachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 rounded-lg bg-base-200 p-2 text-sm"
              >
                <span className="truncate">{att.fileName}</span>
                <span className="text-base-content/50 shrink-0">
                  {(att.fileSize / 1024).toFixed(0)} KB
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Reactions */}
        {post.reactions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {post.reactions.map((r) => (
              <span
                key={r.emoji}
                className="badge badge-ghost gap-1 text-sm"
                data-testid="reaction-badge"
              >
                {r.emoji} {r.count}
              </span>
            ))}
          </div>
        )}

        {/* Footer: actions + timestamp */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-base-200 pt-3">
          <Link
            to={`/posts/${post.id}#comments`}
            className="btn btn-ghost btn-sm gap-1 text-xs"
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {post.commentCount}
          </Link>

          <button
            className="btn btn-ghost btn-sm text-xs"
            onClick={handleShare}
            title="Copy content to clipboard"
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
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </button>

          <Link
            to={`/posts/${post.id}/edit`}
            className="btn btn-ghost btn-sm text-xs"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </Link>

          {showDeleteConfirm ? (
            <div className="flex items-center gap-1">
              <button
                className="btn btn-error btn-sm text-xs"
                onClick={() => {
                  deleteMutation.mutate();
                  setShowDeleteConfirm(false);
                }}
                disabled={deleteMutation.isPending}
              >
                Confirm
              </button>
              <button
                className="btn btn-ghost btn-sm text-xs"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="btn btn-ghost btn-sm text-xs"
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete post"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}

          <span className="ml-auto text-xs text-base-content/50">
            {relativeTime(post.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
