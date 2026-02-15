/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unused-vars */
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
    LessThan: jest
      .fn()
      .mockImplementation((val) => ({ _type: 'lessThan', _value: val })),
  };
});

import { NotFoundException } from '@nestjs/common';

import { DraftEntity } from '../../core/entities/draft.entity';
import { DraftsService } from './drafts.service';

describe('DraftsService', () => {
  let service: DraftsService;

  const mockDraftRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockAttachmentRepository = {
    find: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DraftsService(
      mockDraftRepository as any,
      mockAttachmentRepository as any,
    );
  });

  describe('findAll', () => {
    it('should return all drafts ordered by createdAt DESC', async () => {
      const drafts = [new DraftEntity(), new DraftEntity()];
      mockDraftRepository.find.mockResolvedValue(drafts);

      const result = await service.findAll();

      expect(mockDraftRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(drafts);
    });

    it('should return empty array when no drafts exist', async () => {
      mockDraftRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a draft with its attachments', async () => {
      const draft = new DraftEntity();
      Object.assign(draft, {
        id: 'draft-1',
        content: '{"blocks":[]}',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockDraftRepository.findOne.mockResolvedValue(draft);
      mockAttachmentRepository.find.mockResolvedValue([
        { id: 'att-1', fileName: 'photo.jpg' },
      ]);

      const result = await service.findOne('draft-1');

      expect(result.id).toBe('draft-1');
      expect(result.attachments).toEqual([
        { id: 'att-1', fileName: 'photo.jpg' },
      ]);
      expect(mockAttachmentRepository.find).toHaveBeenCalledWith({
        where: { attachableType: 'draft', attachableId: 'draft-1' },
        order: { createdAt: 'ASC' },
      });
    });

    it('should throw NotFoundException when draft does not exist', async () => {
      mockDraftRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create and save a new draft', async () => {
      const draft = new DraftEntity();
      Object.assign(draft, { id: 'draft-1', content: '{"blocks":[]}' });

      mockDraftRepository.create.mockReturnValue(draft);
      mockDraftRepository.save.mockResolvedValue(draft);

      const result = await service.create({ content: '{"blocks":[]}' });

      expect(mockDraftRepository.create).toHaveBeenCalledWith({
        content: '{"blocks":[]}',
      });
      expect(mockDraftRepository.save).toHaveBeenCalledWith(draft);
      expect(result).toBe(draft);
    });
  });

  describe('update', () => {
    it('should update the content of an existing draft', async () => {
      const draft = new DraftEntity();
      Object.assign(draft, { id: 'draft-1', content: '{"blocks":[]}' });

      mockDraftRepository.findOne.mockResolvedValue(draft);
      mockDraftRepository.save.mockResolvedValue({
        ...draft,
        content: '{"blocks":[{"type":"paragraph"}]}',
      });

      const result = await service.update('draft-1', {
        content: '{"blocks":[{"type":"paragraph"}]}',
      });

      expect(draft.content).toBe('{"blocks":[{"type":"paragraph"}]}');
      expect(mockDraftRepository.save).toHaveBeenCalledWith(draft);
      expect(result.content).toBe('{"blocks":[{"type":"paragraph"}]}');
    });

    it('should throw NotFoundException when draft does not exist', async () => {
      mockDraftRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { content: 'new' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an existing draft', async () => {
      const draft = new DraftEntity();
      Object.assign(draft, { id: 'draft-1' });

      mockDraftRepository.findOne.mockResolvedValue(draft);
      mockDraftRepository.remove.mockResolvedValue(draft);

      await service.remove('draft-1');

      expect(mockDraftRepository.remove).toHaveBeenCalledWith(draft);
    });

    it('should throw NotFoundException when draft does not exist', async () => {
      mockDraftRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeOlderThan', () => {
    it('should remove drafts older than the specified number of days', async () => {
      const oldDrafts = [new DraftEntity(), new DraftEntity()];
      mockDraftRepository.find.mockResolvedValue(oldDrafts);
      mockDraftRepository.remove.mockResolvedValue(oldDrafts);

      const result = await service.removeOlderThan(3);

      expect(mockDraftRepository.find).toHaveBeenCalled();
      expect(mockDraftRepository.remove).toHaveBeenCalledWith(oldDrafts);
      expect(result).toBe(2);
    });

    it('should return 0 when no old drafts exist', async () => {
      mockDraftRepository.find.mockResolvedValue([]);

      const result = await service.removeOlderThan(3);

      expect(mockDraftRepository.remove).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });
  });
});
