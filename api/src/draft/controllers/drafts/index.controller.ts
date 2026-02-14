import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { DraftsService } from '../../services';

@ApiTags('drafts')
@Controller('/api/drafts')
export class IndexController {
  constructor(private readonly draftsService: DraftsService) {}

  @Get()
  @ApiOperation({ summary: 'List all drafts (newest first)' })
  async invoke() {
    return this.draftsService.findAll();
  }
}
