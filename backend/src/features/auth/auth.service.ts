import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN_CLIENT } from '../../config/supabase.config';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(SUPABASE_ADMIN_CLIENT)
    private readonly supabaseAdminClient: SupabaseClient,
    private readonly usersService: UsersService,
  ) {}

  async syncUserFromAccessToken(accessToken: string): Promise<User> {
    const { data, error } =
      await this.supabaseAdminClient.auth.getUser(accessToken);

    if (error || !data.user) {
      this.logger.warn(
        `Token validation failed: ${error?.message ?? 'no user returned'}`,
      );
      throw new UnauthorizedException('Invalid or expired access token');
    }

    if (!data.user.email) {
      throw new UnauthorizedException(
        'Authenticated user is missing an email address',
      );
    }

    const user = await this.usersService.findOrCreateFromSupabase(data.user);
    this.logger.log(`User synced: ${user.email} (${user.id})`);

    return user;
  }
}
