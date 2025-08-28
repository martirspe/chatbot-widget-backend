import { Controller, Get, Query } from '@nestjs/common';
import { MagentoService } from '../application/magento.service';

// Controlador que expone el endpoint GET /magento/order-status para consultar el estado de una orden en Magento.
@Controller('magento')
@Controller('magento')
export class MagentoController {

  // Inyecta el servicio para consultar información de Magento.
  constructor(
    private readonly magento: MagentoService
  ) { }

  // Consulta el estado de una orden por su ID usando el servicio Magento.
  @Get('order-status')
  orderStatus(@Query('orderId') orderId: string) {
    return this.magento.getOrderStatus(orderId);
  }
}
