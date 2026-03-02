import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { FileRecord } from '../entities/file-record.entity';
import { FileStatus, FileVisibility, FileEntityType } from './file.types';
import { S3StorageService } from './storage/s3-storage.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

export interface PresignResult {
  fileId: string;
  key: string;
  uploadUrl: string;
  contentType: string;
}

export interface CompleteResult {
  fileId: string;
  viewUrl: string;
}

@Injectable()
export class FilesService {
  private readonly s3: S3StorageService;
  private readonly bucket: string;
  private readonly cloudFrontBaseUrl: string | null;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(FileRecord)
    private readonly fileRepo: Repository<FileRecord>,
  ) {
    const aws = this.config.get<{ region: string; s3Bucket: string; accessKeyId?: string; secretAccessKey?: string }>('aws');
    this.bucket = aws?.s3Bucket ?? 'bucket';
    this.s3 = new S3StorageService(
      aws?.region ?? 'eu-central-1',
      aws?.accessKeyId,
      aws?.secretAccessKey,
    );
    this.cloudFrontBaseUrl = this.config.get<string | null>('cloudFrontBaseUrl') ?? null;
  }

  /** Generate S3 key on backend only. Client never sends key. */
  generateKey(entityType: FileEntityType, entityId: string, contentType: string): string {
    const ext = EXT_BY_TYPE[contentType] ?? 'bin';
    return `${entityType}s/${entityId}/avatars/${uuidv4()}.${ext}`;
  }

  validateContentType(contentType: string): void {
    if (!ALLOWED_IMAGE_TYPES.includes(contentType as any)) {
      throw new Error(`Invalid contentType. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
    }
  }

  async createPendingRecord(params: {
    ownerId: string;
    entityId: string;
    key: string;
    contentType: string;
    size?: number;
    visibility?: FileVisibility;
  }): Promise<FileRecord> {
    const record = this.fileRepo.create({
      ownerId: params.ownerId,
      entityId: params.entityId,
      key: params.key,
      contentType: params.contentType,
      size: params.size ?? 0,
      status: FileStatus.PENDING,
      visibility: params.visibility ?? FileVisibility.PRIVATE,
    });
    return this.fileRepo.save(record);
  }

  async presignUpload(params: {
    ownerId: string;
    entityId: string;
    entityType: FileEntityType;
    contentType: string;
    visibility?: FileVisibility;
  }): Promise<PresignResult> {
    this.validateContentType(params.contentType);
    const key = this.generateKey(params.entityType, params.entityId, params.contentType);
    const record = await this.createPendingRecord({
      ownerId: params.ownerId,
      entityId: params.entityId,
      key,
      contentType: params.contentType,
      visibility: params.visibility,
    });
    const uploadUrl = await this.s3.getPresignedPutUrl({
      bucket: this.bucket,
      key,
      contentType: params.contentType,
      expiresInSeconds: 3600,
    });
    return {
      fileId: record.id,
      key: record.key,
      uploadUrl,
      contentType: record.contentType,
    };
  }

  async getById(fileId: string): Promise<FileRecord | null> {
    return this.fileRepo.findOne({ where: { id: fileId } });
  }

  async completeUpload(fileId: string, ownerId: string): Promise<FileRecord> {
    const record = await this.getById(fileId);
    if (!record) {
      throw new Error('File not found');
    }
    if (record.ownerId !== ownerId) {
      throw new Error('Forbidden: cannot complete another user\'s file');
    }
    if (record.status !== FileStatus.PENDING) {
      throw new Error('File is not in pending status');
    }
    record.status = FileStatus.READY;
    return this.fileRepo.save(record);
  }

  getViewUrl(record: FileRecord): string {
    if (this.cloudFrontBaseUrl) {
      const base = this.cloudFrontBaseUrl.replace(/\/$/, '');
      return `${base}/${record.key}`;
    }
    return `https://${this.bucket}.s3.amazonaws.com/${record.key}`;
  }
}
