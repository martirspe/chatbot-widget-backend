import { IsString, IsOptional, IsArray } from 'class-validator';

export class IngestDocDto {
  @IsArray()
  @IsString({ each: true })
  texts!: string[]; // fragmentos de texto o páginas

  @IsOptional()
  @IsString()
  source?: string; // origen: "faq.pdf", "politicas.md", etc.
}
