/**
 * Configurações do Asaas (Gateway de Pagamento)
 *
 * IMPORTANTE: O Firebase Cloud Functions Gen 2 lê variáveis de ambiente
 * automaticamente do arquivo functions/.env, NÃO precisa de dotenv.
 */

// Se a variável for EXATAMENTE 'true', usa Sandbox. Caso contrário, usa Produção.
const isSandbox = process.env.ASAAS_SANDBOX === "true";

export const ASAAS_CONFIG = {
  // URLs Oficiais (v3)
  baseUrl: isSandbox ?
    "https://api-sandbox.asaas.com/v3" :
    "https://api.asaas.com/v3",

  apiKey: process.env.ASAAS_API_KEY || "",
  webhookToken: process.env.ASAAS_WEBHOOK_TOKEN || "",
};

/**
 * Calcula a taxa da Emprata baseada no valor e no plano.
 *
 * @param {number} amount - O valor da transação.
 * @param {string} plan - O plano do usuário (ex: 'STARTER', 'GROWTH').
 * @return {{emprataFee: number, restaurantAmount: number}} Objeto com taxa e valor líquido.
 */
export const calculateEmprataFee = (amount: number, plan: string = "free") => {
  // Taxas Base (Exemplo)
  let feePercent = 0.0499; // 4.99% padrão
  const feeFixed = 0.00;

  // Ajuste por plano
  if (plan === "STARTER") feePercent = 0.0399; // 3.99%
  if (plan === "GROWTH") feePercent = 0.0299; // 2.99%
  if (plan === "SCALE") feePercent = 0.0199; // 1.99%

  const totalFee = (amount * feePercent) + feeFixed;
  const restaurantReceive = amount - totalFee;

  return {
    emprataFee: Number(totalFee.toFixed(2)),
    restaurantAmount: Number(restaurantReceive.toFixed(2)),
  };
};
