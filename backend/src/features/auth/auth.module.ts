import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createSupabaseAdminClient,
  SUPABASE_ADMIN_CLIENT,
} from '../../config/supabase.config';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: SUPABASE_ADMIN_CLIENT,
      useFactory: (configService: ConfigService) =>
        createSupabaseAdminClient(configService),
      inject: [ConfigService],
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
