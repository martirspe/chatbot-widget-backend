import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@infrastructure/prisma/prisma.service';

@Injectable()
export class ChatInactivityService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChatInactivityService.name);
  private timer?: ReturnType<typeof setInterval>;
  private readonly idleMinutes = Number(process.env.SESSION_IDLE_MINUTES || 15);
  private readonly intervalMs = 60_000; // ejecutar cada 1 minuto

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Evitar configurar si el valor es inválido o deshabilitado
    if (this.idleMinutes <= 0) {
      this.logger.log('Inactividad deshabilitada (SESSION_IDLE_MINUTES <= 0).');
      return;
    }
    this.timer = setInterval(() => {
      this.closeIdleSessions().catch(err => this.logger.error('Error cerrando sesiones inactivas', err as Error));
    }, this.intervalMs);
    this.logger.log(`Autocierre por inactividad habilitado: ${this.idleMinutes} min.`);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async closeIdleSessions(): Promise<void> {
    const cutoff = new Date(Date.now() - this.idleMinutes * 60_000);
    // Cierra sesiones que fueron creadas antes del cutoff y no tienen mensajes recientes (>= cutoff)
    const res = await this.prisma.session.updateMany({
      where: {
        endedAt: null,
        createdAt: { lt: cutoff },
        messages: { none: { createdAt: { gte: cutoff } } }
      },
      data: { endedAt: new Date() }
    });
    if (res.count > 0) {
      this.logger.log(`Sesiones cerradas por inactividad: ${res.count}`);
    }
  }
}
