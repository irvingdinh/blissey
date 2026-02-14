import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { unlinkSync } from 'fs';
import { Repository } from 'typeorm';

import { AttachmentEntity } from '../../core/entities/attachment.entity';
import { DirectoryService } from '../../core/services';
import { UpsertAttachmentRequestDto } from '../dtos';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(AttachmentEntity)
    private readonly attachmentRepository: Repository<AttachmentEntity>,
    private readonly directoryService: DirectoryService,
  ) {}

  async create(
    file: Express.Multer.File,
    dto: UpsertAttachmentRequestDto,
  ): Promise<AttachmentEntity> {
    const uploadsDir = this.directoryService.dataDir('uploads');
    const relativePath = file.path.replace(uploadsDir, '').replace(/^\//, '');

    const attachment = this.attachmentRepository.create({
      attachableType: dto.attachable_type,
      attachableId: dto.attachable_id,
      category: dto.category,
      fileName: file.originalname,
      filePath: relativePath,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    return this.attachmentRepository.save(attachment);
  }

  async remove(id: string): Promise<void> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
    });
    if (!attachment)
      throw new NotFoundException(`Attachment "${id}" not found`);

    const uploadsDir = this.directoryService.dataDir('uploads');

    try {
      unlinkSync(`${uploadsDir}/${attachment.filePath}`);
    } catch {
      // File may already be deleted from disk
    }

    if (attachment.thumbnailPath) {
      try {
        unlinkSync(`${uploadsDir}/${attachment.thumbnailPath}`);
      } catch {
        // Thumbnail may already be deleted from disk
      }
    }

    await this.attachmentRepository.remove(attachment);
  }

  async findByAttachable(
    type: string,
    id: string,
  ): Promise<AttachmentEntity[]> {
    return this.attachmentRepository.find({
      where: { attachableType: type, attachableId: id },
      order: { createdAt: 'ASC' },
    });
  }
}
