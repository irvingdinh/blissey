import { CommentEntity } from './comment.entity';

describe('CommentEntity', () => {
  it('should have all expected columns', () => {
    const comment = new CommentEntity();
    expect(comment).toHaveProperty('id');
    expect(comment).toHaveProperty('postId');
    expect(comment).toHaveProperty('content');
    expect(comment).toHaveProperty('deletedAt');
    expect(comment).toHaveProperty('createdAt');
    expect(comment).toHaveProperty('updatedAt');
  });

  it('should default deletedAt to undefined', () => {
    const comment = new CommentEntity();
    expect(comment.deletedAt).toBeUndefined();
  });

  it('should generate a nanoid on generateId when id is not set', () => {
    const comment = new CommentEntity();
    comment.generateId();
    expect(comment.id).toBeDefined();
    expect(typeof comment.id).toBe('string');
    expect(comment.id.length).toBe(21);
  });

  it('should not overwrite an existing id on generateId', () => {
    const comment = new CommentEntity();
    comment.id = 'custom-id';
    comment.generateId();
    expect(comment.id).toBe('custom-id');
  });
});
