/**
 * usePendingCheckout Hook
 * Recupera intenção de compra após login
 * Resolve o problema de "esquecimento" do plano selecionado
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

type PlanType = 'STARTER' | 'GROWTH' | 'SCALE';

interface PendingPlan {
  plan: PlanType;
  price: number;
}

const PLAN_PRICES: Record<PlanType, number> = {
  'STARTER': 97.00,
  'GROWTH': 197.00,
  'SCALE': 497.00
};

export function usePendingCheckout() {
  const { user } = useAuth();
  const [pendingPlan, setPendingPlan] = useState<PendingPlan | null>(null);

  useEffect(() => {
    if (user) {
      // Verifica se ficou algo pendente no storage
      const storedPlan = sessionStorage.getItem('pending_plan');
      
      if (storedPlan) {
        const plan = storedPlan as PlanType;
        
        // Valida se é um plano válido
        if (PLAN_PRICES[plan]) {
          // Abre o modal
          setPendingPlan({
            plan,
            price: PLAN_PRICES[plan]
          });

          // Limpa o storage para não abrir de novo se der F5
          sessionStorage.removeItem('pending_plan');
          toast.info(`Retomando compra do plano ${plan}...`);
        } else {
          // Plano inválido, limpa
          sessionStorage.removeItem('pending_plan');
        }
      }
    }
  }, [user]);

  const clearPending = () => setPendingPlan(null);

  return { pendingPlan, clearPending };
}
