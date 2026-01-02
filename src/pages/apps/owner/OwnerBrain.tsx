import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  BrainCircuit, Send, Sparkles, TrendingUp, Users, 
  Package, Lightbulb, Mic, Loader2, Bot, User 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../../hooks/useAuth';
import { askEmprataBrain, getBrainSuggestions } from '../../../services/brainService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function OwnerBrain() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Olá${user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}! Sou o **EmprataBrain**, seu consultor de negócios com IA. Acabei de analisar seus dados de vendas em tempo real. O que você quer saber hoje? 🧠`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll quando novas mensagens chegam
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Carregar sugestões baseadas nos dados reais
  useEffect(() => {
    if (user?.uid) {
      getBrainSuggestions(user.uid).then(setSuggestions);
    }
  }, [user?.uid]);

  const quickActions = [
    { icon: TrendingUp, label: 'Análise de Vendas', prompt: 'Como foram minhas vendas hoje comparadas a ontem?' },
    { icon: Users, label: 'Clientes VIP', prompt: 'Quais são meus 5 melhores clientes do mês?' },
    { icon: Package, label: 'Top Produtos', prompt: 'Quais são meus produtos mais vendidos?' },
    { icon: Lightbulb, label: 'Sugestões', prompt: 'Que promoção você sugere para aumentar vendas hoje?' },
  ];

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || !user?.uid) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Chama o EmprataBrain com RAG real
      const response = await askEmprataBrain(user.uid, messageText);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (e) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Desculpe, tive um problema de conexão neural. Tente novamente em alguns instantes. 🔌",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <BrainCircuit size={24} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white flex items-center gap-2">
              EmprataBrain
              <span className="text-[10px] bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded uppercase">
                Pro + RAG
              </span>
            </h2>
            <p className="text-xs text-white/40">Inteligência conectada aos seus dados reais</p>
          </div>
       </div>

       {/* Quick Actions */}
       <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => handleSend(action.prompt)}
              disabled={isLoading}
              className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 rounded-full px-4 py-2 shrink-0 hover:border-purple-500/50 transition-colors disabled:opacity-50"
            >
              <action.icon size={14} className="text-purple-400" />
              <span className="text-xs font-medium text-white/80">{action.label}</span>
            </button>
          ))}
       </div>

       {/* Chat Messages */}
       <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 scroll-smooth">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'assistant' 
                  ? 'bg-purple-600/20 text-purple-400' 
                  : 'bg-white/10 text-white'
              }`}>
                {msg.role === 'assistant' ? <Bot size={16}/> : <User size={16}/>}
              </div>
              
              {/* Message Bubble */}
              <div className={`max-w-[85%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-primary text-black rounded-br-sm' 
                  : 'bg-[#1a1a1a] border border-white/5 text-white rounded-bl-sm'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="text-sm prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))}
          
          {/* Loading Indicator */}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center">
                <Bot size={16} className="text-purple-400" />
              </div>
              <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl rounded-bl-sm p-4 flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-white/40 ml-2">Analisando dados...</span>
              </div>
            </motion.div>
          )}
       </div>

       {/* Suggestions from Data */}
       {suggestions.length > 0 && messages.length < 4 && (
         <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
           {suggestions.map((s, i) => (
             <button 
               key={i} 
               onClick={() => handleSend(s)}
               disabled={isLoading}
               className="whitespace-nowrap px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-xs text-white/60 hover:text-white transition-colors disabled:opacity-50"
             >
               {s}
             </button>
           ))}
         </div>
       )}

       {/* Input Area */}
       <div className="flex gap-2">
          <button className="w-12 h-12 bg-[#1a1a1a] border border-white/10 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:border-purple-500/50 transition-colors">
            <Mic size={20} />
          </button>
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              placeholder="Pergunte sobre vendas, estoque ou estratégia..."
              disabled={isLoading}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 pr-12 text-white placeholder:text-white/30 focus:border-purple-500/50 outline-none transition-colors disabled:opacity-50"
            />
            <button 
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-500 transition-colors"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
       </div>
       
       {/* Disclaimer */}
       <p className="text-center text-[10px] text-white/20 mt-3">
         O EmprataBrain analisa dados reais do seu restaurante, mas pode cometer erros. Verifique informações críticas.
       </p>
    </motion.div>
  );
}
