import { Controller, Get } from '@nestjs/common';

// Controlador que expone el endpoint GET /health para verificar el estado del backend.
@Controller('health')
export class HealthController {

  // Retorna el estado 'ok' y la marca de tiempo actual.
  @Get()
  ok() {
    return { status: 'ok', ts: new Date().toISOString() };
  }
}
