import { ReactionEntity } from './reaction.entity';

describe('ReactionEntity', () => {
  it('should have all expected columns', () => {
    const reaction = new ReactionEntity();
    expect(reaction).toHaveProperty('id');
    expect(reaction).toHaveProperty('reactableType');
    expect(reaction).toHaveProperty('reactableId');
    expect(reaction).toHaveProperty('emoji');
    expect(reaction).toHaveProperty('createdAt');
  });

  it('should not have updatedAt or deletedAt columns', () => {
    const reaction = new ReactionEntity();
    expect(reaction).not.toHaveProperty('updatedAt');
    expect(reaction).not.toHaveProperty('deletedAt');
  });

  it('should generate a nanoid on generateId when id is not set', () => {
    const reaction = new ReactionEntity();
    reaction.generateId();
    expect(reaction.id).toBeDefined();
    expect(typeof reaction.id).toBe('string');
    expect(reaction.id.length).toBe(21);
  });

  it('should not overwrite an existing id on generateId', () => {
    const reaction = new ReactionEntity();
    reaction.id = 'custom-id';
    reaction.generateId();
    expect(reaction.id).toBe('custom-id');
  });
});
