import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

import { UpsertAttachmentRequestDto } from '../../dtos';
import { AttachmentsService } from '../../services';

@ApiTags('attachments')
@Controller('/api/attachments')
export class StoreController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file attachment' })
  async invoke(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpsertAttachmentRequestDto,
  ) {
    return this.attachmentsService.create(file, dto);
  }
}
