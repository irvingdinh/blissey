import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';

import { BaseEntity } from './base.entity';
import { CommentEntity } from './comment.entity';

@Entity('posts')
export class PostEntity extends BaseEntity {
  @Column({ type: 'text' })
  content: string;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CommentEntity, (comment) => comment.post)
  comments: CommentEntity[];
}
