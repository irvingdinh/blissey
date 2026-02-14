import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { UpdateCommentRequestDto } from '../../dtos';
import { CommentsService } from '../../services';

@ApiTags('comments')
@Controller('/api/comments')
export class UpdateController {
  constructor(private readonly commentsService: CommentsService) {}

  @Put(':id')
  @ApiOperation({ summary: 'Update comment content' })
  async invoke(@Param('id') id: string, @Body() dto: UpdateCommentRequestDto) {
    return this.commentsService.update(id, dto);
  }
}
