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

import { BadRequestException, NotFoundException } from '@nestjs/common';

import { ReactionEntity } from '../../core/entities/reaction.entity';
import { ReactionsService } from './reactions.service';

describe('ReactionsService', () => {
  let service: ReactionsService;

  const mockReactionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockPostRepository = {
    findOne: jest.fn(),
  };

  const mockCommentRepository = {
    findOne: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReactionsService(
      mockReactionRepository as any,
      mockPostRepository as any,
      mockCommentRepository as any,
    );
  });

  describe('create', () => {
    it('should create a reaction on a post', async () => {
      mockPostRepository.findOne.mockResolvedValue({ id: 'post-1' });

      const reaction = new ReactionEntity();
      Object.assign(reaction, {
        id: 'reaction-1',
        reactableType: 'post',
        reactableId: 'post-1',
        emoji: '👍',
      });

      mockReactionRepository.create.mockReturnValue(reaction);
      mockReactionRepository.save.mockResolvedValue(reaction);

      const result = await service.create({
        reactableType: 'post',
        reactableId: 'post-1',
        emoji: '👍',
      });

      expect(mockPostRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'post-1' },
      });
      expect(mockReactionRepository.create).toHaveBeenCalledWith({
        reactableType: 'post',
        reactableId: 'post-1',
        emoji: '👍',
      });
      expect(mockReactionRepository.save).toHaveBeenCalledWith(reaction);
      expect(result).toBe(reaction);
    });

    it('should create a reaction on a comment', async () => {
      mockCommentRepository.findOne.mockResolvedValue({ id: 'comment-1' });

      const reaction = new ReactionEntity();
      Object.assign(reaction, {
        id: 'reaction-1',
        reactableType: 'comment',
        reactableId: 'comment-1',
        emoji: '❤️',
      });

      mockReactionRepository.create.mockReturnValue(reaction);
      mockReactionRepository.save.mockResolvedValue(reaction);

      const result = await service.create({
        reactableType: 'comment',
        reactableId: 'comment-1',
        emoji: '❤️',
      });

      expect(mockCommentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
      });
      expect(mockReactionRepository.create).toHaveBeenCalledWith({
        reactableType: 'comment',
        reactableId: 'comment-1',
        emoji: '❤️',
      });
      expect(result).toBe(reaction);
    });

    it('should throw NotFoundException when post does not exist', async () => {
      mockPostRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          reactableType: 'post',
          reactableId: 'nonexistent',
          emoji: '👍',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when comment does not exist', async () => {
      mockCommentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          reactableType: 'comment',
          reactableId: 'nonexistent',
          emoji: '👍',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid reactable type', async () => {
      await expect(
        service.create({
          reactableType: 'invalid',
          reactableId: 'some-id',
          emoji: '👍',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should remove an existing reaction', async () => {
      const reaction = new ReactionEntity();
      Object.assign(reaction, { id: 'reaction-1' });

      mockReactionRepository.findOne.mockResolvedValue(reaction);
      mockReactionRepository.remove.mockResolvedValue(reaction);

      await service.remove('reaction-1');

      expect(mockReactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'reaction-1' },
      });
      expect(mockReactionRepository.remove).toHaveBeenCalledWith(reaction);
    });

    it('should throw NotFoundException when reaction does not exist', async () => {
      mockReactionRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByReactable', () => {
    it('should return reactions for a given reactable', async () => {
      const reactions = [
        { id: 'r1', reactableType: 'post', reactableId: 'post-1', emoji: '👍' },
        { id: 'r2', reactableType: 'post', reactableId: 'post-1', emoji: '❤️' },
      ];

      mockReactionRepository.find.mockResolvedValue(reactions);

      const result = await service.findByReactable('post', 'post-1');

      expect(mockReactionRepository.find).toHaveBeenCalledWith({
        where: { reactableType: 'post', reactableId: 'post-1' },
      });
      expect(result).toBe(reactions);
    });

    it('should return empty array when no reactions exist', async () => {
      mockReactionRepository.find.mockResolvedValue([]);

      const result = await service.findByReactable('post', 'post-1');

      expect(result).toEqual([]);
    });
  });
});
