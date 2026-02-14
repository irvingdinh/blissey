import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { DraftsService } from '../../services';

@ApiTags('drafts')
@Controller('/api/drafts')
export class ShowController {
  constructor(private readonly draftsService: DraftsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a single draft with attachments' })
  async invoke(@Param('id') id: string) {
    return this.draftsService.findOne(id);
  }
}
