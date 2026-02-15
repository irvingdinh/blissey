import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import { EmojiPicker } from "@/components/EmojiPicker";
import type { Reaction } from "@/lib/types";

interface ReactionBarProps {
  reactions: Reaction[];
  reactableType: "post" | "comment";
  reactableId: string;
}

export function ReactionBar({
  reactions,
  reactableType,
  reactableId,
}: ReactionBarProps) {
  const queryClient = useQueryClient();

  const addReaction = useMutation({
    mutationFn: async (emoji: string) => {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactableType, reactableId, emoji }),
      });
      if (!res.ok) throw new Error("Failed to add reaction");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });

  const removeReaction = useMutation({
    mutationFn: async (reactionId: string) => {
      const res = await fetch(`/api/reactions/${reactionId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove reaction");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });

  const handleToggle = (reaction: Reaction) => {
    // Toggle off: remove the first reaction ID for this emoji
    removeReaction.mutate(reaction.ids[0]);
  };

  const handleAdd = (emoji: string) => {
    addReaction.mutate(emoji);
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1"
      data-testid="reaction-bar"
    >
      {reactions.map((r) => (
        <button
          key={r.emoji}
          className="badge badge-ghost hover:badge-primary gap-1 cursor-pointer text-sm transition-colors"
          onClick={() => handleToggle(r)}
          data-testid="reaction-badge"
          title={`Remove ${r.emoji} reaction`}
        >
          {r.emoji} {r.count}
        </button>
      ))}

      <PickerToggle onAdd={handleAdd} />
    </div>
  );
}

function PickerToggle({ onAdd }: { onAdd: (emoji: string) => void }) {
  const [showPicker, setShowPicker] = useState(false);
  const [openAbove, setOpenAbove] = useState(true);
  const btnRef = useRef<HTMLButtonElement>(null);

  const updatePosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    // Picker is ~280px tall; open above if there's room, else below
    setOpenAbove(rect.top > 300);
  }, []);

  useEffect(() => {
    if (showPicker) updatePosition();
  }, [showPicker, updatePosition]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        className="btn btn-ghost btn-sm btn-circle"
        onClick={() => setShowPicker((v) => !v)}
        data-testid="add-reaction-btn"
        title="Add reaction"
        aria-label="Add reaction"
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
            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {showPicker && (
        <div
          className={`absolute left-0 z-50 ${openAbove ? "bottom-full mb-1" : "top-full mt-1"}`}
        >
          <EmojiPicker onSelect={onAdd} onClose={() => setShowPicker(false)} />
        </div>
      )}
    </div>
  );
}
