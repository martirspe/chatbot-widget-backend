
import { Module } from '@nestjs/common';
import { MagentoController } from './presentation/magento.controller';
import { MagentoService } from './application/magento.service';

@Module({ controllers: [MagentoController], providers: [MagentoService] })
export class MagentoModule { }
