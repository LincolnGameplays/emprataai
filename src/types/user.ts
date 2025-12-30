/**
 * ⚡ USER TYPES - EmprataAI Marketplace ⚡
 * Distinguishes between Restaurant Owners, Staff, and Consumers
 */

// ══════════════════════════════════════════════════════════════════
// USER ROLES
// ══════════════════════════════════════════════════════════════════

export type UserRole = 'owner' | 'staff' | 'consumer';

// ══════════════════════════════════════════════════════════════════
// ADDRESS
// ══════════════════════════════════════════════════════════════════

export interface Address {
  id: string;
  label: 'casa' | 'trabalho' | 'outro';
  customLabel?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  reference?: string;
  coords?: {
    lat: number;
    lng: number;
  };
  isDefault?: boolean;
}

// ══════════════════════════════════════════════════════════════════
// CONSUMER PROFILE
// ══════════════════════════════════════════════════════════════════

export interface ConsumerProfile {
  savedAddresses: Address[];
  favorites: string[]; // restaurantIds
  orderHistory: string[]; // orderIds
  emprataCoins: number; // Gamification
  coupons: Coupon[];
  preferences: {
    vibes?: string[]; // 'comfort', 'fitness', etc
    allergies?: string[];
    dietaryRestrictions?: string[];
  };
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'delivery_free';
  value: number;
  minOrder?: number;
  maxDiscount?: number;
  expiresAt?: Date;
  usedAt?: Date;
  restaurantId?: string; // If specific to one restaurant
}

// ══════════════════════════════════════════════════════════════════
// RESTAURANT PROFILE (for owners)
// ══════════════════════════════════════════════════════════════════

export interface RestaurantProfile {
  id: string;
  name: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  logoUrl?: string;
  categories: string[]; // 'Pizza', 'Hambúrguer', 'Sushi'
  vibes: string[]; // 'comfort', 'fitness', etc
  rating: number;
  reviewCount: number;
  deliveryTime: {
    min: number;
    max: number;
  };
  deliveryFee: number;
  minimumOrder: number;
  isOpen: boolean;
  openingHours: {
    [day: string]: { open: string; close: string } | null;
  };
  coords: {
    lat: number;
    lng: number;
  };
  address: Address;
  phone: string;
  whatsapp?: string;
  acceptsOnlinePayment: boolean;
  acceptsCashPayment: boolean;
  acceptsCardOnDelivery: boolean;
}

// ══════════════════════════════════════════════════════════════════
// USER (Base)
// ══════════════════════════════════════════════════════════════════

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phone?: string;
  cpfCnpj?: string;
  role: UserRole;
  plan?: 'free' | 'starter' | 'growth' | 'scale';
  credits?: number;
  createdAt: Date;
  
  // Restaurant-specific (role === 'owner')
  restaurant?: RestaurantProfile;
  
  // Consumer-specific (role === 'consumer')
  consumer?: ConsumerProfile;
  
  // Finance (Asaas)
  asaasCustomerId?: string;
  finance?: {
    asaasAccountId?: string;
    asaasWalletId?: string;
    status?: 'active' | 'pending' | 'blocked';
  };
  subscription?: {
    id: string;
    plan: string;
    status: 'active' | 'pending' | 'cancelled' | 'overdue' | 'refunded';
    renewsAt?: Date;
  };
}
