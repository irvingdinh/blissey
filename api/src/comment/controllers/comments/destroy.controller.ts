import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CommentsService } from '../../services';

@ApiTags('comments')
@Controller('/api/comments')
export class DestroyController {
  constructor(private readonly commentsService: CommentsService) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a comment' })
  async invoke(@Param('id') id: string) {
    await this.commentsService.softDelete(id);
  }
}
