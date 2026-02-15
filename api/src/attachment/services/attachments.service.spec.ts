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

jest.mock('fs', () => ({
  unlinkSync: jest.fn(),
}));

import { NotFoundException } from '@nestjs/common';
import { unlinkSync } from 'fs';

import { AttachmentEntity } from '../../core/entities/attachment.entity';
import { AttachmentsService } from './attachments.service';
import { ATTACHMENT_CREATED_EVENT } from './thumbnail.service';

describe('AttachmentsService', () => {
  let service: AttachmentsService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockDirectoryService = {
    dataDir: jest.fn().mockReturnValue('/data/uploads'),
    ensureDataDir: jest.fn().mockReturnValue('/data/uploads'),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AttachmentsService(
      mockRepository as any,
      mockDirectoryService as any,
      mockEventEmitter as any,
    );
  });

  describe('create', () => {
    it('should create an attachment record from an uploaded file', async () => {
      const file = {
        originalname: 'photo.jpg',
        path: '/data/uploads/abc123.jpg',
        size: 12345,
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const dto = {
        attachable_type: 'post',
        attachable_id: 'post-1',
        category: 'gallery',
      };

      const entity = new AttachmentEntity();
      Object.assign(entity, {
        id: 'att-1',
        attachableType: 'post',
        attachableId: 'post-1',
        category: 'gallery',
        fileName: 'photo.jpg',
        filePath: 'abc123.jpg',
        fileSize: 12345,
        mimeType: 'image/jpeg',
      });

      mockRepository.create.mockReturnValue(entity);
      mockRepository.save.mockResolvedValue(entity);

      const result = await service.create(file, dto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        attachableType: 'post',
        attachableId: 'post-1',
        category: 'gallery',
        fileName: 'photo.jpg',
        filePath: 'abc123.jpg',
        fileSize: 12345,
        mimeType: 'image/jpeg',
      });
      expect(mockRepository.save).toHaveBeenCalledWith(entity);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        ATTACHMENT_CREATED_EVENT,
        { attachmentId: 'att-1' },
      );
      expect(result).toBe(entity);
    });
  });

  describe('update', () => {
    it('should update attachment ownership', async () => {
      const attachment = new AttachmentEntity();
      Object.assign(attachment, {
        id: 'att-1',
        attachableType: 'draft',
        attachableId: 'draft-1',
      });

      const updated = new AttachmentEntity();
      Object.assign(updated, {
        id: 'att-1',
        attachableType: 'post',
        attachableId: 'post-1',
      });

      mockRepository.findOne.mockResolvedValue(attachment);
      mockRepository.save.mockResolvedValue(updated);

      const result = await service.update('att-1', {
        attachable_type: 'post',
        attachable_id: 'post-1',
      });

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'att-1' },
      });
      expect(attachment.attachableType).toBe('post');
      expect(attachment.attachableId).toBe('post-1');
      expect(mockRepository.save).toHaveBeenCalledWith(attachment);
      expect(result).toBe(updated);
    });

    it('should throw NotFoundException if attachment does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', {
          attachable_type: 'post',
          attachable_id: 'post-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete the attachment record and file from disk', async () => {
      const attachment = new AttachmentEntity();
      Object.assign(attachment, {
        id: 'att-1',
        filePath: 'abc123.jpg',
        thumbnailPath: null,
      });

      mockRepository.findOne.mockResolvedValue(attachment);
      mockRepository.remove.mockResolvedValue(undefined);

      await service.remove('att-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'att-1' },
      });
      expect(unlinkSync).toHaveBeenCalledWith('/data/uploads/abc123.jpg');
      expect(mockRepository.remove).toHaveBeenCalledWith(attachment);
    });

    it('should also delete thumbnail if it exists', async () => {
      const attachment = new AttachmentEntity();
      Object.assign(attachment, {
        id: 'att-1',
        filePath: 'abc123.jpg',
        thumbnailPath: 'thumbnails/abc123.jpg',
      });

      mockRepository.findOne.mockResolvedValue(attachment);
      mockRepository.remove.mockResolvedValue(undefined);

      await service.remove('att-1');

      expect(unlinkSync).toHaveBeenCalledWith('/data/uploads/abc123.jpg');
      expect(unlinkSync).toHaveBeenCalledWith(
        '/data/uploads/thumbnails/abc123.jpg',
      );
    });

    it('should throw NotFoundException if attachment does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByAttachable', () => {
    it('should find attachments by type and id', async () => {
      const attachments = [new AttachmentEntity(), new AttachmentEntity()];
      mockRepository.find.mockResolvedValue(attachments);

      const result = await service.findByAttachable('post', 'post-1');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { attachableType: 'post', attachableId: 'post-1' },
        order: { createdAt: 'ASC' },
      });
      expect(result).toBe(attachments);
    });

    it('should return empty array when no attachments found', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findByAttachable('post', 'nonexistent');

      expect(result).toEqual([]);
    });
  });
});
