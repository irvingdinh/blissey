import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';

import { AttachmentEntity } from '../../core/entities/attachment.entity';
import { CommentEntity } from '../../core/entities/comment.entity';
import { PostEntity } from '../../core/entities/post.entity';
import { ReactionEntity } from '../../core/entities/reaction.entity';
import { groupReactions } from '../../core/services';
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

  async findAll(page: number, limit: number) {
    const [posts, total] = await this.postRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    if (posts.length === 0) {
      return { data: [], total, page, totalPages: Math.ceil(total / limit) };
    }

    const postIds = posts.map((p) => p.id);

    const [reactions, commentCounts, attachments] = await Promise.all([
      this.reactionRepository.find({
        where: { reactableType: 'post', reactableId: In(postIds) },
      }),
      this.commentRepository
        .createQueryBuilder('comment')
        .select('comment.postId', 'postId')
        .addSelect('COUNT(*)', 'count')
        .where('comment.postId IN (:...postIds)', { postIds })
        .andWhere('comment.deletedAt IS NULL')
        .groupBy('comment.postId')
        .getRawMany<{ postId: string; count: string }>(),
      this.attachmentRepository.find({
        where: { attachableType: 'post', attachableId: In(postIds) },
        order: { createdAt: 'ASC' },
      }),
    ]);

    const reactionsByPost = new Map<string, ReactionEntity[]>();
    for (const r of reactions) {
      const arr = reactionsByPost.get(r.reactableId) ?? [];
      arr.push(r);
      reactionsByPost.set(r.reactableId, arr);
    }

    const commentCountByPost = new Map<string, number>();
    for (const row of commentCounts) {
      commentCountByPost.set(row.postId, Number(row.count));
    }

    const attachmentsByPost = new Map<string, AttachmentEntity[]>();
    for (const a of attachments) {
      const arr = attachmentsByPost.get(a.attachableId) ?? [];
      arr.push(a);
      attachmentsByPost.set(a.attachableId, arr);
    }

    const data = posts.map((post) => ({
      ...post,
      reactions: groupReactions(reactionsByPost.get(post.id) ?? []),
      commentCount: commentCountByPost.get(post.id) ?? 0,
      attachments: attachmentsByPost.get(post.id) ?? [],
    }));

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

    const [reactions, commentCount, attachments] = await Promise.all([
      this.reactionRepository.find({
        where: { reactableType: 'post', reactableId: id },
      }),
      this.commentRepository.count({
        where: { postId: id },
      }),
      this.attachmentRepository.find({
        where: { attachableType: 'post', attachableId: id },
        order: { createdAt: 'ASC' },
      }),
    ]);

    return {
      ...post,
      reactions: groupReactions(reactions),
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
