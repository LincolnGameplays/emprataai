/**
 * Menu Service - Firestore CRUD Operations
 * Handles all database operations for digital menus
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Menu, MenuFormData } from '../types/menu';

const COLLECTION = 'menus';

// ══════════════════════════════════════════════════════════════════
// CREATE MENU
// ══════════════════════════════════════════════════════════════════

export async function createMenu(data: MenuFormData): Promise<Menu> {
  const menuRef = doc(collection(db, COLLECTION));
  
  const menu: Menu = {
    ...data,
    id: menuRef.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(menuRef, {
    ...menu,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return menu;
}

// ══════════════════════════════════════════════════════════════════
// UPDATE MENU
// ══════════════════════════════════════════════════════════════════

export async function updateMenu(
  menuId: string, 
  data: Partial<MenuFormData>
): Promise<void> {
  const menuRef = doc(db, COLLECTION, menuId);
  
  await updateDoc(menuRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ══════════════════════════════════════════════════════════════════
// GET MENU BY SLUG (Public Access)
// ══════════════════════════════════════════════════════════════════

export async function getMenuBySlug(slug: string): Promise<Menu | null> {
  const q = query(
    collection(db, COLLECTION),
    where('slug', '==', slug.toLowerCase())
  );

  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;

  const docData = snapshot.docs[0].data();
  
  return {
    ...docData,
    id: snapshot.docs[0].id,
    createdAt: (docData.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (docData.updatedAt as Timestamp)?.toDate() || new Date(),
  } as Menu;
}

// ══════════════════════════════════════════════════════════════════
// GET MENU BY OWNER ID
// ══════════════════════════════════════════════════════════════════

export async function getMenuByOwnerId(ownerId: string): Promise<Menu | null> {
  const q = query(
    collection(db, COLLECTION),
    where('ownerId', '==', ownerId)
  );

  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;

  const docData = snapshot.docs[0].data();
  
  return {
    ...docData,
    id: snapshot.docs[0].id,
    createdAt: (docData.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (docData.updatedAt as Timestamp)?.toDate() || new Date(),
  } as Menu;
}

// ══════════════════════════════════════════════════════════════════
// CHECK SLUG AVAILABILITY
// ══════════════════════════════════════════════════════════════════

export async function isSlugAvailable(slug: string, currentMenuId?: string): Promise<boolean> {
  const q = query(
    collection(db, COLLECTION),
    where('slug', '==', slug.toLowerCase())
  );

  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return true;
  
  // If editing, allow the same slug for the current menu
  if (currentMenuId && snapshot.docs[0].id === currentMenuId) return true;
  
  return false;
}

// ══════════════════════════════════════════════════════════════════
// GENERATE SLUG FROM NAME
// ══════════════════════════════════════════════════════════════════

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')     // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')          // Trim leading/trailing hyphens
    .substring(0, 50);                // Limit length
}
