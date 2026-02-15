import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateReactionRequestDto {
  @ApiProperty({
    description: 'Type of the reactable entity',
    enum: ['post', 'comment'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['post', 'comment'])
  reactableType: string;

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
