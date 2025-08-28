import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

// Punto de entrada principal que configura seguridad, validaciones, manejo global de errores y CORS.
async function bootstrap() {
  // Inicializa la aplicación NestJS con logger extendido.
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose']
  });

  // Aplica seguridad HTTP con Helmet.
  app.use(helmet());

  // Establece prefijo global para rutas de la API.
  app.setGlobalPrefix('api');

  // Aplica validación global de DTOs y transformación de datos.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Aplica filtro global para manejo uniforme de excepciones.
  app.useGlobalFilters(new AllExceptionsFilter());

  // Configura CORS para permitir acceso desde frontend.
  app.enableCors({ origin: process.env.CORS_ORIGIN || '*', credentials: true });

  // Inicia el servidor en el puerto configurado.
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
