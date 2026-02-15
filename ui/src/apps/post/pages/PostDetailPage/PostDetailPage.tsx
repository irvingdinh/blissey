import type { OutputData } from "@editorjs/editorjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { BlockRenderer } from "@/components/BlockRenderer";
import type { EditorWrapperHandle } from "@/components/EditorWrapper";
import EditorWrapper from "@/components/EditorWrapper";
import { PostCard } from "@/components/PostCard";
import { ReactionBar } from "@/components/ReactionBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { parseBlocks } from "@/lib/parse-blocks";
import { relativeTime } from "@/lib/relative-time";
import type { Comment, Post } from "@/lib/types";

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const commentsRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorWrapperHandle>(null);

  const [showComposer, setShowComposer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch post
  const {
    data: post,
    isLoading: postLoading,
    isError: postError,
  } = useQuery<Post>({
    queryKey: ["post", id],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${id}`);
      if (!res.ok) throw new Error("Failed to fetch post");
      return res.json();
    },
    enabled: !!id,
    retry: false,
  });

  // Fetch comments
  const { data: comments, isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ["comments", id],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${id}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
    enabled: !!id,
  });

  // Auto-scroll to #comments
  useEffect(() => {
    if (
      location.hash === "#comments" &&
      commentsRef.current &&
      !commentsLoading
    ) {
      commentsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.hash, commentsLoading]);

  // Submit new comment
  const handleSubmitComment = useCallback(async () => {
    if (!editorRef.current || !id) return;
    setSubmitting(true);

    try {
      const data = await editorRef.current.getData();
      if (data.blocks.length === 0) {
        setSubmitting(false);
        return;
      }

      const content = JSON.stringify(data);
      const res = await fetch(`/api/posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        await queryClient.invalidateQueries({ queryKey: ["comments", id] });
        await queryClient.invalidateQueries({ queryKey: ["post", id] });
        setShowComposer(false);
      }
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  }, [id, queryClient]);

  // Update comment
  const updateCommentMutation = useMutation({
    mutationFn: async ({
      commentId,
      content,
    }: {
      commentId: string;
      content: string;
    }) => {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to update comment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
      setEditingCommentId(null);
    },
  });

  // Delete comment
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete comment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
      queryClient.invalidateQueries({ queryKey: ["post", id] });
      setDeleteConfirmId(null);
    },
  });

  if (postLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  if (!post || postError) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Post not found.</p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-4"
          onClick={() => navigate("/")}
        >
          Back to feed
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Full post */}
      <PostCard post={post} />

      {/* Comments section */}
      <div ref={commentsRef} id="comments" data-testid="comments-section">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Comments {comments && comments.length > 0 && `(${comments.length})`}
          </h2>
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowComposer(true)}
            data-testid="write-comment-btn"
          >
            Write comment
          </Button>
        </div>

        {commentsLoading && (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-sm" />
          </div>
        )}

        {!commentsLoading && comments && comments.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No comments yet.
          </p>
        )}

        {!commentsLoading && comments && comments.length > 0 && (
          <div className="mt-4 space-y-4">
            {comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                isEditing={editingCommentId === comment.id}
                isDeleting={deleteConfirmId === comment.id}
                onEdit={() => setEditingCommentId(comment.id)}
                onCancelEdit={() => setEditingCommentId(null)}
                onSaveEdit={(content) =>
                  updateCommentMutation.mutate({
                    commentId: comment.id,
                    content,
                  })
                }
                onDelete={() => setDeleteConfirmId(comment.id)}
                onConfirmDelete={() => deleteCommentMutation.mutate(comment.id)}
                onCancelDelete={() => setDeleteConfirmId(null)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Comment composer (fullscreen editor) */}
      {showComposer && (
        <EditorWrapper
          ref={editorRef}
          fullscreen
          attachableType="comment"
          attachableId=""
          toolbar={{
            left: (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComposer(false)}
              >
                Cancel
              </Button>
            ),
            right: (
              <Button
                variant="default"
                size="sm"
                onClick={handleSubmitComment}
                disabled={submitting}
                data-testid="submit-comment-btn"
              >
                {submitting ? "Posting..." : "Post comment"}
              </Button>
            ),
          }}
        />
      )}
    </div>
  );
}

// --- CommentCard ---

interface CommentCardProps {
  comment: Comment;
  isEditing: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (content: string) => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

const EMPTY_EDITOR_DATA: OutputData = { time: 0, blocks: [] };

function parseEditorData(content: string): OutputData {
  try {
    return JSON.parse(content);
  } catch {
    return EMPTY_EDITOR_DATA;
  }
}

function CommentCard({
  comment,
  isEditing,
  isDeleting,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
}: CommentCardProps) {
  const blocks = parseBlocks(comment.content);
  const editEditorRef = useRef<EditorWrapperHandle>(null);
  const initialData = useMemo(
    () => parseEditorData(comment.content),
    [comment.content],
  );

  const handleSave = async () => {
    if (!editEditorRef.current) return;
    const data = await editEditorRef.current.getData();
    if (data.blocks.length === 0) return;
    onSaveEdit(JSON.stringify(data));
  };

  if (isEditing) {
    return (
      <div data-testid={`comment-${comment.id}`}>
        <EditorWrapper
          ref={editEditorRef}
          fullscreen
          initialData={initialData}
          attachableType="comment"
          attachableId={comment.id}
          toolbar={{
            left: (
              <Button variant="ghost" size="sm" onClick={onCancelEdit}>
                Cancel
              </Button>
            ),
            right: (
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                data-testid="save-comment-btn"
              >
                Save
              </Button>
            ),
          }}
        />
      </div>
    );
  }

  return (
    <Card data-testid={`comment-${comment.id}`}>
      <CardContent className="p-4">
        {/* Comment content */}
        <div className="prose max-w-none text-sm">
          <BlockRenderer blocks={blocks} />
        </div>

        {/* Reactions */}
        <div className="mt-2">
          <ReactionBar
            reactions={comment.reactions}
            reactableType="comment"
            reactableId={comment.id}
          />
        </div>

        {/* Footer: actions + timestamp */}
        <div className="mt-2 flex items-center gap-2 border-t border-border pt-2">
          <Button
            variant="ghost"
            size="xs"
            className="text-xs"
            onClick={onEdit}
            title="Edit comment"
            aria-label="Edit comment"
            data-testid="edit-comment-btn"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </Button>

          {isDeleting ? (
            <div className="flex items-center gap-1">
              <Button
                variant="destructive"
                size="xs"
                className="text-xs"
                onClick={onConfirmDelete}
                data-testid="confirm-delete-comment-btn"
              >
                Confirm
              </Button>
              <Button
                variant="ghost"
                size="xs"
                className="text-xs"
                onClick={onCancelDelete}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="xs"
              className="text-xs"
              onClick={onDelete}
              title="Delete comment"
              aria-label="Delete comment"
              data-testid="delete-comment-btn"
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
            </Button>
          )}

          <span className="ml-auto text-xs text-muted-foreground">
            {relativeTime(comment.createdAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
