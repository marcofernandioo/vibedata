import { PrismaPg } from '@prisma/adapter-pg';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: configService.getOrThrow<string>('app.database.url'),
    });

    super({
      adapter,
    });
  }

  async onModuleInit() {
    if (this.configService.get<string>('app.nodeEnv') === 'test') {
      return;
    }

    await this.$connect();
  }
}
