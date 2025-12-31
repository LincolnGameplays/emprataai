
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

export const onOrderCreated = onDocumentCreated("orders/{orderId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    return;
  }

  const order = snapshot.data();
  const orderId = event.params.orderId;
  const db = admin.firestore();

  // 1. Create Notification for Restaurant/Waiter
  const notification = {
    restaurantId: order.restaurantId,
    type: 'NEW_ORDER',
    title: `Novo Pedido #${orderId.slice(-4)}`,
    message: `Mesa ${order.tableId || 'Delivery'}: ${order.items.length} itens. Total: R$ ${order.total.toFixed(2)}`,
    data: {
      orderId: orderId,
      tableId: order.tableId,
      source: order.source
    },
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('notifications').add(notification);

  // 2. Handle "Pay on Delivery" specifics
  if (order.paymentMethod === 'cash' && order.changeFor) {
    const change = order.changeFor - order.total;
    if (change > 0) {
      await db.collection('notifications').add({
        restaurantId: order.restaurantId,
        type: 'CASH_CHANGE',
        title: '⚠️ Troco Necessário',
        message: `Levar troco de R$ ${change.toFixed(2)} para o pedido #${orderId.slice(-4)}`,
        data: { orderId, change },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  console.log(`[Order ${orderId}] Notifications sent.`);
});
