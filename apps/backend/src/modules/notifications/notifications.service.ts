import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  @RabbitSubscribe({
    exchange: 'ecommerce',
    routingKey: 'user.registered',
    queue: 'notifications.user.registered',
    queueOptions: { durable: true },
  })
  async onUserRegistered(msg: { userId: string; email: string; firstName: string }) {
    this.logger.log(`[EMAIL] Welcome email to ${msg.email} (user: ${msg.userId})`);
    // Integrate with nodemailer / SendGrid / SES here
  }

  @RabbitSubscribe({
    exchange: 'ecommerce',
    routingKey: 'order.created',
    queue: 'notifications.order.created',
    queueOptions: { durable: true },
  })
  async onOrderCreated(msg: { orderId: string; userId: string; totalAmount: number }) {
    this.logger.log(`[EMAIL] Order confirmation for order ${msg.orderId}, total: ${msg.totalAmount}`);
  }

  @RabbitSubscribe({
    exchange: 'ecommerce',
    routingKey: 'order.cancelled',
    queue: 'notifications.order.cancelled',
    queueOptions: { durable: true },
  })
  async onOrderCancelled(msg: { orderId: string; userId: string }) {
    this.logger.log(`[EMAIL] Order cancellation notice for order ${msg.orderId}`);
  }

  @RabbitSubscribe({
    exchange: 'ecommerce',
    routingKey: 'payment.completed',
    queue: 'notifications.payment.completed',
    queueOptions: { durable: true },
  })
  async onPaymentCompleted(msg: { paymentId: string; orderId: string; userId: string; amount: number }) {
    this.logger.log(`[EMAIL] Payment confirmation for order ${msg.orderId}, amount: ${msg.amount}`);
  }

  @RabbitSubscribe({
    exchange: 'ecommerce',
    routingKey: 'payment.failed',
    queue: 'notifications.payment.failed',
    queueOptions: { durable: true },
  })
  async onPaymentFailed(msg: { paymentId: string; orderId: string; userId: string }) {
    this.logger.log(`[EMAIL] Payment failure notice for order ${msg.orderId}`);
  }
}
