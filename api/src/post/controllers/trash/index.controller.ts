import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { PostsService } from '../../services';

@ApiTags('trash')
@Controller('/api/trash')
export class IndexController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'List soft-deleted posts (newest deleted first)' })
  async invoke() {
    return this.postsService.findTrashed();
  }
}
