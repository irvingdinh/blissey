import type { OutputBlockData } from "@editorjs/editorjs";

export function parseBlocks(content: string): OutputBlockData[] {
  try {
    return JSON.parse(content)?.blocks ?? [];
  } catch {
    return [];
  }
}
