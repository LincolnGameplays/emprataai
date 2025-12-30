/**
 * Integration Adapters - Normalize external orders to Emprata format
 * Converts iFood, Rappi, UberEats payloads to unified Order type
 */

import * as admin from "firebase-admin";

// ══════════════════════════════════════════════════════════════════
// COMMON TYPES
// ══════════════════════════════════════════════════════════════════

interface NormalizedOrder {
  source: "IFOOD" | "RAPPI" | "UBER_EATS";
  externalId: string;
  restaurantId: string;
  status: "PENDING";
  paymentStatus: "PENDING" | "PAID";
  deliveryType: "DELIVERY" | "PICKUP";
  customer: {
    name: string;
    phone: string;
    id?: string;
  };
  deliveryAddress?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode?: string;
    coordinates?: { lat: number; lng: number };
    reference?: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    options?: Array<{ name: string; price: number }>;
    notes?: string;
  }>;
  financials: {
    subtotal: number;
    deliveryFee: number;
    discount?: number;
    total: number;
  };
  estimatedDeliveryTime?: number;
  customerNotes?: string;
  integrationMetadata: {
    originalPayload: unknown;
    deliveryMode?: "MERCHANT" | "MARKETPLACE";
    externalDriverId?: string;
    commissionRate?: number;
  };
  createdAt: admin.firestore.Timestamp;
}

// ══════════════════════════════════════════════════════════════════
// IFOOD ADAPTER
// Docs: https://developer.ifood.com.br/en-US/docs/guides/modules/order/events
// ══════════════════════════════════════════════════════════════════

export function normalizeiFoodOrder(payload: any, restaurantId: string): NormalizedOrder {
  const delivery = payload.delivery || {};
  const address = delivery.deliveryAddress || {};
  const customer = payload.customer || {};
  const payments = payload.payments || {};

  // Normaliza items
  const items = (payload.items || []).map((item: any) => ({
    id: item.externalCode || item.id || crypto.randomUUID(),
    name: item.name,
    quantity: item.quantity || 1,
    price: (item.unitPrice || 0) / 100, // iFood envia em centavos
    options: (item.options || []).map((opt: any) => ({
      name: opt.name,
      price: (opt.unitPrice || 0) / 100,
    })),
    notes: item.observations || "",
  }));

  // Calcula totais
  const subtotal = items.reduce((acc: number, i: any) =>
    acc + (i.price * i.quantity), 0
  );
  const deliveryFee = (delivery.deliveryFee || 0) / 100;
  const discount = (payments.discount || 0) / 100;
  const total = (payments.total?.value || subtotal + deliveryFee - discount) / 100;

  return {
    source: "IFOOD",
    externalId: payload.id,
    restaurantId,
    status: "PENDING",
    paymentStatus: payload.payments?.prepaid ? "PAID" : "PENDING",
    deliveryType: delivery.deliveredBy === "MERCHANT" ? "DELIVERY" : "PICKUP",
    customer: {
      name: customer.name || "Cliente iFood",
      phone: customer.phone?.number || customer.phone || "",
      id: customer.id,
    },
    deliveryAddress: address.streetName ? {
      street: address.streetName,
      number: address.streetNumber || "S/N",
      complement: address.complement,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zipCode: address.postalCode,
      coordinates: address.coordinates ? {
        lat: address.coordinates.latitude,
        lng: address.coordinates.longitude,
      } : undefined,
      reference: address.reference,
    } : undefined,
    items,
    financials: {
      subtotal,
      deliveryFee,
      discount,
      total,
    },
    estimatedDeliveryTime: delivery.estimatedDeliveryTime || 45,
    customerNotes: payload.additionalInfo || "",
    integrationMetadata: {
      originalPayload: payload,
      deliveryMode: delivery.deliveredBy === "IFOOD" ? "MARKETPLACE" : "MERCHANT",
      externalDriverId: delivery.driver?.id,
      commissionRate: 12, // Taxa média iFood
    },
    createdAt: admin.firestore.Timestamp.now(),
  };
}

// ══════════════════════════════════════════════════════════════════
// RAPPI ADAPTER
// ══════════════════════════════════════════════════════════════════

