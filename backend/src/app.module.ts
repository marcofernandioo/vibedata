import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalyticsModule } from './features/analytics/analytics.module';
import { UsersModule } from './features/users/users.module';
import { AuthModule } from './features/auth/auth.module';

@Module({
  imports: [AnalyticsModule, UsersModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
