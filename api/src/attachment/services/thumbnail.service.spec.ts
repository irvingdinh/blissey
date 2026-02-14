/* eslint-disable @typescript-eslint/no-unsafe-argument */
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
  };
});

jest.mock('sharp', () => {
  const mockSharp = jest.fn().mockReturnValue({
    resize: jest.fn().mockReturnValue({
      toFile: jest.fn().mockResolvedValue({}),
    }),
  });
  return { __esModule: true, default: mockSharp };
});

import sharp from 'sharp';

import { AttachmentEntity } from '../../core/entities/attachment.entity';
import { ThumbnailService } from './thumbnail.service';

describe('ThumbnailService', () => {
  let service: ThumbnailService;

  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockDirectoryService = {
    dataDir: jest.fn().mockReturnValue('/data/uploads'),
    ensureDataDir: jest.fn().mockReturnValue('/data/uploads/thumbnails'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ThumbnailService(
      mockRepository as any,
      mockDirectoryService as any,
    );
  });

  describe('handleAttachmentCreated', () => {
    it('should generate thumbnail for image attachments', async () => {
      const attachment = new AttachmentEntity();
      Object.assign(attachment, {
        id: 'att-1',
        filePath: 'abc123.jpg',
        mimeType: 'image/jpeg',
        thumbnailPath: null,
      });

      mockRepository.findOne.mockResolvedValue(attachment);
      mockRepository.save.mockResolvedValue(attachment);

      await service.handleAttachmentCreated({ attachmentId: 'att-1' });

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'att-1' },
      });
      expect(sharp).toHaveBeenCalledWith('/data/uploads/abc123.jpg');
      expect(mockDirectoryService.ensureDataDir).toHaveBeenCalledWith(
        'uploads',
        'thumbnails',
      );
      expect(attachment.thumbnailPath).toBe('thumbnails/abc123.jpg');
      expect(mockRepository.save).toHaveBeenCalledWith(attachment);
    });

    it('should skip non-image attachments', async () => {
      const attachment = new AttachmentEntity();
      Object.assign(attachment, {
        id: 'att-2',
        filePath: 'doc.pdf',
        mimeType: 'application/pdf',
      });

      mockRepository.findOne.mockResolvedValue(attachment);

      await service.handleAttachmentCreated({ attachmentId: 'att-2' });

      expect(sharp).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should skip if attachment is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await service.handleAttachmentCreated({
        attachmentId: 'nonexistent',
      });

      expect(sharp).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle sharp errors gracefully', async () => {
      const attachment = new AttachmentEntity();
      Object.assign(attachment, {
        id: 'att-3',
        filePath: 'corrupt.jpg',
        mimeType: 'image/jpeg',
        thumbnailPath: null,
      });

      mockRepository.findOne.mockResolvedValue(attachment);

      (sharp as unknown as jest.Mock).mockReturnValueOnce({
        resize: jest.fn().mockReturnValue({
          toFile: jest.fn().mockRejectedValue(new Error('corrupt image')),
        }),
      });

      await service.handleAttachmentCreated({ attachmentId: 'att-3' });

      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(attachment.thumbnailPath).toBeNull();
    });
  });

  describe('generateThumbnail', () => {
    it('should resize image to 400px width and save thumbnail', async () => {
      const attachment = new AttachmentEntity();
      Object.assign(attachment, {
        id: 'att-4',
        filePath: 'photo.png',
        mimeType: 'image/png',
        thumbnailPath: null,
      });

      const mockToFile = jest.fn().mockResolvedValue({});
      const mockResize = jest.fn().mockReturnValue({ toFile: mockToFile });
      (sharp as unknown as jest.Mock).mockReturnValueOnce({
        resize: mockResize,
      });
      mockRepository.save.mockResolvedValue(attachment);

      await service.generateThumbnail(attachment);

      expect(sharp).toHaveBeenCalledWith('/data/uploads/photo.png');
      expect(mockResize).toHaveBeenCalledWith(400);
      expect(mockToFile).toHaveBeenCalledWith(
        '/data/uploads/thumbnails/photo.png',
      );
      expect(attachment.thumbnailPath).toBe('thumbnails/photo.png');
      expect(mockRepository.save).toHaveBeenCalledWith(attachment);
    });
  });
});
