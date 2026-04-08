import type { User, UserRole } from '@prisma/client';
export declare class UserResponseDto {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    constructor(user: User);
    static from(user: User): UserResponseDto;
}
