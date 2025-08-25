import { Module } from '@nestjs/common';
import { IngestController } from './presentation/ingest.controller';
import { IngestService } from './application/ingest.service';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [RagModule],
  controllers: [IngestController],
  providers: [IngestService],
})
export class IngestModule {}
