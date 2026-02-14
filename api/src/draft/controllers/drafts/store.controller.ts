import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CreateDraftRequestDto } from '../../dtos';
import { DraftsService } from '../../services';

@ApiTags('drafts')
@Controller('/api/drafts')
export class StoreController {
  constructor(private readonly draftsService: DraftsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new draft' })
  async invoke(@Body() dto: CreateDraftRequestDto) {
    return this.draftsService.create(dto);
  }
}
