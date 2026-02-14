import { Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { PostsService } from '../../services';

@ApiTags('trash')
@Controller('/api/trash')
export class RestoreController {
  constructor(private readonly postsService: PostsService) {}

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a soft-deleted post' })
  async invoke(@Param('id') id: string) {
    return this.postsService.restore(id);
  }
}
