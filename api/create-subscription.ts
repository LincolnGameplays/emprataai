import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar CORS
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

  const ASAAS_KEY = process.env.ASAAS_API_KEY; 

  if (!ASAAS_KEY) {
    return res.status(500).json({ error: 'Configuração de servidor incompleta (Falta API Key)' });
  }

  const { customerData, billingType, value, cycle, description, userId } = req.body;

  if (!customerData || !value) {
    return res.status(400).json({ error: 'Dados do cliente e valor são obrigatórios' });
  }

  try {
    // 1. CRIAR CLIENTE NO ASAAS
    const customerRes = await fetch('https://www.asaas.com/api/v3/customers', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'access_token': ASAAS_KEY 
      },
      body: JSON.stringify({
        name: customerData.name,
        cpfCnpj: customerData.cpfCnpj,
        email: customerData.email,
        mobilePhone: customerData.phone,
        externalReference: userId
      })
    });
    
    const customer = await customerRes.json();
    
    // Se cliente já existe, usa o ID existente
    let asaasCustomerId = customer.id;
    
    if (customer.errors && customer.errors[0]?.code === 'invalid_cpfCnpj') {
      return res.status(400).json({ error: 'CPF/CNPJ inválido' });
    }
    
    // Se o cliente já existe, buscar pelo CPF/CNPJ
    if (!asaasCustomerId && customer.errors) {
      const searchRes = await fetch(
        `https://www.asaas.com/api/v3/customers?cpfCnpj=${customerData.cpfCnpj}`,
        {
          headers: { 'access_token': ASAAS_KEY }
        }
      );
      const searchData = await searchRes.json();
      if (searchData.data && searchData.data.length > 0) {
        asaasCustomerId = searchData.data[0].id;
      }
    }

    if (!asaasCustomerId) {
      console.error('[Asaas] Customer creation failed:', customer);
      return res.status(400).json({ error: 'Falha ao criar cliente no Asaas' });
    }

    // 2. CRIAR A ASSINATURA (RECORRENTE)
    const nextDueDate = new Date().toISOString().split('T')[0];
    
    const subRes = await fetch('https://www.asaas.com/api/v3/subscriptions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'access_token': ASAAS_KEY 
      },
      body: JSON.stringify({
        customer: asaasCustomerId,
        billingType: billingType || 'PIX',
        value: value,
        cycle: cycle || 'MONTHLY',
        description: description || 'Assinatura Emprata',
        nextDueDate: nextDueDate,
        externalReference: userId  // 🔐 Critical: Links payment to Firebase user for webhook
      })
    });

    const subscription = await subRes.json();

    if (subscription.errors) {
      console.error('[Asaas] Subscription creation failed:', subscription);
      return res.status(400).json({ error: 'Falha ao criar assinatura' });
    }

    // Retornamos a URL para o usuário pagar
    // O Asaas pode retornar billUrl ou invoiceUrl dependendo do tipo de cobrança
    const invoiceUrl = subscription.bankSlipUrl || 
                       subscription.invoiceUrl || 
                       `https://www.asaas.com/c/${subscription.id}`;
    
    return res.status(200).json({ 
      subscriptionId: subscription.id,
      invoiceUrl: invoiceUrl,
      customerId: asaasCustomerId
    });

  } catch (error) {
    console.error('[Asaas] Error:', error);
    return res.status(500).json({ error: 'Erro no processamento seguro.' });
  }
}
