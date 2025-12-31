
import * as admin from "firebase-admin";
import * as crypto from "crypto";

// ... (Mantenha as interfaces NormalizedOrder no topo iguais)
interface NormalizedOrder {
  source: "IFOOD" | "RAPPI" | "UBER_EATS";
  externalId: string;
  restaurantId: string;
  status: string;
  paymentStatus: string;
  deliveryType: string;
  customer: {
    name: string;
    phone: string;
    id?: string;
    cpf?: string;
  };
  deliveryAddress?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    reference?: string;
  };
  items: any[];
  financials: {
    subtotal?: number;
    deliveryFee?: number;
    discount?: number;
    total: number;
  };
  estimatedDeliveryTime?: number;
  customerNotes?: string;
  integrationMetadata?: any;
  createdAt: admin.firestore.Timestamp | Date;
}

export function normalizeiFoodOrder(payload: any, restaurantId: string): NormalizedOrder {
  // BLINDAGEM: Se payload vier nulo, cria objetos vazios
  const safePayload = payload || {};
  const delivery = safePayload.delivery || {};
  const address = delivery.deliveryAddress || {};
  const customer = safePayload.customer || {};
  const payments = safePayload.payments || {};

  const items = (safePayload.items || []).map((item: any) => ({
    id: item.externalCode || item.id || crypto.randomUUID(),
    name: item.name || "Item sem nome",
    quantity: item.quantity || 1,
    price: (item.unitPrice || 0) / 100,
    options: (item.options || []).map((opt: any) => ({
      name: opt.name,
      price: (opt.unitPrice || 0) / 100,
    })),
    notes: item.observations || "",
  }));

  const subtotal = items.reduce((acc: number, i: any) =>
    acc + (i.price * i.quantity), 0
  );
  const deliveryFee = (delivery.deliveryFee || 0) / 100;
  const discount = (payments.discount || 0) / 100;
  const total = (payments.total?.value || subtotal + deliveryFee - discount) / 100;

  return {
    source: "IFOOD",
    externalId: safePayload.id || `UNKNOWN-${Date.now()}`,
    restaurantId,
    status: "PENDING",
    paymentStatus: payments.prepaid ? "PAID" : "PENDING",
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
    customerNotes: safePayload.additionalInfo || "",
    integrationMetadata: {
      originalPayload: safePayload,
      deliveryMode: delivery.deliveredBy === "IFOOD" ? "MARKETPLACE" : "MERCHANT",
      externalDriverId: delivery.driver?.id,
      commissionRate: 12,
    },
    createdAt: admin.firestore.Timestamp.now(),
  };
}

export function normalizeRappiOrder(payload: any, restaurantId: string): NormalizedOrder {
  const safePayload = payload || {};
  const items = (safePayload.items || safePayload.products || []).map((item: any) => ({
    id: item.sku || item.id || crypto.randomUUID(),
    name: item.name,
    quantity: item.quantity || 1,
    price: item.price || item.unit_price || 0,
    options: (item.toppings || []).map((t: any) => ({
      name: t.name,
      price: t.price || 0,
    })),
  }));

  const address = safePayload.delivery_address || safePayload.client?.address || {};

  return {
    source: "RAPPI",
    externalId: safePayload.order_id || safePayload.id || `RAPPI-${Date.now()}`,
    restaurantId,
    status: "PENDING",
    paymentStatus: safePayload.payment_status === "APPROVED" ? "PAID" : "PENDING",
    deliveryType: safePayload.delivery_method === "pickup" ? "PICKUP" : "DELIVERY",
    customer: {
      name: safePayload.client?.name || safePayload.customer_name || "Cliente Rappi",
      phone: safePayload.client?.phone || safePayload.customer_phone || "",
      id: safePayload.client?.id,
    },
    deliveryAddress: {
      street: address.street || address.address || "Endereço Rappi",
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
      subtotal: safePayload.subtotal || 0,
      deliveryFee: safePayload.delivery_fee || 0,
      discount: safePayload.discount || 0,
      total: safePayload.total || safePayload.order_total || 0,
    },
    estimatedDeliveryTime: safePayload.estimated_delivery_time || 40,
    customerNotes: safePayload.notes || safePayload.comments || "",
    integrationMetadata: {
      originalPayload: safePayload,
      commissionRate: 15,
    },
    createdAt: admin.firestore.Timestamp.now(),
  };
}

export function normalizeUberEatsOrder(payload: any, restaurantId: string): NormalizedOrder {
    // Uber pode mandar payload vazio nos testes de webhook
    const safePayload = payload || {};
    const items = (safePayload.items || safePayload.cart?.items || []).map((item: any) => ({
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
  
    const delivery = safePayload.delivery_info || {};
    const dropoff = delivery.dropoff_info || {};
    const location = dropoff.location || {};
  
    return {
      source: "UBER_EATS",
      externalId: safePayload.id || safePayload.display_id || `UBER-${Date.now()}`,
      restaurantId,
      status: "PENDING",
      paymentStatus: "PAID", 
      deliveryType: safePayload.type === "PICK_UP" ? "PICKUP" : "DELIVERY",
      customer: {
        name: dropoff.contact?.first_name || "Cliente UberEats",
        phone: dropoff.contact?.phone || "",
      },
      deliveryAddress: {
        street: location.street_address || location.address || "Uber Location",
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
        subtotal: safePayload.cart?.total_amount || 0,
        deliveryFee: safePayload.pricing?.delivery_fee || 0,
        discount: safePayload.pricing?.promotions?.total_discount || 0,
        total: safePayload.payment?.total?.amount || 0,
      },
      estimatedDeliveryTime: delivery.estimated_prep_time || 35,
      customerNotes: safePayload.special_instructions || "",
      integrationMetadata: {
        originalPayload: safePayload,
        commissionRate: 30,
      },
      createdAt: admin.firestore.Timestamp.now(),
    };
  }

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
