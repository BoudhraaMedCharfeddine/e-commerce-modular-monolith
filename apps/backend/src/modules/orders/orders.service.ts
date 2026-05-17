import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Order, OrderStatus } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProductsService } from '../catalog/products/products.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private repo: Repository<Order>,
    private productsService: ProductsService,
    private amqp: AmqpConnection,
  ) {}

  async create(userId: string, dto: CreateOrderDto): Promise<Order> {
    let totalAmount = 0;
    const items = [];

    for (const item of dto.items) {
      const product = await this.productsService.findOne(item.productId);
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product: ${product.name}`);
      }
      items.push({ productId: item.productId, quantity: item.quantity, unitPrice: product.price });
      totalAmount += Number(product.price) * item.quantity;
    }

    const order = await this.repo.save(
      this.repo.create({ userId, items, totalAmount, shippingAddress: dto.shippingAddress }),
    );

    for (const item of dto.items) {
      await this.productsService.decrementStock(item.productId, item.quantity);
    }

    await this.amqp.publish('ecommerce', 'order.created', {
      orderId: order.id,
      userId: order.userId,
      totalAmount: order.totalAmount,
      items: dto.items,
    });

    return order;
  }

  async findByUser(userId: string): Promise<Order[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string, userId?: string): Promise<Order> {
    const where: any = { id };
    if (userId) where.userId = userId;
    const order = await this.repo.findOne({ where });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findAll(): Promise<Order[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);
    await this.repo.update(id, { status });
    return { ...order, status };
  }

  async cancel(id: string, userId: string): Promise<Order> {
    const order = await this.findOne(id, userId);
    if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
      throw new BadRequestException('Cannot cancel order in current status');
    }
    await this.repo.update(id, { status: OrderStatus.CANCELLED });

    for (const item of order.items) {
      await this.productsService.incrementStock(item.productId, item.quantity);
    }

    await this.amqp.publish('ecommerce', 'order.cancelled', {
      orderId: order.id,
      userId: order.userId,
    });

    return { ...order, status: OrderStatus.CANCELLED };
  }
}
