import { PostEntity } from './post.entity';

describe('PostEntity', () => {
  it('should have all expected columns', () => {
    const post = new PostEntity();
    expect(post).toHaveProperty('id');
    expect(post).toHaveProperty('content');
    expect(post).toHaveProperty('deletedAt');
    expect(post).toHaveProperty('createdAt');
    expect(post).toHaveProperty('updatedAt');
  });

  it('should default deletedAt to undefined', () => {
    const post = new PostEntity();
    expect(post.deletedAt).toBeUndefined();
  });

  it('should generate a nanoid on generateId when id is not set', () => {
    const post = new PostEntity();
    post.generateId();
    expect(post.id).toBeDefined();
    expect(typeof post.id).toBe('string');
    expect(post.id.length).toBe(21);
  });

  it('should not overwrite an existing id on generateId', () => {
    const post = new PostEntity();
    post.id = 'custom-id';
    post.generateId();
    expect(post.id).toBe('custom-id');
  });
});
