import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { PostsService } from '../../services';

@ApiTags('posts')
@Controller('/api/posts')
export class ShowController {
  constructor(private readonly postsService: PostsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a single post with reactions and comments' })
  async invoke(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }
}
