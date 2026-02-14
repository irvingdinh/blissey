import { AttachmentEntity } from './attachment.entity';

describe('AttachmentEntity', () => {
  it('should have all expected columns', () => {
    const attachment = new AttachmentEntity();
    expect(attachment).toHaveProperty('id');
    expect(attachment).toHaveProperty('attachableType');
    expect(attachment).toHaveProperty('attachableId');
    expect(attachment).toHaveProperty('category');
    expect(attachment).toHaveProperty('fileName');
    expect(attachment).toHaveProperty('filePath');
    expect(attachment).toHaveProperty('fileSize');
    expect(attachment).toHaveProperty('mimeType');
    expect(attachment).toHaveProperty('thumbnailPath');
    expect(attachment).toHaveProperty('createdAt');
  });

  it('should not have updatedAt or deletedAt columns', () => {
    const attachment = new AttachmentEntity();
    expect(attachment).not.toHaveProperty('updatedAt');
    expect(attachment).not.toHaveProperty('deletedAt');
  });

  it('should default thumbnailPath to undefined', () => {
    const attachment = new AttachmentEntity();
    expect(attachment.thumbnailPath).toBeUndefined();
  });

  it('should generate a nanoid on generateId when id is not set', () => {
    const attachment = new AttachmentEntity();
    attachment.generateId();
    expect(attachment.id).toBeDefined();
    expect(typeof attachment.id).toBe('string');
    expect(attachment.id.length).toBe(21);
  });

  it('should not overwrite an existing id on generateId', () => {
    const attachment = new AttachmentEntity();
    attachment.id = 'custom-id';
    attachment.generateId();
    expect(attachment.id).toBe('custom-id');
  });
});
