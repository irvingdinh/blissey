import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CreateReactionRequestDto } from '../../dtos';
import { ReactionsService } from '../../services';

@ApiTags('reactions')
@Controller('/api/reactions')
export class StoreController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a reaction' })
  async invoke(@Body() dto: CreateReactionRequestDto) {
    return this.reactionsService.create(dto);
  }
}
