import { User, UserRole } from '@prisma/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';
export declare class UsersService {
    private readonly usersRepository;
    private readonly logger;
    constructor(usersRepository: UsersRepository);
    findById(id: string): Promise<User>;
    findOrCreateFromSupabase(supabaseUser: SupabaseUser): Promise<User>;
    updateRole(id: string, role: UserRole): Promise<User>;
    updateUser(id: string, dto: UpdateUserDto): Promise<User>;
    private resolveDisplayName;
    private resolveAvatarUrl;
}
