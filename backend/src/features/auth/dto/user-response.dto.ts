import type { User, UserRole } from '@prisma/client';

export class UserResponseDto {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.avatarUrl = user.avatarUrl;
    this.role = user.role;
    this.isActive = user.isActive;
    this.createdAt = user.createdAt;
  }

  static from(user: User): UserResponseDto {
    return new UserResponseDto(user);
  }
}
