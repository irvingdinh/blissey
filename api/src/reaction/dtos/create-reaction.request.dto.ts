import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { ReactableType } from '../../core/enums';

export class CreateReactionRequestDto {
  @ApiProperty({
    description: 'Type of the reactable entity',
    enum: ReactableType,
  })
  @IsEnum(ReactableType)
  reactableType: ReactableType;

  @ApiProperty({ description: 'ID of the reactable entity' })
  @IsString()
  @IsNotEmpty()
  reactableId: string;

  @ApiProperty({ description: 'Emoji character' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  emoji: string;
}
