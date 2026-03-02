import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FilesService, PresignResult, CompleteResult } from './files.service';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileRecord } from '../entities/file-record.entity';
import { FileStatus } from './file.types';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('presign')
  @UseGuards(JwtAuthGuard)
  async presign(
    @Body() dto: PresignUploadDto,
    @CurrentUser() user: { id: string; role: string },
  ): Promise<PresignResult> {
    return this.filesService.presignUpload({
      ownerId: user.id,
      entityId: user.id,
      entityType: 'user',
      contentType: dto.contentType,
      visibility: dto.visibility === 'public' ? 'public' : 'private',
    });
  }

  @Post('complete')
  @UseGuards(JwtAuthGuard)
  async complete(
    @Body() dto: CompleteUploadDto,
    @CurrentUser() user: { id: string },
  ): Promise<CompleteResult> {
    const record = await this.filesService.completeUpload(dto.fileId, user.id);
    const viewUrl = this.filesService.getViewUrl(record);
    return { fileId: record.id, viewUrl };
  }

  @Get(':fileId/url')
  @UseGuards(JwtAuthGuard)
  async getViewUrl(
    @Param('fileId') fileId: string,
    @CurrentUser() user: { id: string },
  ): Promise<{ viewUrl: string }> {
    const record = await this.filesService.getById(fileId);
    if (!record) throw new NotFoundException('File not found');
    if (record.ownerId !== user.id && record.visibility !== 'public') {
      throw new ForbiddenException('Access denied');
    }
    if (record.status !== FileStatus.READY) {
      throw new ForbiddenException('File is not ready yet');
    }
    return { viewUrl: this.filesService.getViewUrl(record) };
  }
}
