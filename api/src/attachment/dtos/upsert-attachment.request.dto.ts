import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpsertAttachmentRequestDto {
  @ApiProperty({
    description: 'Type of the parent entity',
    enum: ['post', 'draft', 'comment'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['post', 'draft', 'comment'])
  attachable_type: string;

  @ApiProperty({ description: 'ID of the parent entity' })
  @IsString()
  @IsNotEmpty()
  attachable_id: string;

  @ApiProperty({
    description: 'Attachment category',
    enum: ['gallery', 'inline', 'attachment'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['gallery', 'inline', 'attachment'])
  category: string;
}
