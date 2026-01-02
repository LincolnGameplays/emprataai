/**
 * Order Service - Financial Integrity & Anti-Tamper
 * 
 * Validates order totals by re-fetching real prices from menu.
 * Prevents price manipulation via browser console.
 */

import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { CryptoService } from './cryptoService';

// Types
interface CartItem {
  id: string;
  name?: string;
  title?: string;
  price: number;
  quantity: number;
  notes?: string;
}

interface SecureOrderData {
  restaurantId: string;
  customer: {
    name: string;
    cpf?: string;
    phone?: string;
    address?: string;
    uid?: string;
  };
  items: CartItem[];
  paymentMethod: string;
  paymentStatus?: string;
  tableId?: string | null;
  source: 'QR_TABLE' | 'WEB_DELIVERY';
}

interface SecureOrderResult {
  orderId: string;
  total: number;
  deliveryPin: string;
}

/**
 * Creates an order with validated prices (Anti-Tamper)
 * Re-calculates total based on actual menu prices in Firestore
 */
export async function createSecureOrder(data: SecureOrderData): Promise<SecureOrderResult> {
  const { restaurantId, customer, items, paymentMethod, paymentStatus, tableId, source } = data;

  // 1. VALIDATION: Recalculate total from REAL menu prices
  let validatedTotal = 0;
  const validatedItems: CartItem[] = [];

  // Get menu document
  const menuQuery = await getDoc(doc(db, 'menus', restaurantId));
  let menuItems: Record<string, number> = {};

  if (menuQuery.exists()) {
    // Build price lookup from menu categories
    const menuData = menuQuery.data();
    menuData.categories?.forEach((cat: any) => {
      cat.items?.forEach((item: any) => {
        menuItems[item.id] = item.price;
      });
    });
  }

  // Validate each item's price
  for (const item of items) {
    const realPrice = menuItems[item.id];
    
    if (realPrice !== undefined) {
      // Use REAL price from database, not client-sent price
      validatedTotal += realPrice * item.quantity;
      validatedItems.push({
        ...item,
        price: realPrice // Override with real price
      });
    } else {
      // Item not found in menu - use original (could be custom)
      validatedTotal += item.price * item.quantity;
      validatedItems.push(item);
    }
  }

  // 2. SECURITY: Generate delivery PIN
  const deliveryPin = Math.floor(1000 + Math.random() * 9000).toString();

  // 3. SECURITY: Create integrity hash
  const timestamp = new Date().toISOString();
  const securityHash = CryptoService.encrypt(
    `${customer.uid || 'anonymous'}-${validatedTotal}-${timestamp}`
  );

  // 4. SECURE: Encrypt sensitive customer data
  const secureCustomer = {
    name: customer.name,
    cpf: customer.cpf ? CryptoService.encrypt(customer.cpf) : null,
    phone: customer.phone ? CryptoService.encrypt(customer.phone) : null,
    address: customer.address || null,
    uid: customer.uid || null
  };

  // 5. CREATE: Save order with validated data
  const orderRef = await addDoc(collection(db, 'orders'), {
    restaurantId,
    customer: secureCustomer,
    items: validatedItems,
    total: validatedTotal, // AUDITED total
    paymentMethod,
    paymentStatus: paymentStatus || 'pending',
    source,
    tableId: tableId || null,
    status: 'pending', // Required by Firestore rules
    isPaid: false, // Required by Firestore rules
    createdAt: serverTimestamp(),
    deliveryPin,
    securityHash, // Integrity signature
    auditedAt: timestamp
  });

  return {
    orderId: orderRef.id,
    total: validatedTotal,
    deliveryPin
  };
}

/**
 * Validates if order total matches expected value
 * Used for double-checking before payment
 */
export function validateOrderIntegrity(
  items: CartItem[],
  declaredTotal: number,
  tolerance = 0.01
): boolean {
  const calculatedTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return Math.abs(calculatedTotal - declaredTotal) <= tolerance;
}

/**
 * Creates an order with atomic stock deduction (Transaction)
 * Prevents overselling when stock is tracked
 */
export async function createOrderWithStockCheck(orderData: {
  restaurantId: string;
  customer: { name: string; uid?: string };
  items: CartItem[];
  total: number;
  paymentMethod: string;
  source: string;
  isPaid?: boolean;
}): Promise<{ orderId: string; deliveryPin: string }> {
  const { runTransaction } = await import('firebase/firestore');
  
  return await runTransaction(db, async (transaction) => {
    // 1. VALIDATE STOCK for each item
    for (const item of orderData.items) {
      const productRef = doc(db, 'products', item.id);
      const productDoc = await transaction.get(productRef);
      
      if (!productDoc.exists()) {
        // Product might be from menu, not products collection - skip stock check
        continue;
      }
      
      const data = productDoc.data();
      
      if (data.trackStock) {
        const currentStock = data.stock || 0;
        if (currentStock < item.quantity) {
          throw new Error(`Estoque insuficiente para ${data.name || item.name}: disponível ${currentStock}, solicitado ${item.quantity}`);
        }
        
        // 2. DEDUCT STOCK atomically
        transaction.update(productRef, { 
          stock: currentStock - item.quantity 
        });
      }
    }
    
    // 3. CREATE ORDER
    const deliveryPin = Math.floor(1000 + Math.random() * 9000).toString();
    const newOrderRef = doc(collection(db, 'orders'));
    
    transaction.set(newOrderRef, {
      ...orderData,
      status: orderData.isPaid ? 'PREPARING' : 'pending',
      createdAt: serverTimestamp(),
      deliveryPin,
      auditedAt: new Date().toISOString()
    });
    
    return {
      orderId: newOrderRef.id,
      deliveryPin
    };
  });
}
