import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ASAAS_KEY = process.env.ASAAS_API_KEY;
  if (!ASAAS_KEY) {
    console.error("❌ ASAAS_API_KEY não configurada no ambiente Vercel.");
    return res.status(500).json({ error: 'Erro interno de configuração.' });
  }

  try {
    const { customer, billingType, value, description, dueDate } = req.body;

    // 1. Validação Rigorosa
    const missingFields = [];
    if (!customer) missingFields.push('customer');
    if (!value) missingFields.push('value');
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Campos obrigatórios faltando: ${missingFields.join(', ')}` 
      });
    }

    // 2. Chamada Asaas
    const response = await fetch(`${process.env.ASAAS_API_URL || 'https://www.asaas.com/api/v3'}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_KEY
      },
      body: JSON.stringify({
        customer,
        billingType: billingType || 'UNDEFINED',
        value,
        dueDate: dueDate || new Date().toISOString().split('T')[0],
        description: description || 'Pedido EmprataAI'
      })
    });

    const data = await response.json();

    if (!response.ok || data.errors) {
      console.error('❌ Erro Asaas:', JSON.stringify(data));
      return res.status(400).json({ error: 'Asaas recusou o pagamento', details: data.errors });
    }

    return res.status(200).json(data);

  } catch (error: any) {
    console.error('❌ Erro Crítico:', error);
    return res.status(500).json({ error: 'Falha na comunicação de pagamento.' });
  }
}
