import { nanoid } from 'nanoid';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

@Entity('reactions')
@Index(['reactableType', 'reactableId'])
export class ReactionEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  reactableType: string;

  @Column()
  reactableId: string;

  @Column()
  emoji: string;

  @CreateDateColumn()
  createdAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = nanoid();
    }
  }
}
