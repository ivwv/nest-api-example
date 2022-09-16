import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type FindOptionsWhere, type Repository, Equal, Not } from 'typeorm';

import type { LoginUser } from '~auth/dto/login-user.dto';
import type { RegisterUser } from '~auth/dto/register-user.dto';
import type { UpdateUser } from '~auth/dto/update-user.dto';
import { User } from '~auth/entities/user.entity';
import type { JwtPayload } from '~auth/interfaces/jwt-payload.interface';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  register(newUser: RegisterUser): Promise<User> {
    const user = this.userRepository.create(newUser);

    return this.userRepository.save(user);
  }

  async login(credentials: LoginUser): Promise<User> {
    return this.userRepository.findOneOrFail({
      where: {
        username: credentials.username,
      },
    });
  }

  verifyPayload(payload: JwtPayload): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: payload.sub },
    });
  }

  async update(user: User, changes: UpdateUser): Promise<User> {
    this.userRepository.merge(user, changes);

    return this.userRepository.save(user);
  }

  async isRegistered(
    partial: Partial<Pick<User, 'email' | 'id' | 'username'>>,
  ): Promise<boolean> {
    const where: FindOptionsWhere<User> = {};

    for (const [property, value] of Object.entries(partial)) {
      if (value) {
        where[property as keyof typeof partial] =
          property === 'id' ? Not(value) : Equal(value);
      }
    }

    const count = await this.userRepository.countBy(where);

    return count >= 1;
  }
}
