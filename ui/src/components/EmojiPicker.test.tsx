import { fireEvent, render, screen } from "@testing-library/react";

import { EMOJI_CATEGORIES, EmojiPicker } from "./EmojiPicker";

describe("EmojiPicker", () => {
  const onSelect = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    onSelect.mockClear();
    onClose.mockClear();
  });

  function renderPicker() {
    return render(<EmojiPicker onSelect={onSelect} onClose={onClose} />);
  }

  it("renders emoji picker container", () => {
    renderPicker();
    expect(screen.getByTestId("emoji-picker")).toBeInTheDocument();
  });

  it("renders search input", () => {
    renderPicker();
    expect(screen.getByTestId("emoji-search")).toBeInTheDocument();
  });

  it("renders category tabs", () => {
    renderPicker();
    for (const cat of EMOJI_CATEGORIES) {
      expect(
        screen.getByTestId(`emoji-category-${cat.name}`),
      ).toBeInTheDocument();
    }
  });

  it("renders emoji buttons for the first category by default", () => {
    renderPicker();
    const emojiButtons = screen.getAllByTestId("emoji-option");
    expect(emojiButtons.length).toBe(EMOJI_CATEGORIES[0].emojis.length);
  });

  it("switches category when tab is clicked", () => {
    renderPicker();
    fireEvent.click(screen.getByTestId("emoji-category-Hearts"));
    const emojiButtons = screen.getAllByTestId("emoji-option");
    expect(emojiButtons.length).toBe(
      EMOJI_CATEGORIES.find((c) => c.name === "Hearts")!.emojis.length,
    );
  });

  it("calls onSelect and onClose when emoji is clicked", () => {
    renderPicker();
    const firstEmoji = screen.getAllByTestId("emoji-option")[0];
    fireEvent.click(firstEmoji);
    expect(onSelect).toHaveBeenCalledWith(EMOJI_CATEGORIES[0].emojis[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on Escape key", () => {
    renderPicker();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on click outside", () => {
    renderPicker();
    fireEvent.mouseDown(document);
    expect(onClose).toHaveBeenCalled();
  });

  it("shows 'No emoji found' when search yields no results", () => {
    renderPicker();
    fireEvent.change(screen.getByTestId("emoji-search"), {
      target: { value: "zzzzzzzzz" },
    });
    expect(screen.getByText("No emoji found")).toBeInTheDocument();
  });

  it("focuses search input on mount", () => {
    renderPicker();
    expect(screen.getByTestId("emoji-search")).toHaveFocus();
  });
});
