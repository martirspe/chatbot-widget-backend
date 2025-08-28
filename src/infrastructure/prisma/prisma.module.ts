import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Módulo global que provee PrismaService para acceso e inyección de base de datos en toda la aplicación.
@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule { }
