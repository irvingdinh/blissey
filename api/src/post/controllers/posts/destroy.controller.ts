import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { PostsService } from '../../services';

@ApiTags('posts')
@Controller('/api/posts')
export class DestroyController {
  constructor(private readonly postsService: PostsService) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a post' })
  async invoke(@Param('id') id: string) {
    await this.postsService.softDelete(id);
  }
}
