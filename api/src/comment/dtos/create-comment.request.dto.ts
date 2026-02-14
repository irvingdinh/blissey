import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentRequestDto {
  @ApiProperty({ description: 'Editor.js block JSON content' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
