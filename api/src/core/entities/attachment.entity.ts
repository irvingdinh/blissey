import { Column, CreateDateColumn, Entity, Index } from 'typeorm';

import { BaseEntity } from './base.entity';

@Entity('attachments')
@Index(['attachableType', 'attachableId'])
export class AttachmentEntity extends BaseEntity {
  @Column()
  attachableType: string;

  @Column()
  attachableId: string;

  @Column()
  category: string;

  @Column()
  fileName: string;

  @Column()
  filePath: string;

  @Column()
  fileSize: number;

  @Column()
  mimeType: string;

  @Column({ type: 'varchar', nullable: true })
  thumbnailPath: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
