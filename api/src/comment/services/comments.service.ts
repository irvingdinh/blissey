import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { CommentEntity } from '../../core/entities/comment.entity';
import { PostEntity } from '../../core/entities/post.entity';
import { ReactionEntity } from '../../core/entities/reaction.entity';
import { groupReactions } from '../../core/services';
import { CreateCommentRequestDto, UpdateCommentRequestDto } from '../dtos';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    @InjectRepository(ReactionEntity)
    private readonly reactionRepository: Repository<ReactionEntity>,
  ) {}

  async findByPost(postId: string) {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException(`Post "${postId}" not found`);

    const comments = await this.commentRepository.find({
      where: { postId },
      order: { createdAt: 'ASC' },
    });

    if (comments.length === 0) return [];

    const commentIds = comments.map((c) => c.id);
    const reactions = await this.reactionRepository.find({
      where: { reactableType: 'comment', reactableId: In(commentIds) },
    });

    const reactionsByComment = new Map<string, ReactionEntity[]>();
    for (const r of reactions) {
      const arr = reactionsByComment.get(r.reactableId) ?? [];
      arr.push(r);
      reactionsByComment.set(r.reactableId, arr);
    }

    return comments.map((comment) => ({
      ...comment,
      reactions: groupReactions(reactionsByComment.get(comment.id) ?? []),
    }));
  }

  async create(
    postId: string,
    dto: CreateCommentRequestDto,
  ): Promise<CommentEntity> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException(`Post "${postId}" not found`);

    const comment = this.commentRepository.create({
      postId,
      content: dto.content,
    });
    return this.commentRepository.save(comment);
  }

  async update(
    id: string,
    dto: UpdateCommentRequestDto,
  ): Promise<CommentEntity> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) throw new NotFoundException(`Comment "${id}" not found`);

    comment.content = dto.content;
    return this.commentRepository.save(comment);
  }

  async softDelete(id: string): Promise<void> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) throw new NotFoundException(`Comment "${id}" not found`);

    await this.commentRepository.softRemove(comment);
  }
}
