import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CreateCommentRequestDto } from '../../dtos';
import { CommentsService } from '../../services';

@ApiTags('comments')
@Controller('/api/posts/:postId/comments')
export class StoreController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a comment on a post' })
  async invoke(
    @Param('postId') postId: string,
    @Body() dto: CreateCommentRequestDto,
  ) {
    return this.commentsService.create(postId, dto);
  }
}
