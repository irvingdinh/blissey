import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { UpdateAttachmentRequestDto } from '../../dtos';
import { AttachmentsService } from '../../services';

@ApiTags('attachments')
@Controller('/api/attachments')
export class UpdateController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Put(':id')
  @ApiOperation({ summary: 'Update attachment ownership' })
  async invoke(
    @Param('id') id: string,
    @Body() dto: UpdateAttachmentRequestDto,
  ) {
    return this.attachmentsService.update(id, dto);
  }
}
