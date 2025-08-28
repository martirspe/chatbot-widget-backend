import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// DTO que representa un documento a ingresar en el vector store.
export class IngestDocDto {
  @IsString()
  text!: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

// DTO para recibir un array de documentos a ingresar en el vector store.
export class IngestDocsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngestDocDto)
  docs!: IngestDocDto[];
}
