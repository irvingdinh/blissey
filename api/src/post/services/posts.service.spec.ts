/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment */
jest.mock('typeorm', () => {
  const decoratorFactory = () => () => jest.fn();
  return {
    Entity: () => (target: object) => target,
    PrimaryColumn: decoratorFactory(),
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
    IsNull: jest.fn().mockReturnValue('IS_NULL'),
    Not: jest.fn().mockImplementation((val) => ({ _type: 'not', _value: val })),
  };
});

import { NotFoundException } from '@nestjs/common';

import { PostEntity } from '../../core/entities/post.entity';
import { PostsService } from './posts.service';

describe('PostsService', () => {
  let service: PostsService;

  const mockPostRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    softRemove: jest.fn(),
    count: jest.fn(),
  };

  const mockCommentRepository = {
    count: jest.fn(),
  };

  const mockReactionRepository = {
    find: jest.fn(),
  };

  const mockAttachmentRepository = {
    find: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PostsService(
      mockPostRepository as any,
      mockCommentRepository as any,
      mockReactionRepository as any,
      mockAttachmentRepository as any,
    );
  });

  describe('findAll', () => {
    beforeEach(() => {
      mockReactionRepository.find.mockResolvedValue([]);
      mockCommentRepository.count.mockResolvedValue(0);
      mockAttachmentRepository.find.mockResolvedValue([]);
    });

    it('should return paginated posts ordered by createdAt DESC', async () => {
      const post1 = new PostEntity();
      Object.assign(post1, { id: 'p1' });
      const post2 = new PostEntity();
      Object.assign(post2, { id: 'p2' });
      mockPostRepository.findAndCount.mockResolvedValue([[post1, post2], 15]);

      const result = await service.findAll(2, 10);

      expect(mockPostRepository.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        skip: 10,
        take: 10,
      });
      expect(result.total).toBe(15);
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].reactions).toEqual([]);
      expect(result.data[0].commentCount).toBe(0);
      expect(result.data[0].attachments).toEqual([]);
    });

    it('should include reactions, commentCount, and attachments per post', async () => {
      const post = new PostEntity();
      Object.assign(post, { id: 'p1' });
      mockPostRepository.findAndCount.mockResolvedValue([[post], 1]);
      mockReactionRepository.find.mockResolvedValue([
        { id: 'r1', emoji: '👍', reactableType: 'post', reactableId: 'p1' },
        { id: 'r2', emoji: '👍', reactableType: 'post', reactableId: 'p1' },
      ]);
      mockCommentRepository.count.mockResolvedValue(5);
      mockAttachmentRepository.find.mockResolvedValue([
        { id: 'a1', category: 'gallery' },
      ]);

      const result = await service.findAll(1, 10);

      expect(result.data[0].reactions).toEqual([
        { emoji: '👍', count: 2, ids: ['r1', 'r2'] },
      ]);
      expect(result.data[0].commentCount).toBe(5);
      expect(result.data[0].attachments).toEqual([
        { id: 'a1', category: 'gallery' },
      ]);
    });

    it('should return empty result when no posts exist', async () => {
      mockPostRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll(1, 10);

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });
    });
  });

  describe('findOne', () => {
    it('should return a post with reactions, comment count, and attachments', async () => {
      const post = new PostEntity();
      Object.assign(post, {
        id: 'post-1',
        content: '{"blocks":[]}',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockPostRepository.findOne.mockResolvedValue(post);
      mockReactionRepository.find.mockResolvedValue([
        { id: 'r1', emoji: '👍', reactableType: 'post', reactableId: 'post-1' },
        { id: 'r2', emoji: '👍', reactableType: 'post', reactableId: 'post-1' },
        { id: 'r3', emoji: '❤️', reactableType: 'post', reactableId: 'post-1' },
      ]);
      mockCommentRepository.count.mockResolvedValue(3);
      mockAttachmentRepository.find.mockResolvedValue([]);

      const result = await service.findOne('post-1');

      expect(result.id).toBe('post-1');
      expect(result.reactions).toEqual([
        { emoji: '👍', count: 2, ids: ['r1', 'r2'] },
        { emoji: '❤️', count: 1, ids: ['r3'] },
      ]);
      expect(result.commentCount).toBe(3);
      expect(result.attachments).toEqual([]);
    });

    it('should throw NotFoundException when post does not exist', async () => {
      mockPostRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create and save a new post', async () => {
      const post = new PostEntity();
      Object.assign(post, { id: 'post-1', content: '{"blocks":[]}' });

      mockPostRepository.create.mockReturnValue(post);
      mockPostRepository.save.mockResolvedValue(post);

      const result = await service.create({ content: '{"blocks":[]}' });

      expect(mockPostRepository.create).toHaveBeenCalledWith({
        content: '{"blocks":[]}',
      });
      expect(mockPostRepository.save).toHaveBeenCalledWith(post);
      expect(result).toBe(post);
    });
  });

  describe('update', () => {
    it('should update the content of an existing post', async () => {
      const post = new PostEntity();
      Object.assign(post, { id: 'post-1', content: '{"blocks":[]}' });

      mockPostRepository.findOne.mockResolvedValue(post);
      mockPostRepository.save.mockResolvedValue({
        ...post,
        content: '{"blocks":[{"type":"paragraph"}]}',
      });

      const result = await service.update('post-1', {
        content: '{"blocks":[{"type":"paragraph"}]}',
      });

      expect(post.content).toBe('{"blocks":[{"type":"paragraph"}]}');
      expect(mockPostRepository.save).toHaveBeenCalledWith(post);
      expect(result.content).toBe('{"blocks":[{"type":"paragraph"}]}');
    });

    it('should throw NotFoundException when post does not exist', async () => {
      mockPostRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { content: 'new' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('should soft delete an existing post', async () => {
      const post = new PostEntity();
      Object.assign(post, { id: 'post-1' });

      mockPostRepository.findOne.mockResolvedValue(post);
      mockPostRepository.softRemove.mockResolvedValue(post);

      await service.softDelete('post-1');

      expect(mockPostRepository.softRemove).toHaveBeenCalledWith(post);
    });

    it('should throw NotFoundException when post does not exist', async () => {
      mockPostRepository.findOne.mockResolvedValue(null);

      await expect(service.softDelete('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findTrashed', () => {
    it('should return soft-deleted posts with daysRemaining', async () => {
      const now = new Date();
      const deletedYesterday = new Date(
        now.getTime() - 1 * 24 * 60 * 60 * 1000,
      );

      const post = new PostEntity();
      Object.assign(post, {
        id: 'post-1',
        content: '{}',
        deletedAt: deletedYesterday,
      });

      mockPostRepository.find.mockResolvedValue([post]);

      const result = await service.findTrashed();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('post-1');
      expect(result[0].daysRemaining).toBe(2);
    });

    it('should return 0 daysRemaining when past 3 days', async () => {
      const now = new Date();
      const deletedLongAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      const post = new PostEntity();
      Object.assign(post, {
        id: 'post-1',
        content: '{}',
        deletedAt: deletedLongAgo,
      });

      mockPostRepository.find.mockResolvedValue([post]);

      const result = await service.findTrashed();

      expect(result[0].daysRemaining).toBe(0);
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted post by clearing deletedAt', async () => {
      const post = new PostEntity();
      Object.assign(post, {
        id: 'post-1',
        deletedAt: new Date(),
      });

      mockPostRepository.findOne.mockResolvedValue(post);
      mockPostRepository.save.mockResolvedValue({ ...post, deletedAt: null });

      const result = await service.restore('post-1');

      expect(post.deletedAt).toBeNull();
      expect(mockPostRepository.save).toHaveBeenCalledWith(post);
      expect(result.deletedAt).toBeNull();
    });

    it('should throw NotFoundException when post does not exist', async () => {
      mockPostRepository.findOne.mockResolvedValue(null);

      await expect(service.restore('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when post is not in trash', async () => {
      const post = new PostEntity();
      Object.assign(post, { id: 'post-1', deletedAt: null });

      mockPostRepository.findOne.mockResolvedValue(post);

      await expect(service.restore('post-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
