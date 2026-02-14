import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';

import { AttachmentEntity } from '../../core/entities/attachment.entity';
import { CommentEntity } from '../../core/entities/comment.entity';
import { PostEntity } from '../../core/entities/post.entity';
import { ReactionEntity } from '../../core/entities/reaction.entity';
import { CreatePostRequestDto, UpdatePostRequestDto } from '../dtos';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(ReactionEntity)
    private readonly reactionRepository: Repository<ReactionEntity>,
    @InjectRepository(AttachmentEntity)
    private readonly attachmentRepository: Repository<AttachmentEntity>,
  ) {}

  async findAll(
    page: number,
    limit: number,
  ): Promise<PaginatedResult<PostEntity>> {
    const [data, total] = await this.postRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) throw new NotFoundException(`Post "${id}" not found`);

    const reactions = await this.reactionRepository.find({
      where: { reactableType: 'post', reactableId: id },
    });

    const reactionGroups: Record<string, { emoji: string; count: number }> = {};
    for (const reaction of reactions) {
      if (!reactionGroups[reaction.emoji]) {
        reactionGroups[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
        };
      }
      reactionGroups[reaction.emoji].count++;
    }

    const commentCount = await this.commentRepository.count({
      where: { postId: id },
    });

    const attachments = await this.attachmentRepository.find({
      where: { attachableType: 'post', attachableId: id },
      order: { createdAt: 'ASC' },
    });

    return {
      ...post,
      reactions: Object.values(reactionGroups),
      commentCount,
      attachments,
    };
  }

  async create(dto: CreatePostRequestDto): Promise<PostEntity> {
    const post = this.postRepository.create({
      content: dto.content,
    });
    return this.postRepository.save(post);
  }

  async update(id: string, dto: UpdatePostRequestDto): Promise<PostEntity> {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) throw new NotFoundException(`Post "${id}" not found`);

    post.content = dto.content;
    return this.postRepository.save(post);
  }

  async softDelete(id: string): Promise<void> {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) throw new NotFoundException(`Post "${id}" not found`);

    await this.postRepository.softRemove(post);
  }

  async findTrashed() {
    const posts = await this.postRepository.find({
      where: { deletedAt: Not(IsNull()) },
      withDeleted: true,
      order: { deletedAt: 'DESC' },
    });

    return posts.map((post) => {
      const deletedAt = new Date(post.deletedAt!).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - deletedAt) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, 3 - elapsed);
      return { ...post, daysRemaining };
    });
  }

  async restore(id: string): Promise<PostEntity> {
    const post = await this.postRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!post) throw new NotFoundException(`Post "${id}" not found`);
    if (!post.deletedAt)
      throw new NotFoundException(`Post "${id}" is not in trash`);

    post.deletedAt = null;
    return this.postRepository.save(post);
  }
}
