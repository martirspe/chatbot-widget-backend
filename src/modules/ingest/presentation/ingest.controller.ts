import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IngestService } from '@modules/ingest/application/ingest.service';
import { IngestDocsDto } from '@modules/ingest/dto/ingest-doc.dto';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as xlsx from 'xlsx';

// Controlador que expone el endpoint POST /ingest para procesar documentos enriquecidos.
@Controller('ingest')
export class IngestController {
  // Inyecta el servicio encargado de procesar la ingesta de documentos.
  constructor(private readonly ingestService: IngestService) { }

  // Recibe y valida un array de documentos, delegando el procesamiento al servicio.
  @Post()
  async ingest(@Body() dto: IngestDocsDto) {
    if (!dto.docs || !Array.isArray(dto.docs) || dto.docs.length === 0) {
      throw new BadRequestException('El campo "docs" debe ser un array con al menos un documento.');
    }
    return await this.ingestService.ingestDocs(dto.docs);
  }

  // Ingesta por archivo estándar (PDF, TXT, DOCX, XLSX)
  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  async ingestFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('source') source?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo.');
    }

    let text = '';
    switch (file.mimetype) {
      case 'application/pdf':
        text = (await pdfParse(file.buffer)).text;
        break;
      case 'text/plain':
        text = file.buffer.toString('utf-8');
        break;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': // DOCX
        text = (await mammoth.extractRawText({ buffer: file.buffer })).value;
        break;
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': // XLSX
        const workbook = xlsx.read(file.buffer, { type: 'buffer' });
        text = workbook.SheetNames
          .map((name) => xlsx.utils.sheet_to_csv(workbook.Sheets[name]))
          .join('\n');
        break;
      default:
        throw new BadRequestException('Tipo de archivo no soportado.');
    }

    await this.ingestService.ingestDocs([
      {
        text,
        source,
        metadata: { filename: file.originalname, mimetype: file.mimetype },
      },
    ]);
    return {
      status: 'ok',
      filename: file.originalname,
      mimetype: file.mimetype,
      source,
      message: `Archivo ${file.originalname} procesado e ingresado correctamente.`
    };
  }
}