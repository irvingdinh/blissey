import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CommentsService } from '../../services';

@ApiTags('comments')
@Controller('/api/posts/:postId/comments')
export class IndexController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @ApiOperation({ summary: 'List comments for a post (flat, oldest first)' })
  async invoke(@Param('postId') postId: string) {
    return this.commentsService.findByPost(postId);
  }
}
