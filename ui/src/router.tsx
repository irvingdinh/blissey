import { type ComponentType } from "react";
import { createBrowserRouter } from "react-router";

import AppLayout from "@/components/AppLayout";

const lazy =
  (importFn: () => Promise<{ default: ComponentType }>) =>
  async (): Promise<{ Component: ComponentType }> => {
    const { default: Component } = await importFn();
    return { Component };
  };

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        lazy: lazy(() => import("@/apps/feed/pages/FeedPage/FeedPage")),
      },
      {
        path: "/compose",
        lazy: lazy(
          () => import("@/apps/compose/pages/ComposePage/ComposePage"),
        ),
      },
      {
        path: "/posts/:id",
        lazy: lazy(
          () => import("@/apps/post/pages/PostDetailPage/PostDetailPage"),
        ),
      },
      {
        path: "/posts/:id/edit",
        lazy: lazy(() => import("@/apps/post/pages/EditPostPage/EditPostPage")),
      },
      {
        path: "/trash",
        lazy: lazy(() => import("@/apps/trash/pages/TrashPage/TrashPage")),
      },
    ],
  },
]);
