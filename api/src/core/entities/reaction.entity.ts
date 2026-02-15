import { Column, CreateDateColumn, Entity, Index } from 'typeorm';

import { BaseEntity } from './base.entity';

@Entity('reactions')
@Index(['reactableType', 'reactableId'])
export class ReactionEntity extends BaseEntity {
  @Column()
  reactableType: string;

  @Column()
  reactableId: string;

  @Column()
  emoji: string;

  @CreateDateColumn()
  createdAt: Date;
}
