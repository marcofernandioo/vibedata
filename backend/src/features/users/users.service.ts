import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findOrCreateFromSupabase(supabaseUser: SupabaseUser): Promise<User> {
    const existingUser = await this.usersRepository.findBySupabaseId(
      supabaseUser.id,
    );

    const name = this.resolveDisplayName(supabaseUser);
    const avatarUrl = this.resolveAvatarUrl(supabaseUser);

    if (existingUser) {
      return this.usersRepository.update(existingUser.id, {
        email: supabaseUser.email,
        name,
        avatarUrl,
      });
    }

    if (!supabaseUser.email) {
      throw new UnauthorizedException(
        'Cannot create user without an email address',
      );
    }

    this.logger.log(`Creating new user for supabaseId=${supabaseUser.id}`);

    return this.usersRepository.create({
      supabaseId: supabaseUser.id,
      email: supabaseUser.email,
      name,
      avatarUrl,
    });
  }

  updateRole(id: string, role: UserRole): Promise<User> {
    return this.usersRepository.update(id, { role });
  }

  updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    return this.usersRepository.update(id, dto);
  }

  /**
   * Resolves a display name from Supabase user metadata.
   * Fallback order: user_metadata.full_name → user_metadata.name → email.
   */
  private resolveDisplayName(supabaseUser: SupabaseUser): string | null {
    const metadata = supabaseUser.user_metadata;

    if (typeof metadata?.full_name === 'string') {
      return metadata.full_name;
    }

    if (typeof metadata?.name === 'string') {
      return metadata.name;
    }

    if (typeof supabaseUser.email === 'string') {
      return supabaseUser.email;
    }

    return null;
  }

  /**
   * Resolves an avatar URL from Supabase user metadata.
   * Fallback order: user_metadata.avatar_url → user_metadata.picture.
   */
  private resolveAvatarUrl(supabaseUser: SupabaseUser): string | null {
    const metadata = supabaseUser.user_metadata;

    if (typeof metadata?.avatar_url === 'string') {
      return metadata.avatar_url;
    }

    if (typeof metadata?.picture === 'string') {
      return metadata.picture;
    }

    return null;
  }
}
