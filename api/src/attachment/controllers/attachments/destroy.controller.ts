import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AttachmentsService } from '../../services';

@ApiTags('attachments')
@Controller('/api/attachments')
export class DestroyController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an attachment and its file from disk' })
  async invoke(@Param('id') id: string) {
    await this.attachmentsService.remove(id);
  }
}
