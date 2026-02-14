import type { OutputBlockData } from "@editorjs/editorjs";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useParams } from "react-router";

import { BlockRenderer } from "@/components/BlockRenderer";

interface Post {
  id: string;
  content: string;
  createdAt: string;
}

function parseBlocks(content: string): OutputBlockData[] {
  try {
    return JSON.parse(content)?.blocks ?? [];
  } catch {
    return [];
  }
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: post, isLoading } = useQuery<Post>({
    queryKey: ["post", id],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${id}`);
      if (!res.ok) throw new Error("Failed to fetch post");
      return res.json();
    },
    enabled: !!id,
  });

  const blocks = useMemo(() => (post ? parseBlocks(post.content) : []), [post]);

  if (isLoading) {
    return <div className="flex justify-center py-12">Loading...</div>;
  }

  if (!post) {
    return <div className="py-12 text-center">Post not found.</div>;
  }

  return (
    <div>
      <BlockRenderer blocks={blocks} />
    </div>
  );
}
