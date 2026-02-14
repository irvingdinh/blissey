import { DraftEntity } from './draft.entity';

describe('DraftEntity', () => {
  it('should have all expected columns', () => {
    const draft = new DraftEntity();
    expect(draft).toHaveProperty('id');
    expect(draft).toHaveProperty('content');
    expect(draft).toHaveProperty('createdAt');
    expect(draft).toHaveProperty('updatedAt');
  });

  it('should not have a deletedAt column', () => {
    const draft = new DraftEntity();
    expect(draft).not.toHaveProperty('deletedAt');
  });

  it('should generate a nanoid on generateId when id is not set', () => {
    const draft = new DraftEntity();
    draft.generateId();
    expect(draft.id).toBeDefined();
    expect(typeof draft.id).toBe('string');
    expect(draft.id.length).toBe(21);
  });

  it('should not overwrite an existing id on generateId', () => {
    const draft = new DraftEntity();
    draft.id = 'custom-id';
    draft.generateId();
    expect(draft.id).toBe('custom-id');
  });
});
