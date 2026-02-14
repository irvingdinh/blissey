import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { UpdatePostRequestDto } from '../../dtos';
import { PostsService } from '../../services';

@ApiTags('posts')
@Controller('/api/posts')
export class UpdateController {
  constructor(private readonly postsService: PostsService) {}

  @Put(':id')
  @ApiOperation({ summary: 'Update post content' })
  async invoke(@Param('id') id: string, @Body() dto: UpdatePostRequestDto) {
    return this.postsService.update(id, dto);
  }
}
