import { Body, Controller, Get, Post } from '@nestjs/common';
import type { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthCallbackDto } from './dto/auth-callback.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('callback')
  async callback(@Body() dto: AuthCallbackDto): Promise<UserResponseDto> {
    const user = await this.authService.syncUserFromAccessToken(
      dto.accessToken,
    );
    return UserResponseDto.from(user);
  }

  @Get('me')
  getMe(@CurrentUser() user: User): UserResponseDto {
    return UserResponseDto.from(user);
  }
}
