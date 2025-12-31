import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {ASAAS_CONFIG, calculateEmprataFee} from "./constants";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

export const financeWebhook = onRequest(async (req, res) => {
  const token = req.headers["asaas-access-token"];

  if (token !== ASAAS_CONFIG.webhookToken) {
    res.status(401).send("Unauthorized");
    return;
  }

  const event = req.body;

  try {
    switch (event.event) {
      case "PAYMENT_RECEIVED":
      case "PAYMENT_CONFIRMED":
        await handlePaymentCredit(event.payment);
        break;
      
      case "PAYMENT_OVERDUE":
      case "PAYMENT_DELETED":
        await handlePaymentFailed(event.payment, "EXPIRED");
        break;

      case "PAYMENT_CHARGEBACK_REQUESTED":
        await handlePaymentFailed(event.payment, "CHARGEBACK");
        break;
    }
    res.status(200).send({received: true});
  } catch (error) {
    console.error("[WEBHOOK ERROR]", error);
    res.status(200).send({error: "Internal logic error"});
  }
});

async function handlePaymentCredit(payment: any) {
  const externalRef = payment.externalReference;
  if (!externalRef || externalRef.startsWith("SUB_")) return;

  const orderId = externalRef;
  const orderRef = db.collection("orders").doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) return;
  const orderData = orderDoc.data();

  if (orderData?.paymentStatus === "CREDITED") return;

  const restaurantId = orderData?.restaurantId;
  if (!restaurantId) return;

  // 1. Cálculos Financeiros
  const grossAmount = payment.value;
  const userRef = db.collection("users").doc(restaurantId);
  const userDoc = await userRef.get();
  const userData = userDoc.data();
  const plan = userData?.plan || "free";

  // Calcula taxa Emprata
  const {restaurantAmount, emprataFee} = calculateEmprataFee(grossAmount, plan);

  // 2. PROFIT-FIRST: Calcula custo dos insumos
  let totalCost = 0;
  const items = orderData?.items || [];
  const menuRef = db.collection("users").doc(restaurantId).collection("menu");

  for (const item of items) {
    if (item.productId) {
      const productDoc = await menuRef.doc(item.productId).get();
      if (productDoc.exists) {
        const productData = productDoc.data();
        const costPrice = productData?.costPrice || 0;
        totalCost += costPrice * (item.quantity || 1);
      }
    }
  }

  // Custo de entrega (se aplicável)
  const deliveryCost = orderData?.deliveryFee || 0;

  // Lucro Líquido Real
  const netProfit = restaurantAmount - totalCost - deliveryCost;
  const profitMargin = restaurantAmount > 0 ? (netProfit / restaurantAmount) * 100 : 0;

  // 3. ATUALIZA SALDO VIRTUAL NO FIRESTORE
  await db.runTransaction(async (transaction) => {
    const freshUser = await transaction.get(userRef);
    const currentBalance = freshUser.data()?.wallet?.balance || 0;
    const newBalance = parseFloat((currentBalance + restaurantAmount).toFixed(2));

    // Atualiza saldo
    transaction.update(userRef, {
      "wallet.balance": newBalance,
      "wallet.lastTransaction": admin.firestore.FieldValue.serverTimestamp(),
    });

    // Marca pedido como Pago
    transaction.update(orderRef, {
      status: "PAID",
      paymentStatus: "CREDITED",
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentId: payment.id,
      financials: {
        grossAmount,
        emprataFee,
        restaurantAmount,
        costOfGoods: totalCost,
        deliveryCost,
        netProfit: parseFloat(netProfit.toFixed(2)),
        profitMargin: parseFloat(profitMargin.toFixed(1)),
      },
    });

    // Extrato com dados de lucro
    const statementRef = userRef.collection("finance_statement").doc();
    transaction.set(statementRef, {
      type: "SALE",
      amount: restaurantAmount,
      grossAmount: grossAmount,
      orderId: orderId,
      description: `Venda Pedido #${orderId.slice(0, 5)}`,
      // PROFIT-FIRST DATA
      costOfGoods: totalCost,
      emprataFee: emprataFee,
      deliveryCost: deliveryCost,
      netProfit: parseFloat(netProfit.toFixed(2)),
      profitMargin: parseFloat(profitMargin.toFixed(1)),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Atualiza totais acumulados do dia
    const today = new Date().toISOString().split("T")[0];
    const dailyStatsRef = userRef.collection("daily_stats").doc(today);
    transaction.set(dailyStatsRef, {
      date: today,
      totalSales: admin.firestore.FieldValue.increment(grossAmount),
      totalRevenue: admin.firestore.FieldValue.increment(restaurantAmount),
      totalCosts: admin.firestore.FieldValue.increment(totalCost),
      totalProfit: admin.firestore.FieldValue.increment(netProfit),
      ordersCount: admin.firestore.FieldValue.increment(1),
    }, {merge: true});

    // Notificação
    const notifRef = userRef.collection("notifications").doc();
    transaction.set(notifRef, {
      type: "SALE_CREDITED",
      title: "Venda Aprovada",
      body: `+ R$ ${restaurantAmount.toFixed(2)} | Lucro: R$ ${netProfit.toFixed(2)} (${profitMargin.toFixed(0)}%)`,
      date: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
    });
  });

  console.log(
    `[WALLET CREDIT] Restaurante ${restaurantId} | ` +
    `Venda: R$ ${grossAmount} | Lucro: R$ ${netProfit.toFixed(2)} (${profitMargin.toFixed(0)}%)`
  );
}

async function handlePaymentFailed(payment: any, reason: string) {
  const externalRef = payment.externalReference;
  if (externalRef && !externalRef.startsWith("SUB_")) {
    await db.collection("orders").doc(externalRef).update({
      paymentStatus: reason,
      status: "CANCELLED"
    });
  }
}
