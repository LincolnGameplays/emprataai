import { db } from "../config/firebase";
import { runTransaction, doc, collection, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import type { Order } from "../types/orders";

export const createOrderSecure = async (orderData: Partial<Order>) => {
  if (!orderData.items || orderData.items.length === 0) {
    throw new Error("Pedido vazio.");
  }

  try {
    const orderId = await runTransaction(db, async (transaction) => {
      // 1. Verificação de Estoque (Leitura)
      for (const item of orderData.items!) {
        if (!item.id) continue; 
        
        const productRef = doc(db, "products", item.id);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists()) throw "Produto não encontrado: " + item.name;

        const currentStock = productDoc.data().stock;
        // Se stock for null/undefined, assume infinito (ex: serviço)
        if (typeof currentStock === 'number') {
            if (currentStock < item.quantity) {
                throw `Estoque insuficiente para ${item.name}. Restam apenas ${currentStock}.`;
            }
            // 2. Atualização de Estoque (Escrita na memória da transação)
            transaction.update(productRef, { 
                stock: currentStock - item.quantity 
            });
        }
      }

      // 3. Criação do Pedido
      const newOrderRef = doc(collection(db, "orders"));
      transaction.set(newOrderRef, {
        ...orderData,
        status: "PENDING",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Garante integridade financeira
        total: orderData.items!.reduce((acc, item) => acc + (item.price * item.quantity), 0)
      });

      return newOrderRef.id;
    });

    toast.success("Pedido realizado com sucesso!");
    return orderId;

  } catch (error: any) {
    console.error("Transação falhou:", error);
    // Se a string de erro foi lançada por nós (estoque), mostra ela.
    const msg = typeof error === 'string' ? error : "Erro ao processar pedido. Tente novamente.";
    toast.error(msg);
    throw error;
  }
};
