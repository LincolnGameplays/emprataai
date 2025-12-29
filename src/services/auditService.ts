/**
 * ⚡ AUDIT SERVICE - Security Logging (Black Box) ⚡
 * Immutable audit logs for security and compliance
 */

import { 
  collection, addDoc, query, where, orderBy, 
  limit, getDocs, Timestamp 
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

export type AuditSeverity = 'info' | 'warning' | 'danger';

export type AuditAction = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE_ORDER'
  | 'CANCEL_ORDER'
  | 'UPDATE_ORDER_STATUS'
  | 'APPLY_DISCOUNT'
  | 'MODIFY_PRICE'
  | 'DELETE_ITEM'
  | 'STOCK_ADJUSTMENT'
  | 'EXPORT_DATA'
  | 'SETTINGS_CHANGE'
  | 'DRIVER_ASSIGNED'
  | 'DELIVERY_CONFIRMED'
  | 'REFUND_ISSUED';

export interface AuditLog {
  id?: string;
  userId: string;
  userEmail?: string;
  userRole?: string;
  action: AuditAction;
  details: Record<string, any>;
  severity: AuditSeverity;
  restaurantId: string;
  timestamp: Timestamp;
  ipAddress?: string;
  userAgent?: string;
}

// ══════════════════════════════════════════════════════════════════
// MAIN LOGGING FUNCTION
// ══════════════════════════════════════════════════════════════════

/**
 * Logs an action to the audit trail
 * This creates an immutable record for security analysis
 */
export async function logAction(
  action: AuditAction,
  details: Record<string, any>,
  severity: AuditSeverity = 'info'
): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn('[Audit] No user logged in, skipping audit log');
      return null;
    }

    const auditLog: Omit<AuditLog, 'id'> = {
      userId: user.uid,
      userEmail: user.email || undefined,
      action,
      details,
      severity,
      restaurantId: user.uid, // Owner's UID = restaurant ID
      timestamp: Timestamp.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    };

    const docRef = await addDoc(collection(db, 'audit_logs'), auditLog);
    
    // Log to console in development
    if (import.meta.env.DEV) {
      const icon = severity === 'danger' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`${icon} [AUDIT] ${action}:`, details);
    }

    return docRef.id;
  } catch (error) {
    console.error('[Audit] Failed to log action:', error);
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════
// QUERY FUNCTIONS
// ══════════════════════════════════════════════════════════════════

/**
 * Get recent audit logs for the current user's restaurant
 */
export async function getRecentLogs(
  limitCount: number = 50,
  severityFilter?: AuditSeverity
): Promise<AuditLog[]> {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    let q = query(
      collection(db, 'audit_logs'),
      where('restaurantId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AuditLog));

    // Filter by severity if specified
    if (severityFilter) {
      return logs.filter(log => log.severity === severityFilter);
    }

    return logs;
  } catch (error) {
    console.error('[Audit] Failed to get logs:', error);
    return [];
  }
}

/**
 * Get logs by action type
 */
export async function getLogsByAction(
  action: AuditAction,
  limitCount: number = 20
): Promise<AuditLog[]> {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const q = query(
      collection(db, 'audit_logs'),
      where('restaurantId', '==', user.uid),
      where('action', '==', action),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AuditLog));
  } catch (error) {
    console.error('[Audit] Failed to get logs by action:', error);
    return [];
  }
}

/**
 * Get danger-level logs (for security review)
 */
export async function getDangerLogs(days: number = 7): Promise<AuditLog[]> {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const q = query(
      collection(db, 'audit_logs'),
      where('restaurantId', '==', user.uid),
      where('severity', '==', 'danger'),
      where('timestamp', '>=', Timestamp.fromDate(cutoffDate)),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AuditLog));
  } catch (error) {
    console.error('[Audit] Failed to get danger logs:', error);
    return [];
  }
}

// ══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS FOR COMMON ACTIONS
// ══════════════════════════════════════════════════════════════════

export const auditHelpers = {
  orderCreated: (orderId: string, total: number) => 
    logAction('CREATE_ORDER', { orderId, total }, 'info'),
  
  orderCancelled: (orderId: string, reason: string, refunded: boolean) =>
    logAction('CANCEL_ORDER', { orderId, reason, refunded }, 'danger'),
  
  discountApplied: (orderId: string, discountPercent: number, originalTotal: number) =>
    logAction('APPLY_DISCOUNT', { orderId, discountPercent, originalTotal }, 
      discountPercent > 30 ? 'warning' : 'info'),
  
  priceModified: (itemId: string, oldPrice: number, newPrice: number) =>
    logAction('MODIFY_PRICE', { itemId, oldPrice, newPrice }, 'warning'),
  
  driverAssigned: (orderId: string, driverId: string, driverName: string) =>
    logAction('DRIVER_ASSIGNED', { orderId, driverId, driverName }, 'info'),
  
  deliveryConfirmed: (orderId: string, method: 'pin' | 'photo', coords?: { lat: number; lng: number }) =>
    logAction('DELIVERY_CONFIRMED', { orderId, method, coords }, 'info'),
  
  refundIssued: (orderId: string, amount: number, reason: string) =>
    logAction('REFUND_ISSUED', { orderId, amount, reason }, 'danger')
};
