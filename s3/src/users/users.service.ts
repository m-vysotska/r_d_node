import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id },
      relations: ['avatarFile'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo
      .createQueryBuilder('u')
      .where('u.email = :email', { email })
      .addSelect('u.passwordHash')
      .getOne();
  }

  async setAvatar(userId: string, fileId: string | null): Promise<User> {
    await this.userRepo.update(userId, { avatarFileId: fileId });
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');
    return user;
  }
}
