import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

// Módulo de salud que expone el endpoint para verificar el estado del backend.
@Module({ controllers: [HealthController] })
export class HealthModule { }
