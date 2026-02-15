import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';

import { BaseEntity } from './base.entity';
import { PostEntity } from './post.entity';

@Entity('comments')
export class CommentEntity extends BaseEntity {
  @Index()
  @Column()
  postId: string;

  @Column({ type: 'text' })
  content: string;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => PostEntity, (post) => post.comments)
  post: PostEntity;
}
