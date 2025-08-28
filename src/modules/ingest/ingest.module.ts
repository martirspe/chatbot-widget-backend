import { Module } from '@nestjs/common';
import { IngestController } from './presentation/ingest.controller';
import { IngestService } from './application/ingest.service';
import { RagModule } from '../rag/rag.module';

// Módulo de ingesta que agrupa controlador y servicio, e importa RagModule para acceso al almacenamiento vectorial.
@Module({
  imports: [RagModule],
  controllers: [IngestController],
  providers: [IngestService]
})
export class IngestModule { }
