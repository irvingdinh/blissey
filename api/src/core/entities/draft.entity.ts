import { Column, CreateDateColumn, Entity, UpdateDateColumn } from 'typeorm';

import { BaseEntity } from './base.entity';

@Entity('drafts')
export class DraftEntity extends BaseEntity {
  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
