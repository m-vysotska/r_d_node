export interface OrderMessage {
  messageId: string;
  orderId: string;
  createdAt: string;
  attempt: number;
  correlationId?: string;
  producer?: string;
  eventName?: string;
}
