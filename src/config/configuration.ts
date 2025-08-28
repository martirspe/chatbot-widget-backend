import { plainToInstance } from 'class-transformer';
import { IsEnum, IsOptional, IsString, validateSync } from 'class-validator';
import { formatError } from '../common/utils/error.utils';

// Enum para definir los entornos de ejecución de la aplicación.
enum NodeEnv { development = 'development', production = 'production', test = 'test' }

// Clase que valida las variables de entorno requeridas y opcionales.
class EnvVars {
  @IsEnum(NodeEnv) NODE_ENV: NodeEnv | undefined;
  @IsString() DATABASE_URL: string | undefined;
  @IsString() CORS_ORIGIN: string | undefined;
  @IsOptional() @IsString() REDIS_URL?: string;
  @IsOptional() @IsString() MAGENTO_BASE_URL?: string;
  @IsOptional() @IsString() MAGENTO_ACCESS_TOKEN?: string;
  @IsOptional() @IsString() OPENAI_API_KEY?: string;
  @IsOptional() @IsString() QDRANT_URL?: string;
  @IsOptional() @IsString() QDRANT_COLLECTION?: string;
  @IsOptional() @IsString() LOCAL_EMBEDDING_URL?: string;
}

// Retorna la configuración cargada desde variables de entorno.
export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  magento: { baseUrl: process.env.MAGENTO_BASE_URL, token: process.env.MAGENTO_ACCESS_TOKEN },
  openaiKey: process.env.OPENAI_API_KEY,
  qdrant: { url: process.env.QDRANT_URL, collection: process.env.QDRANT_COLLECTION },
  localEmbeddingUrl: process.env.LOCAL_EMBEDDING_URL
});

// Valida la configuración y lanza error si faltan variables requeridas.
export function validate(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvVars, config as object, { enableImplicitConversion: true });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length) {
    throw new Error(formatError(errors));
  }
  return validated;
}
