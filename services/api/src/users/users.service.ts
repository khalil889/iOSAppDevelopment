import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  findById(id: string) {
    return this.users.findOne({ where: { id }, relations: { guide: true } });
  }

  async getById(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  findByEmailWithPassword(email: string) {
    return this.users
      .createQueryBuilder('u')
      .addSelect(['u.passwordHash', 'u.failedLoginCount', 'u.lockedUntil'])
      .where('u.email = :email', { email })
      .getOne();
  }

  findByPhone(phone: string) {
    return this.users.findOne({ where: { phone } });
  }
}
