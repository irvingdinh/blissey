import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";

import type { Reaction } from "@/lib/types";

import { ReactionBar } from "./ReactionBar";

function renderReactionBar(
  reactions: Reaction[] = [],
  reactableType: "post" | "comment" = "post",
  reactableId = "post-1",
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReactionBar
        reactions={reactions}
        reactableType={reactableType}
        reactableId={reactableId}
      />
    </QueryClientProvider>,
  );
}

describe("ReactionBar", () => {
  it("renders reaction bar container", () => {
    renderReactionBar();
    expect(screen.getByTestId("reaction-bar")).toBeInTheDocument();
  });

  it("renders add reaction button", () => {
    renderReactionBar();
    expect(screen.getByTestId("add-reaction-btn")).toBeInTheDocument();
  });

  it("renders reaction badges with emoji and count", () => {
    const reactions: Reaction[] = [
      { emoji: "👍", count: 3, ids: ["r1", "r2", "r3"] },
      { emoji: "❤️", count: 1, ids: ["r4"] },
    ];
    renderReactionBar(reactions);
    const badges = screen.getAllByTestId("reaction-badge");
    expect(badges).toHaveLength(2);
    expect(badges[0].textContent).toContain("👍");
    expect(badges[0].textContent).toContain("3");
    expect(badges[1].textContent).toContain("❤️");
    expect(badges[1].textContent).toContain("1");
  });

  it("does not render badges when no reactions exist", () => {
    renderReactionBar([]);
    expect(screen.queryByTestId("reaction-badge")).not.toBeInTheDocument();
  });

  it("opens emoji picker when add button is clicked", () => {
    renderReactionBar();
    expect(screen.queryByTestId("emoji-picker")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("add-reaction-btn"));
    expect(screen.getByTestId("emoji-picker")).toBeInTheDocument();
  });

  it("closes emoji picker when add button is toggled", () => {
    renderReactionBar();
    fireEvent.click(screen.getByTestId("add-reaction-btn"));
    expect(screen.getByTestId("emoji-picker")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("add-reaction-btn"));
    expect(screen.queryByTestId("emoji-picker")).not.toBeInTheDocument();
  });
});
