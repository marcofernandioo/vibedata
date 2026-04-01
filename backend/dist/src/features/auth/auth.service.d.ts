import type { User } from '@prisma/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { UsersService } from '../users/users.service';
export declare class AuthService {
    private readonly supabaseAdminClient;
    private readonly usersService;
    private readonly logger;
    constructor(supabaseAdminClient: SupabaseClient, usersService: UsersService);
    syncUserFromAccessToken(accessToken: string): Promise<User>;
}
