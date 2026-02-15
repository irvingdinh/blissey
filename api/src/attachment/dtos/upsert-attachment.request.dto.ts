import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { AttachableType, AttachmentCategory } from '../../core/enums';

export class UpsertAttachmentRequestDto {
  @ApiProperty({
    description: 'Type of the parent entity',
    enum: AttachableType,
  })
  @IsEnum(AttachableType)
  attachable_type: AttachableType;

  @ApiProperty({ description: 'ID of the parent entity' })
  @IsString()
  @IsNotEmpty()
  attachable_id: string;

  @ApiProperty({
    description: 'Attachment category',
    enum: AttachmentCategory,
  })
  @IsEnum(AttachmentCategory)
  category: AttachmentCategory;
}
