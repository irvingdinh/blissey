import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { AttachableType } from '../../core/enums';

export class UpdateAttachmentRequestDto {
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
}
