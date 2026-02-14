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
    it('should return paginated posts ordered by createdAt DESC', async () => {
      const posts = [new PostEntity(), new PostEntity()];
      mockPostRepository.findAndCount.mockResolvedValue([posts, 15]);

      const result = await service.findAll(2, 10);

      expect(mockPostRepository.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        skip: 10,
        take: 10,
      });
      expect(result).toEqual({
        data: posts,
        total: 15,
        page: 2,
        totalPages: 2,
      });
    });

    it('should return first page correctly', async () => {
      const posts = [new PostEntity()];
      mockPostRepository.findAndCount.mockResolvedValue([posts, 1]);

      const result = await service.findAll(1, 10);

      expect(mockPostRepository.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        data: posts,
        total: 1,
        page: 1,
        totalPages: 1,
      });
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
        { emoji: '👍', reactableType: 'post', reactableId: 'post-1' },
        { emoji: '👍', reactableType: 'post', reactableId: 'post-1' },
        { emoji: '❤️', reactableType: 'post', reactableId: 'post-1' },
      ]);
      mockCommentRepository.count.mockResolvedValue(3);
      mockAttachmentRepository.find.mockResolvedValue([]);

      const result = await service.findOne('post-1');

      expect(result.id).toBe('post-1');
      expect(result.reactions).toEqual([
        { emoji: '👍', count: 2 },
        { emoji: '❤️', count: 1 },
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
