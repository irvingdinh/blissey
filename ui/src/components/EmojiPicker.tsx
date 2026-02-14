import { useEffect, useRef, useState } from "react";

const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
  {
    name: "Smileys",
    emojis: [
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
      "😅",
      "🤣",
      "😂",
      "🙂",
      "😊",
      "😇",
      "🥰",
      "😍",
      "🤩",
      "😘",
      "😋",
      "😛",
      "😜",
      "🤪",
      "😎",
      "🤗",
      "🤔",
      "🤫",
      "🤭",
      "😐",
      "😑",
      "😶",
      "😏",
      "😒",
      "🙄",
      "😬",
      "😮‍💨",
      "😌",
      "😔",
      "😪",
      "🤤",
      "😴",
      "😷",
      "🤒",
      "🤕",
      "🤢",
      "🤮",
      "🥵",
      "🥶",
      "🥴",
      "😵",
      "🤯",
      "🥳",
    ],
  },
  {
    name: "Gestures",
    emojis: [
      "👍",
      "👎",
      "👊",
      "✊",
      "🤛",
      "🤜",
      "🤞",
      "✌️",
      "🤟",
      "🤘",
      "👌",
      "🤌",
      "👈",
      "👉",
      "👆",
      "👇",
      "☝️",
      "👋",
      "🤚",
      "🖐️",
      "✋",
      "👏",
      "🙌",
      "🤲",
      "🙏",
      "💪",
    ],
  },
  {
    name: "Hearts",
    emojis: [
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "🤎",
      "💔",
      "❤️‍🔥",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
      "💘",
      "💝",
    ],
  },
  {
    name: "Objects",
    emojis: [
      "🔥",
      "⭐",
      "🌟",
      "✨",
      "💯",
      "💥",
      "🎉",
      "🎊",
      "🏆",
      "🥇",
      "🎯",
      "🚀",
      "💡",
      "📌",
      "🔔",
      "🎵",
      "🎶",
      "💎",
      "👑",
      "🧲",
    ],
  },
  {
    name: "Animals",
    emojis: [
      "🐶",
      "🐱",
      "🐭",
      "🐹",
      "🐰",
      "🦊",
      "🐻",
      "🐼",
      "🐨",
      "🐯",
      "🦁",
      "🐮",
      "🐷",
      "🐸",
      "🐵",
      "🐔",
      "🐧",
      "🐦",
      "🦋",
      "🐝",
    ],
  },
  {
    name: "Food",
    emojis: [
      "🍎",
      "🍐",
      "🍊",
      "🍋",
      "🍌",
      "🍉",
      "🍇",
      "🍓",
      "🫐",
      "🍒",
      "🍑",
      "🥭",
      "🍕",
      "🍔",
      "🌮",
      "🍣",
      "🍩",
      "🍰",
      "☕",
      "🍺",
    ],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const filteredCategories = search
    ? EMOJI_CATEGORIES.map((cat) => ({
        ...cat,
        emojis: cat.emojis.filter((e) => e.includes(search)),
      })).filter((cat) => cat.emojis.length > 0)
    : EMOJI_CATEGORIES;

  return (
    <div
      ref={containerRef}
      className="bg-base-100 border-base-300 w-72 rounded-lg border shadow-lg"
      data-testid="emoji-picker"
    >
      {/* Search */}
      <div className="border-base-300 border-b p-2">
        <input
          ref={inputRef}
          type="text"
          className="input input-sm input-bordered w-full"
          placeholder="Search emoji..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="emoji-search"
        />
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="border-base-300 flex gap-1 overflow-x-auto border-b px-2 py-1">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button
              key={cat.name}
              className={`btn btn-ghost btn-xs shrink-0 ${i === activeCategory ? "btn-active" : ""}`}
              onClick={() => setActiveCategory(i)}
              data-testid={`emoji-category-${cat.name}`}
            >
              {cat.emojis[0]}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div className="max-h-48 overflow-y-auto p-2">
        {(search ? filteredCategories : [EMOJI_CATEGORIES[activeCategory]]).map(
          (cat) => (
            <div key={cat.name}>
              {search && (
                <div className="text-base-content/50 mb-1 text-xs">
                  {cat.name}
                </div>
              )}
              <div className="grid grid-cols-8 gap-0.5">
                {cat.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    className="btn btn-ghost btn-sm h-8 min-h-0 w-8 p-0 text-lg"
                    onClick={() => {
                      onSelect(emoji);
                      onClose();
                    }}
                    data-testid="emoji-option"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ),
        )}
        {filteredCategories.length === 0 && (
          <p className="text-base-content/50 py-4 text-center text-sm">
            No emoji found
          </p>
        )}
      </div>
    </div>
  );
}

export { EMOJI_CATEGORIES };
