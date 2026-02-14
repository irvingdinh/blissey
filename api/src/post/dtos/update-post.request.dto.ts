import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePostRequestDto {
  @ApiProperty({ description: 'Editor.js block JSON content' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
