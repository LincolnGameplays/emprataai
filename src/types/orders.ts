/**
 * Order Types for Emprata Delivery Hub
 * Unified order model from multiple sources
 */

// ══════════════════════════════════════════════════════════════════
// ORDER SOURCES - De onde veio o pedido
// ══════════════════════════════════════════════════════════════════

export type OrderSource = 'APP_PROPRIO' | 'IFOOD' | 'RAPPI' | 'UBER_EATS' | 'WHATSAPP';

export type OrderStatus = 
  | 'PENDING'           // Aguardando confirmação
  | 'CONFIRMED'         // Restaurante aceitou
  | 'PREPARING'         // Em preparo
  | 'READY_FOR_PICKUP'  // Pronto para coleta
  | 'OUT_FOR_DELIVERY'  // Saiu para entrega
  | 'DELIVERED'         // Entregue
  | 'CANCELLED'         // Cancelado
  | 'REFUNDED';         // Reembolsado

export type DeliveryType = 'DELIVERY' | 'PICKUP' | 'DINE_IN';

// ══════════════════════════════════════════════════════════════════
// ORDER ITEM
// ══════════════════════════════════════════════════════════════════

export interface OrderItem {
  id: string;
  productId?: string;       // ID interno no Emprata (se tiver)
  name: string;
  quantity: number;
  price: number;
  costPrice?: number;       // Para cálculo de lucro
  options?: {
    name: string;
    price: number;
  }[];
  notes?: string;
}

// ══════════════════════════════════════════════════════════════════
// CUSTOMER
// ══════════════════════════════════════════════════════════════════

export interface OrderCustomer {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  documentNumber?: string;  // CPF
}

// ══════════════════════════════════════════════════════════════════
// DELIVERY ADDRESS
// ══════════════════════════════════════════════════════════════════

export interface DeliveryAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  reference?: string;
}

// ══════════════════════════════════════════════════════════════════
// INTEGRATION METADATA
// ══════════════════════════════════════════════════════════════════

export interface IntegrationMetadata {
  originalPayload: unknown;        // Payload original para debug
  externalDriverId?: string;       // ID do motoboy do marketplace
  externalDriverName?: string;
  deliveryMode?: 'MERCHANT' | 'MARKETPLACE';  // Quem faz a entrega
  commissionRate?: number;         // Taxa do marketplace (%)
  estimatedMarketplaceFee?: number;
}

// ══════════════════════════════════════════════════════════════════
// FINANCIALS
// ══════════════════════════════════════════════════════════════════

export interface OrderFinancials {
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  total: number;
  // Após pagamento:
  grossAmount?: number;
  marketplaceFee?: number;      // Taxa iFood/Rappi
  emprataFee?: number;
  costOfGoods?: number;
  netProfit?: number;
  profitMargin?: number;
}

// ══════════════════════════════════════════════════════════════════
// MAIN ORDER INTERFACE
// ══════════════════════════════════════════════════════════════════

export interface Order {
  id: string;
  restaurantId: string;
  
  // Source tracking
  source: OrderSource;
  externalId?: string;          // ID original no iFood/Rappi
  
  // Status
  status: OrderStatus;
  paymentStatus?: 'PENDING' | 'PAID' | 'CREDITED' | 'REFUNDED';
  
  // Delivery
  deliveryType: DeliveryType;
  deliveryAddress?: DeliveryAddress;
  estimatedDeliveryTime?: number; // minutos
  
  // Batching
  batchId?: string;             // ID da rota agrupada
  batchPosition?: number;       // Ordem na rota
  
  // Relations
  customer: OrderCustomer;
  items: OrderItem[];
  financials: OrderFinancials;
  
  // Driver
  driverId?: string;
  driverName?: string; // Nome do motorista
  deliveryPin?: string; // PIN de segurança
  dispatchedAt?: Date;
  deliveredAt?: Date;
  
  // Integration
  integrationMetadata?: IntegrationMetadata;
  
  // Timestamps
  createdAt: Date;
  updatedAt?: Date;
  paidAt?: Date;
  
  // Notes
  customerNotes?: string;
  internalNotes?: string;
}

// ══════════════════════════════════════════════════════════════════
// CREATE ORDER INPUT (para novos pedidos)
// ══════════════════════════════════════════════════════════════════

export type CreateOrderInput = Omit<Order, 'id' | 'createdAt' | 'updatedAt'>;
