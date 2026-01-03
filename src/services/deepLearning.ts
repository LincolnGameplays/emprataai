import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getAiInsight } from './googleAi'; // Usa a versão blindada

// Interfaces (mantendo compatibilidade)
export interface SynapseData {
  totalOrders: number;
  lastUpdate: any;
  hourlyPatterns: Record<string, number>;
}

export async function trainSynapses(restaurantId: string, order: any): Promise<void> {
  if (!restaurantId || !order?.items?.length) return;

  const memoryRef = doc(db, 'brain_synapses', restaurantId);
  
  try {
    // Tenta atualizar a memória na nuvem
    // Simplificação da lógica de pares para reduzir escritas
    const items = order.items.map((i: any) => i.name || i.id);
    const updates: any = {
      totalOrders: increment(1),
      lastUpdate: serverTimestamp()
    };

    // Padrão Temporal
    const date = new Date();
    const timeKey = `h_${date.getDay()}_${date.getHours()}`; // ex: h_5_20 (Sexta 20h)
    updates[`hourlyPatterns.${timeKey}`] = increment(1);

    await updateDoc(memoryRef, updates);

  } catch (error: any) {
    // 🛡️ CORREÇÃO DO ERRO DE PERMISSÃO
    if (error.code === 'permission-denied') {
      console.warn("🔒 [DeepLearning] Plano atual não permite salvar sinapses na nuvem. (Feature Black)");
      // Opcional: Salvar em cache local para analytics simples
    } else {
      console.error('[DeepLearning] Erro de treino:', error);
    }
  }
}

export async function getSurprisingInsight(restaurantId: string): Promise<string> {
  try {
    // Tenta ler a memória
    let memoryData: any = {};
    
    try {
      const snap = await getDoc(doc(db, 'brain_synapses', restaurantId));
      if (snap.exists()) memoryData = snap.data();
    } catch (e) {
      console.log("🔒 Leitura de cérebro bloqueada (Plano Free/Starter). Gerando insight genérico.");
    }

    // Usa a IA Blindada para gerar o texto
    const prompt = `
      Atue como consultor de restaurante.
      Dados: ${memoryData.totalOrders ? `Temos ${memoryData.totalOrders} pedidos analisados.` : 'Estamos começando agora.'}
      Gere UMA frase curta e motivadora ou uma dica técnica sobre delivery.
    `;

    return await getAiInsight(prompt);

  } catch (error) {
    return "💡 Dica: Mantenha seu cardápio atualizado com fotos reais para vender mais.";
  }
}
