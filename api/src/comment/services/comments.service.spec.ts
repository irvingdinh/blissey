/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unused-vars */
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
  };
});

import { NotFoundException } from '@nestjs/common';

import { CommentEntity } from '../../core/entities/comment.entity';
import { CommentsService } from './comments.service';

describe('CommentsService', () => {
  let service: CommentsService;

  const mockCommentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockPostRepository = {
    findOne: jest.fn(),
  };

  const mockReactionRepository = {
    find: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CommentsService(
      mockCommentRepository as any,
      mockPostRepository as any,
      mockReactionRepository as any,
    );
  });

  describe('findByPost', () => {
    it('should return comments with reactions ordered by createdAt ASC', async () => {
      mockPostRepository.findOne.mockResolvedValue({ id: 'post-1' });

      const comment1 = new CommentEntity();
      Object.assign(comment1, {
        id: 'comment-1',
        postId: 'post-1',
        content: '{"blocks":[]}',
        createdAt: new Date('2024-01-01'),
      });

      const comment2 = new CommentEntity();
      Object.assign(comment2, {
        id: 'comment-2',
        postId: 'post-1',
        content: '{"blocks":[]}',
        createdAt: new Date('2024-01-02'),
      });

      mockCommentRepository.find.mockResolvedValue([comment1, comment2]);
      mockReactionRepository.find.mockResolvedValue([
        {
          id: 'r1',
          emoji: '👍',
          reactableType: 'comment',
          reactableId: 'comment-1',
        },
        {
          id: 'r2',
          emoji: '👍',
          reactableType: 'comment',
          reactableId: 'comment-1',
        },
        {
          id: 'r3',
          emoji: '❤️',
          reactableType: 'comment',
          reactableId: 'comment-2',
        },
      ]);

      const result = await service.findByPost('post-1');

      expect(mockCommentRepository.find).toHaveBeenCalledWith({
        where: { postId: 'post-1' },
        order: { createdAt: 'ASC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].reactions).toEqual([
        { emoji: '👍', count: 2, ids: ['r1', 'r2'] },
      ]);
      expect(result[1].reactions).toEqual([
        { emoji: '❤️', count: 1, ids: ['r3'] },
      ]);
    });

    it('should return empty array when post has no comments', async () => {
      mockPostRepository.findOne.mockResolvedValue({ id: 'post-1' });
      mockCommentRepository.find.mockResolvedValue([]);

      const result = await service.findByPost('post-1');

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when post does not exist', async () => {
      mockPostRepository.findOne.mockResolvedValue(null);

      await expect(service.findByPost('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create and save a new comment on a post', async () => {
      mockPostRepository.findOne.mockResolvedValue({ id: 'post-1' });

      const comment = new CommentEntity();
      Object.assign(comment, {
        id: 'comment-1',
        postId: 'post-1',
        content: '{"blocks":[]}',
      });

      mockCommentRepository.create.mockReturnValue(comment);
      mockCommentRepository.save.mockResolvedValue(comment);

      const result = await service.create('post-1', {
        content: '{"blocks":[]}',
      });

      expect(mockCommentRepository.create).toHaveBeenCalledWith({
        postId: 'post-1',
        content: '{"blocks":[]}',
      });
      expect(mockCommentRepository.save).toHaveBeenCalledWith(comment);
      expect(result).toBe(comment);
    });

    it('should throw NotFoundException when post does not exist', async () => {
      mockPostRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('nonexistent', { content: '{}' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update the content of an existing comment', async () => {
      const comment = new CommentEntity();
      Object.assign(comment, {
        id: 'comment-1',
        content: '{"blocks":[]}',
      });

      mockCommentRepository.findOne.mockResolvedValue(comment);
      mockCommentRepository.save.mockResolvedValue({
        ...comment,
        content: '{"blocks":[{"type":"paragraph"}]}',
      });

      const result = await service.update('comment-1', {
        content: '{"blocks":[{"type":"paragraph"}]}',
      });

      expect(comment.content).toBe('{"blocks":[{"type":"paragraph"}]}');
      expect(mockCommentRepository.save).toHaveBeenCalledWith(comment);
      expect(result.content).toBe('{"blocks":[{"type":"paragraph"}]}');
    });

    it('should throw NotFoundException when comment does not exist', async () => {
      mockCommentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { content: 'new' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('should soft delete an existing comment', async () => {
      const comment = new CommentEntity();
      Object.assign(comment, { id: 'comment-1' });

      mockCommentRepository.findOne.mockResolvedValue(comment);
      mockCommentRepository.softRemove.mockResolvedValue(comment);

      await service.softDelete('comment-1');

      expect(mockCommentRepository.softRemove).toHaveBeenCalledWith(comment);
    });

    it('should throw NotFoundException when comment does not exist', async () => {
      mockCommentRepository.findOne.mockResolvedValue(null);

      await expect(service.softDelete('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
