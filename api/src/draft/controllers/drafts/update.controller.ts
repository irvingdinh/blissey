import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { UpdateDraftRequestDto } from '../../dtos';
import { DraftsService } from '../../services';

@ApiTags('drafts')
@Controller('/api/drafts')
export class UpdateController {
  constructor(private readonly draftsService: DraftsService) {}

  @Put(':id')
  @ApiOperation({ summary: 'Update draft content (autosave)' })
  async invoke(@Param('id') id: string, @Body() dto: UpdateDraftRequestDto) {
    return this.draftsService.update(id, dto);
  }
}
