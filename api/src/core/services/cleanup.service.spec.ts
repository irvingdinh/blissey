/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unused-vars */
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  unlinkSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

jest.mock('typeorm', () => {
  const decoratorFactory = () => () => jest.fn();
  return {
    Entity: () => (target: object) => target,
    Index:
      (..._args: any[]) =>
      (target: any) =>
        target,
    PrimaryColumn: decoratorFactory(),
    In: jest.fn((arr) => arr),
    Column: decoratorFactory(),
    CreateDateColumn: decoratorFactory(),
    UpdateDateColumn: decoratorFactory(),
    DeleteDateColumn: decoratorFactory(),
    BeforeInsert: decoratorFactory(),
    OneToMany: decoratorFactory(),
    ManyToOne: decoratorFactory(),
    JoinColumn: decoratorFactory(),
    Repository: class Repository {},
    AbstractRepository: class AbstractRepository {},
    EntitySchema: class EntitySchema {},
    LessThan: jest
      .fn()
      .mockImplementation((val) => ({ _type: 'lessThan', _value: val })),
    IsNull: jest.fn().mockReturnValue({ _type: 'isNull' }),
    Not: jest.fn().mockImplementation((val) => ({ _type: 'not', _value: val })),
  };
});

import { unlinkSync } from 'fs';

import { AttachmentEntity } from '../entities/attachment.entity';
import { CommentEntity } from '../entities/comment.entity';
import { DraftEntity } from '../entities/draft.entity';
import { PostEntity } from '../entities/post.entity';
import { CleanupService } from './cleanup.service';

