import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CommentEntity } from '../../core/entities/comment.entity';
import { PostEntity } from '../../core/entities/post.entity';
import { ReactionEntity } from '../../core/entities/reaction.entity';
import { ReactableType } from '../../core/enums';
import { CreateReactionRequestDto } from '../dtos';

@Injectable()
export class ReactionsService {
  constructor(
    @InjectRepository(ReactionEntity)
    private readonly reactionRepository: Repository<ReactionEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
  ) {}

  async create(dto: CreateReactionRequestDto): Promise<ReactionEntity> {
    if (dto.reactableType === ReactableType.POST) {
      const post = await this.postRepository.findOne({
        where: { id: dto.reactableId },
      });
      if (!post) {
        throw new NotFoundException(`Post "${dto.reactableId}" not found`);
      }
    } else {
      const comment = await this.commentRepository.findOne({
        where: { id: dto.reactableId },
      });
      if (!comment) {
        throw new NotFoundException(`Comment "${dto.reactableId}" not found`);
      }
    }

    const reaction = this.reactionRepository.create({
      reactableType: dto.reactableType,
      reactableId: dto.reactableId,
      emoji: dto.emoji,
    });

    return this.reactionRepository.save(reaction);
  }

  async remove(id: string): Promise<void> {
    const reaction = await this.reactionRepository.findOne({ where: { id } });
    if (!reaction) {
      throw new NotFoundException(`Reaction "${id}" not found`);
    }

    await this.reactionRepository.remove(reaction);
  }

  async findByReactable(type: string, id: string): Promise<ReactionEntity[]> {
    return this.reactionRepository.find({
      where: { reactableType: type, reactableId: id },
    });
  }
}
