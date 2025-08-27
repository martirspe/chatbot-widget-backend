
import { Controller, Get, Query } from '@nestjs/common';
import { MagentoService } from '../application/magento.service';

@Controller('magento')
export class MagentoController {
  constructor(
    private readonly magento: MagentoService
  ) { }

  @Get('order-status') orderStatus(@Query('orderId') orderId: string) {
    return this.magento.getOrderStatus(orderId);
  }
}
