import { Controller, Post, Body } from '@nestjs/common';
import { IngestService } from '../application/ingest.service';
import { IngestDocDto } from '../dto/ingest-doc.dto';

@Controller('ingest')
export class IngestController {
  constructor(private readonly ingest: IngestService) {}

  @Post()
  async addDocs(@Body() dto: IngestDocDto) {
    return this.ingest.ingestTexts(dto.texts, dto.source);
  }
}
