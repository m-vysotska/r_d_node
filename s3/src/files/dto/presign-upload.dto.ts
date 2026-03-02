import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const VISIBILITY = ['private', 'public'];

export class PresignUploadDto {
  @IsString()
  @IsIn(ALLOWED, { message: `contentType must be one of: ${ALLOWED.join(', ')}` })
  contentType!: string;

  @IsOptional()
  @IsString()
  @IsIn(VISIBILITY)
  visibility?: 'private' | 'public';
}
