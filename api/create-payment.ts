import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar CORS (Para seu front acessar)
  res.setHeader('Access-Control-Allow-Credentials', "true");
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // PEGAR A CHAVE DAS VARIÁVEIS DE AMBIENTE DA VERCEL
  const ASAAS_KEY = process.env.ASAAS_API_KEY; 

  if (!ASAAS_KEY) {
    return res.status(500).json({ error: 'Configuração de servidor incompleta (Falta API Key)' });
  }

  const { customer, billingType, value, description } = req.body;

  if (!value) {
    return res.status(400).json({ error: 'Valor é obrigatório' });
  }

  try {
    // Criar cobrança no Asaas
    const response = await fetch('https://www.asaas.com/api/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_KEY
      },
      body: JSON.stringify({
        customer: customer, // ID do cliente no Asaas (ou criar um antes)
        billingType: billingType || 'UNDEFINED', // BOLETO, CREDIT_CARD, PIX
        value: value,
        dueDate: new Date().toISOString().split('T')[0], // Vence hoje
        description: description || 'Cobrança Emprata',
      })
    });

    const data = await response.json();

    if (data.errors) {
      return res.status(400).json(data);
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('[Asaas API Error]:', error);
    return res.status(500).json({ error: 'Erro ao comunicar com Asaas' });
  }
}
