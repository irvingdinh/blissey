import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ReactionsService } from '../../services';

@ApiTags('reactions')
@Controller('/api/reactions')
export class DestroyController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a reaction' })
  async invoke(@Param('id') id: string) {
    await this.reactionsService.remove(id);
  }
}
