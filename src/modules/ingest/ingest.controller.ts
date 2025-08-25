import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { IngestService } from './application/ingest.service';
import { IngestDocDto } from './dto/ingest-doc.dto';

@Controller('ingest')
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  @Post()
  async ingest(@Body() dto: IngestDocDto) {
    if (!dto.texts || !Array.isArray(dto.texts) || dto.texts.length === 0) {
      throw new BadRequestException('texts debe ser un array no vacío');
    }
    return await this.ingestService.ingestTexts(dto.texts, dto.source);
  }
}