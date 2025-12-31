
export type UserRole = 'OWNER' | 'CUSTOMER';

export interface MarketplaceConfig {
  isActive: boolean;
  slug: string; // url amigável: emprata.ai/loja/burger-king
  displayName: string;
  description: string;
  bannerUrl: string;
  logoUrl: string;
  cuisineType: string;
  rating: number;
  deliveryFee: number;
  minTime: number;
  maxTime: number;
  isOpen: boolean;
  tags: string[]; // ['Promoção', 'Entrega Grátis', 'Novidade']
  address?: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  // GPS coordinates for distance-based discovery
  location?: {
    lat: number;
    lng: number;
  };
}

export interface Address {
  id: string;
  label: 'casa' | 'trabalho' | 'outro';
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
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  
  // Role management
  roles: UserRole[];
  activeRole: UserRole;
  
  // Marketplace configuration for Owners
  marketplace?: MarketplaceConfig;
  
  // Owner-specific data
  restaurantId?: string;
  restaurantName?: string;
  
  // Customer-specific data
  phone?: string;
  cpf?: string;
  lastAddress?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  
  // Meta
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}
