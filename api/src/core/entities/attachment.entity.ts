import { nanoid } from 'nanoid';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';

@Entity('attachments')
export class AttachmentEntity {
  @PrimaryColumn()
  id: string;

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

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = nanoid();
    }
  }
}
