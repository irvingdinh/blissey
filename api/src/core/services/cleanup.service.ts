import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { existsSync, unlinkSync } from 'fs';
import { In, LessThan, Repository } from 'typeorm';

import { AttachmentEntity } from '../entities/attachment.entity';
import { CommentEntity } from '../entities/comment.entity';
import { DraftEntity } from '../entities/draft.entity';
import { PostEntity } from '../entities/post.entity';
import { ReactionEntity } from '../entities/reaction.entity';
import { DirectoryService } from './directory.service';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    @InjectRepository(DraftEntity)
    private readonly draftRepository: Repository<DraftEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(ReactionEntity)
    private readonly reactionRepository: Repository<ReactionEntity>,
    @InjectRepository(AttachmentEntity)
    private readonly attachmentRepository: Repository<AttachmentEntity>,
    private readonly directoryService: DirectoryService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupDrafts(): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 3);

    const oldDrafts = await this.draftRepository.find({
      where: { updatedAt: LessThan(cutoff) },
    });

    if (oldDrafts.length === 0) return 0;

    for (const draft of oldDrafts) {
      await this.removeAttachments('draft', draft.id);
    }

    await this.draftRepository.remove(oldDrafts);

    this.logger.log(`Cleaned up ${oldDrafts.length} old draft(s)`);
    return oldDrafts.length;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupTrashedPosts(): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 3);

    const trashedPosts = await this.postRepository.find({
      where: { deletedAt: LessThan(cutoff) },
      withDeleted: true,
    });

    if (trashedPosts.length === 0) return 0;

    for (const post of trashedPosts) {
      const comments = await this.commentRepository.find({
        where: { postId: post.id },
        withDeleted: true,
      });

      if (comments.length > 0) {
        const commentIds = comments.map((c) => c.id);

        for (const comment of comments) {
          await this.removeAttachments('comment', comment.id);
        }

        await this.reactionRepository.delete({
          reactableType: 'comment',
          reactableId: In(commentIds),
        });

        await this.commentRepository.remove(comments);
      }

      await this.removeAttachments('post', post.id);
      await this.reactionRepository.delete({
        reactableType: 'post',
        reactableId: post.id,
      });
    }

    await this.postRepository.remove(trashedPosts);

    this.logger.log(`Cleaned up ${trashedPosts.length} trashed post(s)`);
    return trashedPosts.length;
  }

  private async removeAttachments(
    attachableType: string,
    attachableId: string,
  ): Promise<void> {
    const attachments = await this.attachmentRepository.find({
      where: { attachableType, attachableId },
    });

    const uploadsDir = this.directoryService.dataDir('uploads');

    for (const attachment of attachments) {
      this.tryDeleteFile(`${uploadsDir}/${attachment.filePath}`);

      if (attachment.thumbnailPath) {
        this.tryDeleteFile(`${uploadsDir}/${attachment.thumbnailPath}`);
      }
    }

    if (attachments.length > 0) {
      await this.attachmentRepository.remove(attachments);
    }
  }

  private tryDeleteFile(filePath: string): void {
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch (error) {
      this.logger.warn(`Failed to delete file: ${filePath}`, error);
    }
  }
}
