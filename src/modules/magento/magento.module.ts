import { Module } from '@nestjs/common';
import { MagentoController } from './presentation/magento.controller';
import { MagentoService } from './application/magento.service';

// Módulo de Magento que agrupa el controlador y servicio para consultar órdenes.
@Module({ controllers: [MagentoController], providers: [MagentoService] })
export class MagentoModule { }
