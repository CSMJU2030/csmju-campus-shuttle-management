import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

/**
 * Connection to the subsystem's OWN database (never the Core Hub database).
 *
 * Prisma 7 connects through a driver adapter; the connection string is this
 * subsystem's DATABASE_URL and nothing else.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    let connectionString = process.env.DATABASE_URL;
    if (connectionString && connectionString.includes('${')) {
      const user = process.env.POSTGRES_USER || 'postgres';
      const password = process.env.POSTGRES_PASSWORD || '';
      connectionString = connectionString
        .replace('${POSTGRES_USER}', user)
        .replace('${POSTGRES_PASSWORD}', password);
    }

    const adapter = new PrismaPg({
      connectionString,
      max: Number(process.env.DATABASE_POOL_MAX) || 5,
    });

    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Connected to the demo subsystem database');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
