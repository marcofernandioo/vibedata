import type { User } from '@prisma/client';
import { AuthCallbackDto } from './dto/auth-callback.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    callback(dto: AuthCallbackDto): Promise<UserResponseDto>;
    getMe(user: User): UserResponseDto;
}
