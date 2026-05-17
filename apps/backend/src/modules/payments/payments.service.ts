import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/entities/order.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private repo: Repository<Payment>,
    private ordersService: OrdersService,
    private amqp: AmqpConnection,
  ) {}

  async initiatePayment(userId: string, orderId: string): Promise<Payment> {
    const order = await this.ordersService.findOne(orderId, userId);
    const payment = await this.repo.save(
      this.repo.create({ orderId, userId, amount: order.totalAmount }),
    );
    return payment;
  }

  async processPayment(paymentId: string): Promise<Payment> {
    const payment = await this.repo.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');

    // Simulate payment processing (replace with real Stripe integration)
    const success = Math.random() > 0.1; // 90% success rate for demo

    if (success) {
      payment.status = PaymentStatus.COMPLETED;
      payment.stripePaymentIntentId = `pi_simulated_${Date.now()}`;
      await this.repo.save(payment);
      await this.ordersService.updateStatus(payment.orderId, OrderStatus.PAID);
      await this.amqp.publish('ecommerce', 'payment.completed', {
        paymentId: payment.id,
        orderId: payment.orderId,
        userId: payment.userId,
        amount: payment.amount,
      });
    } else {
      payment.status = PaymentStatus.FAILED;
      await this.repo.save(payment);
      await this.amqp.publish('ecommerce', 'payment.failed', {
        paymentId: payment.id,
        orderId: payment.orderId,
        userId: payment.userId,
      });
    }

    return payment;
  }

  async findByUser(userId: string): Promise<Payment[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async findAll(): Promise<Payment[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }
}
