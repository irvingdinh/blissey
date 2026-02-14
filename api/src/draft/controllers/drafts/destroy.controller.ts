import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { DraftsService } from '../../services';

@ApiTags('drafts')
@Controller('/api/drafts')
export class DestroyController {
  constructor(private readonly draftsService: DraftsService) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a draft' })
  async invoke(@Param('id') id: string) {
    await this.draftsService.remove(id);
  }
}
