import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CreatePostRequestDto } from '../../dtos';
import { PostsService } from '../../services';

@ApiTags('posts')
@Controller('/api/posts')
export class StoreController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new post' })
  async invoke(@Body() dto: CreatePostRequestDto) {
    return this.postsService.create(dto);
  }
}
