import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { PaginationQueryDto } from '../../dtos';
import { PostsService } from '../../services';

@ApiTags('posts')
@Controller('/api/posts')
export class IndexController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'List posts (paginated, newest first)' })
  async invoke(@Query() query: PaginationQueryDto) {
    return this.postsService.findAll(query.page, query.limit);
  }
}
