import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BrainCircuit, Send, Sparkles, TrendingUp, Users, 
  Package, Lightbulb, Mic, Loader2 
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function OwnerBrain() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou o EmprataBrain, seu consultor de negócios com IA. Como posso ajudar hoje? 🧠',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickActions = [
    { icon: TrendingUp, label: 'Análise de Vendas', prompt: 'Como foram minhas vendas hoje comparadas a ontem?' },
    { icon: Users, label: 'Clientes VIP', prompt: 'Quais são meus 5 melhores clientes do mês?' },
    { icon: Package, label: 'Estoque Crítico', prompt: 'Quais itens estão com estoque baixo?' },
    { icon: Lightbulb, label: 'Sugestões', prompt: 'Que promoção você sugere para aumentar vendas hoje?' },
  ];

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simular resposta da IA (em produção, chamaria o EmprataBrain service)
    setTimeout(() => {
      const aiResponses: Record<string, string> = {
        'vendas': '📊 Suas vendas hoje estão 12% acima de ontem! Você já faturou R$ 1.450 com 24 pedidos. O item mais vendido é o X-Bacon Especial.',
        'clientes': '🏆 Seus Top 5 VIPs do mês:\n1. João Silva - R$ 890 (12 pedidos)\n2. Maria Santos - R$ 650 (8 pedidos)\n3. Carlos Oliveira - R$ 520 (6 pedidos)\n4. Ana Costa - R$ 480 (7 pedidos)\n5. Pedro Lima - R$ 420 (5 pedidos)',
        'estoque': '⚠️ Atenção! Detectei 3 itens críticos:\n• Coca-Cola Lata: ~2h de estoque\n• Queijo Cheddar: 15 porções restantes\n• Pão de Hambúrguer: pedido sugerido para amanhã',
        'promoção': '💡 Baseado no seu histórico, sugiro:\n\n"Happy Hour Relâmpago" (14h-16h)\n• X-Salada + Refri = R$ 24,90 (de R$ 32)\n\nIsto geralmente aumenta vendas em 40% nesse horário!',
      };

      let response = '🤔 Entendi sua pergunta! Para uma análise mais detalhada, integre seus dados de vendas e estoque. Por enquanto, posso ajudar com análises básicas de vendas, clientes e sugestões.';
      
      const lowerText = messageText.toLowerCase();
      if (lowerText.includes('vend') || lowerText.includes('fatur')) response = aiResponses.vendas;
      else if (lowerText.includes('cliente') || lowerText.includes('vip')) response = aiResponses.clientes;
      else if (lowerText.includes('estoque') || lowerText.includes('baixo')) response = aiResponses.estoque;
      else if (lowerText.includes('promoção') || lowerText.includes('sugest')) response = aiResponses.promoção;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-[calc(100vh-200px)]"
    >
       {/* Header */}
       <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center">
            <BrainCircuit size={24} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white flex items-center gap-2">
              EmprataBrain
              <Sparkles size={14} className="text-purple-400" />
            </h2>
            <p className="text-xs text-white/40">Seu consultor de negócios com IA</p>
          </div>
       </div>

       {/* Quick Actions */}
       <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => handleSend(action.prompt)}
              className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 rounded-full px-4 py-2 shrink-0 hover:border-purple-500/50 transition-colors"
            >
              <action.icon size={14} className="text-purple-400" />
              <span className="text-xs font-medium text-white/80">{action.label}</span>
            </button>
          ))}
       </div>

       {/* Chat Messages */}
       <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-primary text-black rounded-br-sm' 
                  : 'bg-[#1a1a1a] border border-white/5 text-white rounded-bl-sm'
              }`}>
                <p className="text-sm whitespace-pre-line">{msg.content}</p>
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl rounded-bl-sm p-4">
                <Loader2 size={20} className="text-purple-400 animate-spin" />
              </div>
            </div>
          )}
       </div>

       {/* Input Area */}
       <div className="flex gap-2">
          <button className="w-12 h-12 bg-[#1a1a1a] border border-white/10 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:border-purple-500/50 transition-colors">
            <Mic size={20} />
          </button>
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Pergunte algo ao EmprataBrain..."
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 pr-12 text-white placeholder:text-white/30 focus:border-purple-500/50 outline-none transition-colors"
            />
            <button 
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-500 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
       </div>
    </motion.div>
  );
}
