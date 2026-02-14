import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import sharp from 'sharp';
import { Repository } from 'typeorm';

import { AttachmentEntity } from '../../core/entities/attachment.entity';
import { DirectoryService } from '../../core/services';

export const ATTACHMENT_CREATED_EVENT = 'attachment.created';

export interface AttachmentCreatedPayload {
  attachmentId: string;
}

@Injectable()
export class ThumbnailService {
  private readonly logger = new Logger(ThumbnailService.name);

  constructor(
    @InjectRepository(AttachmentEntity)
    private readonly attachmentRepository: Repository<AttachmentEntity>,
    private readonly directoryService: DirectoryService,
  ) {}

  @OnEvent(ATTACHMENT_CREATED_EVENT, { async: true })
  async handleAttachmentCreated(
    payload: AttachmentCreatedPayload,
  ): Promise<void> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id: payload.attachmentId },
    });

    if (!attachment) return;
    if (!attachment.mimeType.startsWith('image/')) return;

    await this.generateThumbnail(attachment);
  }

  async generateThumbnail(attachment: AttachmentEntity): Promise<void> {
    const uploadsDir = this.directoryService.dataDir('uploads');
    const thumbnailsDir = this.directoryService.ensureDataDir(
      'uploads',
      'thumbnails',
    );

    const sourcePath = `${uploadsDir}/${attachment.filePath}`;
    const thumbnailFileName = attachment.filePath;
    const thumbnailPath = `${thumbnailsDir}/${thumbnailFileName}`;

    try {
      await sharp(sourcePath).resize(400).toFile(thumbnailPath);

      attachment.thumbnailPath = `thumbnails/${thumbnailFileName}`;
      await this.attachmentRepository.save(attachment);
    } catch (error) {
      this.logger.error(
        `Failed to generate thumbnail for attachment ${attachment.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
