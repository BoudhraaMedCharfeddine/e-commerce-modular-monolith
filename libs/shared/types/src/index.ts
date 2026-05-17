// Shared event contracts used by both backend and frontend types
export interface OrderCreatedEvent {
  orderId: string;
  userId: string;
  totalAmount: number;
  items: Array<{ productId: string; quantity: number }>;
}

export interface PaymentCompletedEvent {
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
}

export interface PaymentFailedEvent {
  paymentId: string;
  orderId: string;
  userId: string;
}

export interface UserRegisteredEvent {
  userId: string;
  email: string;
  firstName: string;
}

export interface OrderCancelledEvent {
  orderId: string;
  userId: string;
}
