import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface PresignOptions {
  bucket: string;
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}

export class S3StorageService {
  private readonly client: S3Client;

  constructor(
    region: string,
    accessKeyId?: string,
    secretAccessKey?: string,
  ) {
    this.client = new S3Client({
      region,
      ...(accessKeyId && secretAccessKey
        ? {
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
          }
        : {}),
    });
  }

  async getPresignedPutUrl(options: PresignOptions): Promise<string> {
    const { bucket, key, contentType, expiresInSeconds = 3600 } = options;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }
}
