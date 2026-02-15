import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateAttachmentRequestDto {
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
}
