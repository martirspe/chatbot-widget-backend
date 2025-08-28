import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { IngestService } from '../application/ingest.service';
import { IngestDocsDto } from '../dto/ingest-doc.dto';

// Controlador que expone el endpoint POST /ingest para procesar documentos enriquecidos.
@Controller('ingest')
export class IngestController {
  // Inyecta el servicio encargado de procesar la ingesta de documentos.
  constructor(private readonly ingestService: IngestService) {}

  // Recibe y valida un array de documentos, delegando el procesamiento al servicio.
  @Post()
  async ingest(@Body() dto: IngestDocsDto) {
    if (!dto.docs || !Array.isArray(dto.docs) || dto.docs.length === 0) {
      throw new BadRequestException('El campo "docs" debe ser un array no vacío de documentos a ingresar.');
    }
    return await this.ingestService.ingestDocs(dto.docs);
  }
}