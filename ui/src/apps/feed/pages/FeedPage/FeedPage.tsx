import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Pagination } from "@/components/Pagination";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Post } from "@/lib/types";

interface FeedResponse {
  data: Post[];
  total: number;
  page: number;
  totalPages: number;
}

export default function FeedPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery<FeedResponse>({
    queryKey: ["posts", page],
    queryFn: async () => {
      const res = await fetch(`/api/posts?page=${page}&limit=10`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Failed to load posts.</p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => refetch()}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No posts yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.data.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {data.totalPages > 1 && (
        <div className="flex justify-center pt-4">
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
