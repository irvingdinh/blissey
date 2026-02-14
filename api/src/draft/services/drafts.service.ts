import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';

import { AttachmentEntity } from '../../core/entities/attachment.entity';
import { DraftEntity } from '../../core/entities/draft.entity';
import { CreateDraftRequestDto, UpdateDraftRequestDto } from '../dtos';

@Injectable()
export class DraftsService {
  constructor(
    @InjectRepository(DraftEntity)
    private readonly draftRepository: Repository<DraftEntity>,
    @InjectRepository(AttachmentEntity)
    private readonly attachmentRepository: Repository<AttachmentEntity>,
  ) {}

  async findAll(): Promise<DraftEntity[]> {
    return this.draftRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const draft = await this.draftRepository.findOne({ where: { id } });
    if (!draft) throw new NotFoundException(`Draft "${id}" not found`);

    const attachments = await this.attachmentRepository.find({
      where: { attachableType: 'draft', attachableId: id },
      order: { createdAt: 'ASC' },
    });

    return { ...draft, attachments };
  }

  async create(dto: CreateDraftRequestDto): Promise<DraftEntity> {
    const draft = this.draftRepository.create({
      content: dto.content,
    });
    return this.draftRepository.save(draft);
  }

  async update(id: string, dto: UpdateDraftRequestDto): Promise<DraftEntity> {
    const draft = await this.draftRepository.findOne({ where: { id } });
    if (!draft) throw new NotFoundException(`Draft "${id}" not found`);

    draft.content = dto.content;
    return this.draftRepository.save(draft);
  }

  async remove(id: string): Promise<void> {
    const draft = await this.draftRepository.findOne({ where: { id } });
    if (!draft) throw new NotFoundException(`Draft "${id}" not found`);

    await this.draftRepository.remove(draft);
  }

  async removeOlderThan(days: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const oldDrafts = await this.draftRepository.find({
      where: { updatedAt: LessThan(cutoff) },
    });

    if (oldDrafts.length === 0) return 0;

    await this.draftRepository.remove(oldDrafts);
    return oldDrafts.length;
  }
}
