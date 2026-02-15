import { nanoid } from 'nanoid';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PostEntity } from './post.entity';

@Entity('comments')
export class CommentEntity {
  @PrimaryColumn()
  id: string;

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

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = nanoid();
    }
  }
}
