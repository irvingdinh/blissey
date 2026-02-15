import { nanoid } from 'nanoid';
import { BeforeInsert, PrimaryColumn } from 'typeorm';

export abstract class BaseEntity {
  @PrimaryColumn()
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = nanoid();
    }
  }
}