export function normalizeRappiOrder(payload: any, restaurantId: string): NormalizedOrder {
  const items = (payload.items || payload.products || []).map((item: any) => ({
    id: item.sku || item.id || crypto.randomUUID(),
    name: item.name,
    quantity: item.quantity || 1,
    price: item.price || item.unit_price || 0,
    options: (item.toppings || []).map((t: any) => ({
      name: t.name,
      price: t.price || 0,
    })),
  }));

  const address = payload.delivery_address || payload.client?.address || {};

  return {
    source: "RAPPI",
    externalId: payload.order_id || payload.id,
    restaurantId,
    status: "PENDING",
    paymentStatus: payload.payment_status === "APPROVED" ? "PAID" : "PENDING",
    deliveryType: payload.delivery_method === "pickup" ? "PICKUP" : "DELIVERY",
    customer: {
      name: payload.client?.name || payload.customer_name || "Cliente Rappi",
      phone: payload.client?.phone || payload.customer_phone || "",
      id: payload.client?.id,
    },
    deliveryAddress: {
      street: address.street || address.address,
      number: address.number || "S/N",
      complement: address.complement,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zipCode: address.zip_code,
      coordinates: address.lat ? {
        lat: address.lat,
        lng: address.lng || address.lon,
      } : undefined,
    },
    items,
    financials: {
      subtotal: payload.subtotal || payload.products_total || 0,
      deliveryFee: payload.delivery_fee || payload.delivery_cost || 0,
      discount: payload.discount || 0,
      total: payload.total || payload.order_total || 0,
    },
    estimatedDeliveryTime: payload.estimated_delivery_time || 40,
    customerNotes: payload.notes || payload.comments || "",
    integrationMetadata: {
      originalPayload: payload,
      deliveryMode: payload.logistics === "rappi" ? "MARKETPLACE" : "MERCHANT",
      commissionRate: 15, // Taxa média Rappi
    },
    createdAt: admin.firestore.Timestamp.now(),
  };
}

// ══════════════════════════════════════════════════════════════════
// UBER EATS ADAPTER
// ══════════════════════════════════════════════════════════════════

export function normalizeUberEatsOrder(payload: any, restaurantId: string): NormalizedOrder {
  const items = (payload.items || payload.cart?.items || []).map((item: any) => ({
    id: item.external_data || item.id || crypto.randomUUID(),
    name: item.title || item.name,
    quantity: item.quantity || 1,
    price: item.price?.unit_price?.amount || item.price || 0,
    options: (item.selected_modifier_groups || []).flatMap((g: any) =>
      (g.selected_items || []).map((s: any) => ({
        name: s.title || s.name,
        price: s.price?.amount || 0,
      }))
    ),
  }));

  const delivery = payload.delivery_info || {};
  const dropoff = delivery.dropoff_info || {};
  const location = dropoff.location || {};

  return {
    source: "UBER_EATS",
    externalId: payload.id || payload.display_id,
    restaurantId,
    status: "PENDING",
    paymentStatus: "PAID", // UberEats sempre prepago
    deliveryType: payload.type === "PICK_UP" ? "PICKUP" : "DELIVERY",
    customer: {
      name: dropoff.contact?.first_name || "Cliente UberEats",
      phone: dropoff.contact?.phone || "",
    },
    deliveryAddress: {
      street: location.street_address || location.address,
      number: location.unit || "",
      neighborhood: location.sub_locality || "",
      city: location.city,
      state: location.state,
      zipCode: location.postal_code,
      coordinates: location.latitude ? {
        lat: location.latitude,
        lng: location.longitude,
      } : undefined,
    },
    items,
    financials: {
      subtotal: payload.cart?.total_amount || 0,
      deliveryFee: payload.pricing?.delivery_fee || 0,
      discount: payload.pricing?.promotions?.total_discount || 0,
      total: payload.payment?.total?.amount || 0,
    },
    estimatedDeliveryTime: delivery.estimated_prep_time || 35,
    customerNotes: payload.special_instructions || "",
    integrationMetadata: {
      originalPayload: payload,
      deliveryMode: delivery.delivery_type === "DELI_PARTNER" ? "MARKETPLACE" : "MERCHANT",
      externalDriverId: delivery.courier?.uuid,
      commissionRate: 30, // UberEats taxa alta
    },
    createdAt: admin.firestore.Timestamp.now(),
  };
}

// ══════════════════════════════════════════════════════════════════
// GENERIC NORMALIZER
// ══════════════════════════════════════════════════════════════════

export function normalizeExternalOrder(
  source: string,
  payload: any,
  restaurantId: string
): NormalizedOrder | null {
  switch (source.toUpperCase()) {
  case "IFOOD":
    return normalizeiFoodOrder(payload, restaurantId);
  case "RAPPI":
    return normalizeRappiOrder(payload, restaurantId);
  case "UBER_EATS":
  case "UBEREATS":
    return normalizeUberEatsOrder(payload, restaurantId);
  default:
    console.warn(`[ADAPTER] Source desconhecida: ${source}`);
    return null;
  }
}
