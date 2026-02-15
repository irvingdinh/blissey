import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { BlockRenderer } from "@/components/BlockRenderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { parseBlocks } from "@/lib/parse-blocks";
import type { TrashedPost } from "@/lib/types";

function previewText(content: string): string {
  const blocks = parseBlocks(content);
  for (const block of blocks) {
    const text = block.data?.text ?? block.data?.caption ?? block.data?.message;
    if (text) {
      const stripped = text.replace(/<[^>]*>/g, "");
      return stripped.length > 120 ? stripped.slice(0, 120) + "..." : stripped;
    }
  }
  return "Empty post";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TrashPage() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [restoredId, setRestoredId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<TrashedPost[]>({
    queryKey: ["trash"],
    queryFn: async () => {
      const res = await fetch("/api/trash");
      if (!res.ok) throw new Error("Failed to fetch trash");
      return res.json();
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/trash/${id}/restore`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to restore post");
    },
    onSuccess: (_data, id) => {
      setRestoredId(id);
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setTimeout(() => setRestoredId(null), 2000);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Trash</h1>

      {/* Success toast */}
      {restoredId && (
        <div className="alert alert-success mb-4" data-testid="restore-toast">
          <span>Post restored successfully.</span>
        </div>
      )}

      {!data || data.length === 0 ? (
        <div className="py-12 text-center" data-testid="trash-empty">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          <p className="text-muted-foreground">Trash is empty.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((post) => {
            const isExpanded = expandedId === post.id;
            const blocks = parseBlocks(post.content);

            return (
              <Card key={post.id} data-testid="trash-item">
                <CardContent className="p-4 sm:p-5">
                  {/* Preview or full content */}
                  {isExpanded ? (
                    <div className="prose max-w-none">
                      <BlockRenderer blocks={blocks} />
                    </div>
                  ) : (
                    <button
                      className="cursor-pointer text-left text-foreground/80"
                      onClick={() => setExpandedId(post.id)}
                      data-testid="trash-preview"
                    >
                      {previewText(post.content)}
                    </button>
                  )}

                  {isExpanded && (
                    <Button
                      variant="ghost"
                      size="xs"
                      className="mt-1 self-start"
                      onClick={() => setExpandedId(null)}
                    >
                      Collapse
                    </Button>
                  )}

                  {/* Meta and actions */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    <span className="text-xs text-muted-foreground">
                      Deleted {formatDate(post.deletedAt)}
                    </span>

                    <span
                      className={`badge badge-sm ${
                        post.daysRemaining <= 1
                          ? "badge-error"
                          : "badge-warning"
                      }`}
                      data-testid="days-remaining"
                    >
                      {post.daysRemaining === 0
                        ? "Expires today"
                        : `${post.daysRemaining} day${post.daysRemaining !== 1 ? "s" : ""} left`}
                    </span>

                    <Button
                      variant="default"
                      size="sm"
                      className="ml-auto"
                      onClick={() => restoreMutation.mutate(post.id)}
                      disabled={restoreMutation.isPending}
                      data-testid="restore-btn"
                    >
                      {restoreMutation.isPending ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        "Restore"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
