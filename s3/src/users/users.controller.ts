import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FilesService } from '../files/files.service';
import { IsUUID, IsOptional } from 'class-validator';

class SetAvatarDto {
  @IsOptional()
  @IsUUID()
  avatarFileId!: string | null;
}

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: { id: string }) {
    const u = await this.usersService.findById(user.id);
    if (!u) return null;
    const { passwordHash: _, ...rest } = u;
    let viewUrl: string | null = null;
    if (u.avatarFileId && u.avatarFile) {
      viewUrl = this.filesService.getViewUrl(u.avatarFile);
    }
    return { ...rest, avatarViewUrl: viewUrl };
  }

  @Put('me/avatar')
  @UseGuards(JwtAuthGuard)
  async setAvatar(
    @CurrentUser() user: { id: string },
    @Body() dto: SetAvatarDto,
  ) {
    await this.usersService.setAvatar(user.id, dto.avatarFileId ?? null);
    return this.me({ id: user.id });
  }
}
