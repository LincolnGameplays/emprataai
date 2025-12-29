/**
 * ⚡ INVENTORY SERVICE - Stock Management with Firestore ⚡
 * Connects sales with ingredients using atomic transactions
 */

import { 
  collection, doc, runTransaction, getDocs, 
  query, where, Timestamp, updateDoc 
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { logAction } from './auditService';

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

export interface Ingredient {
  id: string;
  name: string;
  currentStock: number;
  unit: 'kg' | 'g' | 'un' | 'ml' | 'L';
  minThreshold: number;
  costPerUnit: number;
  category: string;
  lastUpdated: Timestamp;
}

export interface RecipeItem {
  ingredientId: string;
  ingredientName?: string;
  quantity: number;
}

export interface LowStockAlert {
  ingredient: Ingredient;
  deficit: number;
  urgency: 'critical' | 'warning' | 'normal';
}

export interface StockDeductionResult {
  success: boolean;
  deductions: { ingredientId: string; name: string; deducted: number }[];
  errors: string[];
}

// ══════════════════════════════════════════════════════════════════
// STOCK DEDUCTION
// ══════════════════════════════════════════════════════════════════

/**
 * Deducts stock based on order items using atomic transaction
 * Should be called when order status changes to 'preparing'
 */
export async function deductStock(
  orderItems: { menuItemId: string; quantity: number }[]
): Promise<StockDeductionResult> {
  const result: StockDeductionResult = {
    success: false,
    deductions: [],
    errors: []
  };

  const user = auth.currentUser;
  if (!user) {
    result.errors.push('User not authenticated');
    return result;
  }

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Get all menu items with their recipes
      const menuItemsRef = collection(db, `restaurants/${user.uid}/menu_items`);
      const menuSnapshot = await getDocs(menuItemsRef);
      
      const menuItemsMap = new Map<string, { recipe?: RecipeItem[] }>();
      menuSnapshot.docs.forEach(doc => {
        menuItemsMap.set(doc.id, doc.data() as { recipe?: RecipeItem[] });
      });

      // 2. Calculate total ingredients needed
      const ingredientsNeeded = new Map<string, number>();
      
      for (const orderItem of orderItems) {
        const menuItem = menuItemsMap.get(orderItem.menuItemId);
        if (menuItem?.recipe) {
          for (const recipeItem of menuItem.recipe) {
            const current = ingredientsNeeded.get(recipeItem.ingredientId) || 0;
            ingredientsNeeded.set(
              recipeItem.ingredientId, 
              current + (recipeItem.quantity * orderItem.quantity)
            );
          }
        }
      }

      // 3. Deduct from each ingredient
      for (const [ingredientId, quantityNeeded] of ingredientsNeeded) {
        const ingredientRef = doc(db, `restaurants/${user.uid}/ingredients`, ingredientId);
        const ingredientDoc = await transaction.get(ingredientRef);
        
        if (!ingredientDoc.exists()) {
          result.errors.push(`Ingredient ${ingredientId} not found`);
          continue;
        }

        const ingredient = ingredientDoc.data() as Ingredient;
        const newStock = ingredient.currentStock - quantityNeeded;

        if (newStock < 0) {
          result.errors.push(`Insufficient stock for ${ingredient.name}`);
          // Still deduct to 0 (track negative stock)
        }

        transaction.update(ingredientRef, {
          currentStock: Math.max(0, newStock),
          lastUpdated: Timestamp.now()
        });

        result.deductions.push({
          ingredientId,
          name: ingredient.name,
          deducted: quantityNeeded
        });
      }
    });

    result.success = result.errors.length === 0;

    // Log the action
    if (result.deductions.length > 0) {
      await logAction('STOCK_ADJUSTMENT', {
        type: 'deduction',
        items: result.deductions,
        errors: result.errors
      }, result.errors.length > 0 ? 'warning' : 'info');
    }

    return result;
  } catch (error) {
    console.error('[Inventory] Stock deduction failed:', error);
    result.errors.push(error instanceof Error ? error.message : 'Transaction failed');
    return result;
  }
}

// ══════════════════════════════════════════════════════════════════
// LOW STOCK CHECK
// ══════════════════════════════════════════════════════════════════

/**
 * Returns list of ingredients below minimum threshold
 */
export async function checkLowStock(): Promise<LowStockAlert[]> {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const ingredientsRef = collection(db, `restaurants/${user.uid}/ingredients`);
    const snapshot = await getDocs(ingredientsRef);
    
    const alerts: LowStockAlert[] = [];

    snapshot.docs.forEach(doc => {
      const ingredient = { id: doc.id, ...doc.data() } as Ingredient;
      
      if (ingredient.currentStock <= ingredient.minThreshold) {
        const deficit = ingredient.minThreshold - ingredient.currentStock;
        const percentBelow = (ingredient.currentStock / ingredient.minThreshold) * 100;
        
        let urgency: 'critical' | 'warning' | 'normal' = 'normal';
        if (ingredient.currentStock === 0) {
          urgency = 'critical';
        } else if (percentBelow < 50) {
          urgency = 'warning';
        }

        alerts.push({ ingredient, deficit, urgency });
      }
    });

    // Sort by urgency (critical first)
    return alerts.sort((a, b) => {
      const urgencyOrder = { critical: 0, warning: 1, normal: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
  } catch (error) {
    console.error('[Inventory] Low stock check failed:', error);
    return [];
  }
}

// ══════════════════════════════════════════════════════════════════
// MANUAL STOCK ADJUSTMENT
// ══════════════════════════════════════════════════════════════════

/**
 * Manually adjust stock (for inventory counts or deliveries)
 */
export async function adjustStock(
  ingredientId: string,
  newStock: number,
  reason: string
): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;

  try {
    const ingredientRef = doc(db, `restaurants/${user.uid}/ingredients`, ingredientId);
    
    await updateDoc(ingredientRef, {
      currentStock: newStock,
      lastUpdated: Timestamp.now()
    });

    await logAction('STOCK_ADJUSTMENT', {
      type: 'manual',
      ingredientId,
      newStock,
      reason
    }, 'info');

    return true;
  } catch (error) {
    console.error('[Inventory] Stock adjustment failed:', error);
    return false;
  }
}

// ══════════════════════════════════════════════════════════════════
// GET ALL INGREDIENTS
// ══════════════════════════════════════════════════════════════════

export async function getAllIngredients(): Promise<Ingredient[]> {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const ingredientsRef = collection(db, `restaurants/${user.uid}/ingredients`);
    const snapshot = await getDocs(ingredientsRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Ingredient));
  } catch (error) {
    console.error('[Inventory] Failed to get ingredients:', error);
    return [];
  }
}
