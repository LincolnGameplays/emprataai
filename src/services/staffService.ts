/**
 * Staff Service - Team Management
 * CRUD operations for waiters and performance tracking
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy,
  Timestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { 
  WaiterProfile, 
  WaiterPerformance, 
  StaffStats, 
  CreateWaiterInput 
} from '../types/staff';

const STAFF_COLLECTION = 'staff';

// ══════════════════════════════════════════════════════════════════
// GENERATE UNIQUE WAITER ID
// ══════════════════════════════════════════════════════════════════

function generateWaiterId(): string {
  return `waiter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ══════════════════════════════════════════════════════════════════
// CREATE WAITER ACCOUNT
// ══════════════════════════════════════════════════════════════════

export async function createWaiterAccount(input: CreateWaiterInput): Promise<WaiterProfile> {
  const id = generateWaiterId();
  
  const defaultPerformance: WaiterPerformance = {
    totalSales: 0,
    totalOrders: 0,
    averageTicket: 0,
    todaySales: 0,
    todayOrders: 0
  };

  const waiter: WaiterProfile = {
    id,
    ownerId: input.ownerId,
    restaurantId: input.restaurantId,
    name: input.name,
    code: input.code,
    active: true,
    isOnline: false,
    performance: defaultPerformance,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  await setDoc(doc(db, STAFF_COLLECTION, id), waiter);
  
  return waiter;
}

// ══════════════════════════════════════════════════════════════════
// GET STAFF BY OWNER
// ══════════════════════════════════════════════════════════════════

export async function getStaffByOwner(ownerId: string): Promise<WaiterProfile[]> {
  const q = query(
    collection(db, STAFF_COLLECTION),
    where('ownerId', '==', ownerId),
    orderBy('performance.totalSales', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as WaiterProfile);
}

// ══════════════════════════════════════════════════════════════════
// SUBSCRIBE TO STAFF (Real-time)
// ══════════════════════════════════════════════════════════════════

export function subscribeToStaff(
  ownerId: string,
  callback: (staff: WaiterProfile[]) => void
): Unsubscribe {
  const q = query(
    collection(db, STAFF_COLLECTION),
    where('ownerId', '==', ownerId)
  );

  return onSnapshot(q, (snapshot) => {
    const staff = snapshot.docs
      .map(doc => doc.data() as WaiterProfile)
      .sort((a, b) => b.performance.totalSales - a.performance.totalSales);
    callback(staff);
  }, (error) => {
    console.error('Error subscribing to staff:', error);
    callback([]);
  });
}

// ══════════════════════════════════════════════════════════════════
// GET WAITER BY CODE (For PIN Login)
// ══════════════════════════════════════════════════════════════════

export async function getWaiterByCode(
  restaurantId: string, 
  code: string
): Promise<WaiterProfile | null> {
  const q = query(
    collection(db, STAFF_COLLECTION),
    where('restaurantId', '==', restaurantId),
    where('code', '==', code),
    where('active', '==', true)
  );

  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  return snapshot.docs[0].data() as WaiterProfile;
}

// ══════════════════════════════════════════════════════════════════
// GET WAITER BY ID
// ══════════════════════════════════════════════════════════════════

export async function getWaiterById(waiterId: string): Promise<WaiterProfile | null> {
  const docRef = doc(db, STAFF_COLLECTION, waiterId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return docSnap.data() as WaiterProfile;
}

// ══════════════════════════════════════════════════════════════════
// UPDATE WAITER
// ══════════════════════════════════════════════════════════════════

export async function updateWaiter(
  waiterId: string, 
  updates: Partial<WaiterProfile>
): Promise<void> {
  await updateDoc(doc(db, STAFF_COLLECTION, waiterId), {
    ...updates,
    updatedAt: Timestamp.now()
  });
}

// ══════════════════════════════════════════════════════════════════
// TOGGLE WAITER ACTIVE STATUS
// ══════════════════════════════════════════════════════════════════

export async function toggleWaiterActive(waiterId: string, active: boolean): Promise<void> {
  await updateDoc(doc(db, STAFF_COLLECTION, waiterId), {
    active,
    isOnline: active ? undefined : false,
    updatedAt: Timestamp.now()
  });
}

// ══════════════════════════════════════════════════════════════════
// SET WAITER ONLINE STATUS
// ══════════════════════════════════════════════════════════════════

export async function setWaiterOnline(waiterId: string, isOnline: boolean): Promise<void> {
  await updateDoc(doc(db, STAFF_COLLECTION, waiterId), {
    isOnline,
    lastActiveAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
}

// ══════════════════════════════════════════════════════════════════
// UPDATE WAITER PERFORMANCE (Called after order completion)
// ══════════════════════════════════════════════════════════════════

export async function updateWaiterPerformance(
  waiterId: string, 
  orderTotal: number
): Promise<void> {
  const waiter = await getWaiterById(waiterId);
  if (!waiter) return;

  const newTotalOrders = waiter.performance.totalOrders + 1;
  const newTotalSales = waiter.performance.totalSales + orderTotal;
  const newAverageTicket = newTotalSales / newTotalOrders;

  await updateDoc(doc(db, STAFF_COLLECTION, waiterId), {
    'performance.totalOrders': newTotalOrders,
    'performance.totalSales': newTotalSales,
    'performance.averageTicket': newAverageTicket,
    'performance.todayOrders': waiter.performance.todayOrders + 1,
    'performance.todaySales': waiter.performance.todaySales + orderTotal,
    lastActiveAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
}

// ══════════════════════════════════════════════════════════════════
// DELETE WAITER
// ══════════════════════════════════════════════════════════════════

export async function deleteWaiter(waiterId: string): Promise<void> {
  await deleteDoc(doc(db, STAFF_COLLECTION, waiterId));
}

// ══════════════════════════════════════════════════════════════════
// CALCULATE STAFF STATS
// ══════════════════════════════════════════════════════════════════

export function calculateStaffStats(staff: WaiterProfile[]): StaffStats {
  const activeStaff = staff.filter(s => s.active);
  const onlineNow = staff.filter(s => s.isOnline).length;
  const totalSalesViaWaiters = staff.reduce((sum, s) => sum + s.performance.totalSales, 0);
  
  const topPerformer = activeStaff.length > 0
    ? activeStaff.sort((a, b) => b.performance.totalSales - a.performance.totalSales)[0]
    : null;

  return {
    totalStaff: staff.length,
    activeStaff: activeStaff.length,
    onlineNow,
    totalSalesViaWaiters,
    topPerformer: topPerformer ? {
      name: topPerformer.name,
      sales: topPerformer.performance.totalSales
    } : null
  };
}

// ══════════════════════════════════════════════════════════════════
// RESET DAILY PERFORMANCE (Call via Cloud Function at midnight)
// ══════════════════════════════════════════════════════════════════

export async function resetDailyPerformance(ownerId: string): Promise<void> {
  const staff = await getStaffByOwner(ownerId);
  
  const updates = staff.map(waiter => 
    updateDoc(doc(db, STAFF_COLLECTION, waiter.id), {
      'performance.todaySales': 0,
      'performance.todayOrders': 0,
      updatedAt: Timestamp.now()
    })
  );

  await Promise.all(updates);
}
