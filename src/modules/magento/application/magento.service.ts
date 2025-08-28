import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';

// Servicio para consultar el estado de órdenes en Magento usando la API REST.
@Injectable()
export class MagentoService {
  private base = process.env.MAGENTO_BASE_URL;
  private token = process.env.MAGENTO_ACCESS_TOKEN;

  // Obtiene el estado de una orden por su ID usando la API de Magento.
  async getOrderStatus(orderId: string) {
    if (!orderId) throw new BadRequestException('orderId requerido');
    const url = `${this.base}/rest/V1/orders?searchCriteria[filterGroups][0][filters][0][field]=increment_id&searchCriteria[filterGroups][0][filters][0][value]=${orderId}&searchCriteria[filterGroups][0][filters][0][condition_type]=eq`;
    const r = await axios.get(url, { headers: { Authorization: `Bearer ${this.token}` }, timeout: 8000 });
    const items = r.data?.items || [];
    if (!items.length) {
      return {
        found: false,
        orderId,
        message: `No existe la orden con increment_id ${orderId} en Magento.`
      };
    }
    const order = items[0];
    return { found: true, orderId, status: order.status, created_at: order.created_at, grand_total: order.grand_total };
  }
}