describe('CleanupService', () => {
  let service: CleanupService;

  const mockDraftRepository = {
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockPostRepository = {
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockCommentRepository = {
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockReactionRepository = {
    delete: jest.fn(),
  };

  const mockAttachmentRepository = {
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockDirectoryService = {
    dataDir: jest.fn().mockReturnValue('/data/uploads'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CleanupService(
      mockDraftRepository as any,
      mockPostRepository as any,
      mockCommentRepository as any,
      mockReactionRepository as any,
      mockAttachmentRepository as any,
      mockDirectoryService as any,
    );
  });

  describe('cleanupDrafts', () => {
    it('should remove old drafts and their attachments', async () => {
      const oldDraft = new DraftEntity();
      Object.assign(oldDraft, { id: 'draft-1' });

      mockDraftRepository.find.mockResolvedValue([oldDraft]);
      mockDraftRepository.remove.mockResolvedValue([oldDraft]);

      const attachment = new AttachmentEntity();
      Object.assign(attachment, {
        id: 'att-1',
        filePath: 'photo.jpg',
        thumbnailPath: 'thumbnails/photo.jpg',
      });
      mockAttachmentRepository.find.mockResolvedValue([attachment]);
      mockAttachmentRepository.remove.mockResolvedValue([attachment]);

      const result = await service.cleanupDrafts();

      expect(result).toBe(1);
      expect(mockAttachmentRepository.find).toHaveBeenCalledWith({
        where: { attachableType: 'draft', attachableId: 'draft-1' },
      });
      expect(unlinkSync).toHaveBeenCalledWith('/data/uploads/photo.jpg');
      expect(unlinkSync).toHaveBeenCalledWith(
        '/data/uploads/thumbnails/photo.jpg',
      );
      expect(mockAttachmentRepository.remove).toHaveBeenCalledWith([
        attachment,
      ]);
      expect(mockDraftRepository.remove).toHaveBeenCalledWith([oldDraft]);
    });

    it('should return 0 when no old drafts exist', async () => {
      mockDraftRepository.find.mockResolvedValue([]);

      const result = await service.cleanupDrafts();

      expect(result).toBe(0);
      expect(mockDraftRepository.remove).not.toHaveBeenCalled();
      expect(mockAttachmentRepository.find).not.toHaveBeenCalled();
    });

    it('should handle drafts without attachments', async () => {
      const oldDraft = new DraftEntity();
      Object.assign(oldDraft, { id: 'draft-1' });

      mockDraftRepository.find.mockResolvedValue([oldDraft]);
      mockDraftRepository.remove.mockResolvedValue([oldDraft]);
      mockAttachmentRepository.find.mockResolvedValue([]);

      const result = await service.cleanupDrafts();

      expect(result).toBe(1);
      expect(mockAttachmentRepository.remove).not.toHaveBeenCalled();
      expect(mockDraftRepository.remove).toHaveBeenCalledWith([oldDraft]);
    });

    it('should handle multiple old drafts', async () => {
      const draft1 = new DraftEntity();
      Object.assign(draft1, { id: 'draft-1' });
      const draft2 = new DraftEntity();
      Object.assign(draft2, { id: 'draft-2' });

      mockDraftRepository.find.mockResolvedValue([draft1, draft2]);
      mockDraftRepository.remove.mockResolvedValue([draft1, draft2]);
      mockAttachmentRepository.find.mockResolvedValue([]);

      const result = await service.cleanupDrafts();

      expect(result).toBe(2);
      expect(mockAttachmentRepository.find).toHaveBeenCalledTimes(2);
    });

    it('should not fail when file deletion throws', async () => {
      const oldDraft = new DraftEntity();
      Object.assign(oldDraft, { id: 'draft-1' });

      mockDraftRepository.find.mockResolvedValue([oldDraft]);
      mockDraftRepository.remove.mockResolvedValue([oldDraft]);

      const attachment = new AttachmentEntity();
      Object.assign(attachment, {
        id: 'att-1',
        filePath: 'missing.jpg',
        thumbnailPath: null,
      });
      mockAttachmentRepository.find.mockResolvedValue([attachment]);
      mockAttachmentRepository.remove.mockResolvedValue([attachment]);

      (unlinkSync as jest.Mock).mockImplementation(() => {
        throw new Error('ENOENT');
      });

      const result = await service.cleanupDrafts();

      expect(result).toBe(1);
      expect(mockDraftRepository.remove).toHaveBeenCalled();
    });
  });

  describe('cleanupTrashedPosts', () => {
    it('should remove trashed posts with all related data', async () => {
      const post = new PostEntity();
      Object.assign(post, { id: 'post-1', deletedAt: new Date() });

      const comment = new CommentEntity();
      Object.assign(comment, { id: 'comment-1', postId: 'post-1' });

      mockPostRepository.find.mockResolvedValue([post]);
      mockPostRepository.remove.mockResolvedValue([post]);
      mockCommentRepository.find.mockResolvedValue([comment]);
      mockCommentRepository.remove.mockResolvedValue([comment]);
      mockReactionRepository.delete.mockResolvedValue({ affected: 0 });

      // First call for comment attachments, second for post attachments
      mockAttachmentRepository.find
        .mockResolvedValueOnce([]) // comment attachments
        .mockResolvedValueOnce([]); // post attachments

      const result = await service.cleanupTrashedPosts();

      expect(result).toBe(1);
      expect(mockCommentRepository.find).toHaveBeenCalledWith({
        where: { postId: 'post-1' },
        withDeleted: true,
      });
      expect(mockReactionRepository.delete).toHaveBeenCalledWith({
        reactableType: 'comment',
        reactableId: ['comment-1'],
      });
      expect(mockReactionRepository.delete).toHaveBeenCalledWith({
        reactableType: 'post',
        reactableId: 'post-1',
      });
      expect(mockCommentRepository.remove).toHaveBeenCalledWith([comment]);
      expect(mockPostRepository.remove).toHaveBeenCalledWith([post]);
    });

    it('should return 0 when no trashed posts exist', async () => {
      mockPostRepository.find.mockResolvedValue([]);

      const result = await service.cleanupTrashedPosts();

      expect(result).toBe(0);
      expect(mockPostRepository.remove).not.toHaveBeenCalled();
    });

    it('should handle posts without comments', async () => {
      const post = new PostEntity();
      Object.assign(post, { id: 'post-1', deletedAt: new Date() });

      mockPostRepository.find.mockResolvedValue([post]);
      mockPostRepository.remove.mockResolvedValue([post]);
      mockCommentRepository.find.mockResolvedValue([]);
      mockAttachmentRepository.find.mockResolvedValue([]);
      mockReactionRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await service.cleanupTrashedPosts();

      expect(result).toBe(1);
      expect(mockCommentRepository.remove).not.toHaveBeenCalled();
      expect(mockReactionRepository.delete).toHaveBeenCalledWith({
        reactableType: 'post',
        reactableId: 'post-1',
      });
    });

    it('should delete attachment files from disk during post cleanup', async () => {
      const post = new PostEntity();
      Object.assign(post, { id: 'post-1', deletedAt: new Date() });

      const attachment = new AttachmentEntity();
      Object.assign(attachment, {
        id: 'att-1',
        filePath: 'image.jpg',
        thumbnailPath: 'thumbnails/image.jpg',
      });

      mockPostRepository.find.mockResolvedValue([post]);
      mockPostRepository.remove.mockResolvedValue([post]);
      mockCommentRepository.find.mockResolvedValue([]);
      mockReactionRepository.delete.mockResolvedValue({ affected: 0 });

      mockAttachmentRepository.find.mockResolvedValue([attachment]);
      mockAttachmentRepository.remove.mockResolvedValue([attachment]);

      await service.cleanupTrashedPosts();

      expect(unlinkSync).toHaveBeenCalledWith('/data/uploads/image.jpg');
      expect(unlinkSync).toHaveBeenCalledWith(
        '/data/uploads/thumbnails/image.jpg',
      );
      expect(mockAttachmentRepository.remove).toHaveBeenCalledWith([
        attachment,
      ]);
    });

    it('should handle multiple trashed posts', async () => {
      const post1 = new PostEntity();
      Object.assign(post1, { id: 'post-1', deletedAt: new Date() });
      const post2 = new PostEntity();
      Object.assign(post2, { id: 'post-2', deletedAt: new Date() });

      mockPostRepository.find.mockResolvedValue([post1, post2]);
      mockPostRepository.remove.mockResolvedValue([post1, post2]);
      mockCommentRepository.find.mockResolvedValue([]);
      mockAttachmentRepository.find.mockResolvedValue([]);
      mockReactionRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await service.cleanupTrashedPosts();

      expect(result).toBe(2);
      expect(mockCommentRepository.find).toHaveBeenCalledTimes(2);
    });
  });
});
