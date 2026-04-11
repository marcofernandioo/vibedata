import { PrismaPg } from '@prisma/adapter-pg';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly configService: ConfigService) {
    const databaseUrl = configService.getOrThrow<string>('app.database.url');

    super({
      adapter: new PrismaPg({ connectionString: databaseUrl }),
    });
  }

  async onModuleInit() {
    if (this.configService.get<string>('app.nodeEnv') === 'test') {
      return;
    }

    await this.$connect();
  }

  async onModuleDestroy() {
    if (this.configService.get<string>('app.nodeEnv') === 'test') {
      return;
    }

    await this.$disconnect();
  }
}
