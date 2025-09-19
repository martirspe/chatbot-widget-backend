import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration, { validate } from '@config/configuration';
import { PrismaModule } from '@infrastructure/prisma/prisma.module';
import { RedisModule } from '@infrastructure/redis/redis.module';
import { ChatModule } from '@modules/chat/chat.module';
import { HealthModule } from '@modules/health/health.module';
import { RagModule } from '@modules/rag/rag.module';
import { IngestModule } from '@modules/ingest/ingest.module';

// Módulo raíz que agrupa configuración global, infraestructura y todos los módulos funcionales.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate }),
    PrismaModule,
    RedisModule,
    ChatModule,
    HealthModule,
    RagModule,
    IngestModule
  ],
})
export class AppModule { }
