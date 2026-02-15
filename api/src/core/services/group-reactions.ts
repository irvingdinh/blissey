import { ReactionEntity } from '../entities/reaction.entity';

export interface GroupedReaction {
  emoji: string;
  count: number;
  ids: string[];
}

export function groupReactions(reactions: ReactionEntity[]): GroupedReaction[] {
  const groups: Record<string, GroupedReaction> = {};
  for (const reaction of reactions) {
    if (!groups[reaction.emoji]) {
      groups[reaction.emoji] = {
        emoji: reaction.emoji,
        count: 0,
        ids: [],
      };
    }
    groups[reaction.emoji].count++;
    groups[reaction.emoji].ids.push(reaction.id);
  }
  return Object.values(groups);
}
