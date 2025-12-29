import { useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Mic, Zap, Truck, ChefHat, BarChart3, ShieldCheck, 
  Smartphone, ArrowRight, Play, Star, Check, Globe 
} from 'lucide-react';

// --- COMPONENTES VISUAIS ---

const FeatureCard = ({ title, desc, icon: Icon, color, delay, colSpan = 1 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className={`bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all group overflow-hidden relative ${colSpan === 2 ? 'md:col-span-2' : ''}`}
  >
    <div className={`absolute top-0 right-0 p-32 opacity-10 blur-[60px] transition-all group-hover:opacity-20 ${color}`} />
    <div className="relative z-10">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${color.replace('bg-', 'bg-').replace('500', '500/20')} border border-white/10`}>
        <Icon className={`w-6 h-6 text-white`} />
      </div>
      <h3 className="text-xl font-black italic mb-2">{title}</h3>
      <p className="text-white/50 text-sm leading-relaxed font-medium">{desc}</p>
    </div>
  </motion.div>
);

const Stat = ({ number, label }: any) => (
  <div className="text-center">
    <div className="text-4xl md:text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 mb-2">
      {number}
    </div>
    <div className="text-xs font-bold uppercase tracking-widest text-primary">{label}</div>
  </div>
);

export default function LandingPage() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: targetRef, offset: ["start start", "end start"] });
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary selection:text-white overflow-x-hidden font-sans">
      
      {/* NAVBAR FLUTUANTE */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 h-20 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
          <div className="text-2xl font-black italic tracking-tighter">
            Emprata<span className="text-primary">.ai</span>
          </div>
          <div className="hidden md:flex gap-8 text-xs font-bold uppercase tracking-widest text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#magic" className="hover:text-white transition-colors">Tecnologia</a>
            <a href="#pricing" className="hover:text-white transition-colors">Planos</a>
          </div>
          <div className="flex gap-4">
            <Link to="/auth" className="text-xs font-bold uppercase tracking-widest py-3 px-4 hover:text-primary transition-colors">
              Login
            </Link>
            <Link to="/auth">
              <button className="bg-primary hover:bg-orange-600 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,107,0,0.3)]">
                Começar Agora
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION - CINEMATIC */}
      <section ref={targetRef} className="relative h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-[#050505] to-[#050505]" />
        
        {/* Grid Background Animado */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 text-center max-w-5xl px-6"
        >
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-xl"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
              O Sistema Operacional Neural v3.0
            </span>
          </motion.div>

          <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter leading-[0.9] mb-8">
            Seu Delivery.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/40">
              Agora com Superpoderes.
            </span>
          </h1>

          <p className="text-lg md:text-2xl text-white/40 font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
            Não é apenas um cardápio. É uma <span className="text-white">Inteligência Artificial</span> que fotografa, gerencia entregas, obedece sua voz e recupera clientes.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <Link to="/auth">
              <button className="group relative px-8 py-4 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center gap-3">
                <Zap className="w-5 h-5 fill-current text-primary" />
                Criar Conta Grátis
                <div className="absolute inset-0 rounded-2xl ring-2 ring-white/50 group-hover:ring-4 transition-all" />
              </button>
            </Link>
            
            <button 
              onClick={() => setIsVideoModalOpen(true)}
              className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3"
            >
              <Play className="w-4 h-4 fill-current" /> Ver Demo (1min)
            </button>
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
             {/* LOGOS FICTÍCIOS DE SOCIAL PROOF */}
             <div className="text-sm font-black uppercase tracking-widest">Usado por +500 Deliveries</div>
          </div>
        </motion.div>
      </section>

      {/* BENTO GRID - O ECOSSISTEMA */}
      <section id="features" className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter mb-6">
              Tudo o que você precisa.<br />
              <span className="text-primary">E o que nem sabia que existia.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Neural Studio */}
            <FeatureCard 
              colSpan={2}
              title="Estúdio Fotográfico Neural"
              desc="Nossa IA transforma fotos tiradas do seu celular em obras de arte profissionais. Sem estúdio, sem fotógrafo, em segundos."
              icon={Smartphone}
              color="bg-purple-500"
              delay={0.1}
            />
            
            {/* Voice KDS */}
            <FeatureCard 
              title="KDS Hands-Free"
              desc="Comando de voz para a cozinha. O cozinheiro grita 'Pronto!' e o sistema obedece. Zero toques na tela."
              icon={Mic}
              color="bg-red-500"
              delay={0.2}
            />

            {/* Logistics */}
            <FeatureCard 
              title="Emprata Logistics"
              desc="App do Entregador com Rota Waze, PIN de Segurança e Acerto de Contas automático no fim do dia."
              icon={Truck}
              color="bg-blue-500"
              delay={0.3}
            />

            {/* Taste DNA */}
            <FeatureCard 
              colSpan={2}
              title="Taste DNA™ & Menu Vivo"
              desc="O cardápio muda a ordem dos itens baseado no clima (frio/calor) e no paladar único de cada cliente. Personalização nível Netflix."
              icon={BarChart3}
              color="bg-green-500"
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* SECTION: A MÁGICA (VOICE & AI) */}
      <section id="magic" className="py-32 px-6 bg-white/5 border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid-pattern.svg')] opacity-10" />
        
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary mb-6">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-[10px] font-black uppercase tracking-widest">Tecnologia Exclusiva</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter mb-6 leading-tight">
              Sua cozinha não precisa de telas.<br />
              Precisa de <span className="text-primary">Ouvidos.</span>
            </h2>
            <p className="text-xl text-white/50 leading-relaxed mb-8">
              Cozinheiros têm mãos ocupadas. Com o <strong>Emprata Voice</strong>, a operação flui na velocidade do som. É higiênico, futurista e incrivelmente rápido.
            </p>
            
            <ul className="space-y-4 mb-10">
              {['Reconhecimento de Voz Offline', 'Integração com Pulse™ (Vibra o Garçom)', 'Zero erros de leitura'].map(item => (
                <li key={item} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-500" />
                  </div>
                  <span className="font-bold text-sm text-white/80">{item}</span>
                </li>
              ))}
            </ul>

            <Link to="/auth">
              <button className="px-8 py-4 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors">
                Testar Voz Agora
              </button>
            </Link>
          </div>

          {/* VISUAL REPRESENTATION */}
          <div className="relative h-[500px] bg-black border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center overflow-hidden">
             {/* Ondas Sonoras Animadas */}
             <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-50">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [20, 100, 20] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.05 }}
                    className="w-2 bg-primary rounded-full"
                  />
                ))}
             </div>
             <div className="z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl text-center">
               <Mic className="w-12 h-12 mx-auto text-white mb-4" />
               <p className="text-2xl font-black italic">"Pedido 42 Pronto!"</p>
               <p className="text-xs text-white/50 uppercase tracking-widest mt-2">Comando Reconhecido</p>
             </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF / STATS */}
      <section className="py-20 border-b border-white/5 bg-black">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
          <Stat number="+40%" label="Conversão Média" />
          <Stat number="-12h" label="Tempo Operacional/Sem" />
          <Stat number="0%" label="Comissão Cobrada" />
          <Stat number="24/7" label="Vendas Automáticas" />
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-32 px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter mb-6">
            Preço de Pizza.<br />
            Potência de Tech Company.
          </h2>
          <p className="text-white/40 text-lg">
            Sem pegadinhas. Sem comissões sobre suas vendas. Cancele quando quiser.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 items-center">
          {/* STARTER */}
          <div className="p-8 rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
            <h3 className="text-xl font-black uppercase text-white/60 mb-2">Starter</h3>
            <div className="text-4xl font-black mb-6">R$ 97<span className="text-sm font-bold text-white/40">/mês</span></div>
            <p className="text-sm text-white/50 mb-8">Para quem está começando e quer profissionalismo visual.</p>
            <ul className="space-y-3 mb-8 text-sm font-bold text-white/70">
              <li className="flex gap-2"><Check className="w-4 h-4 text-green-500"/> Fotos com IA (50/mês)</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-green-500"/> Cardápio Digital</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-green-500"/> Pedidos via WhatsApp</li>
            </ul>
            <Link to="/auth?plan=starter">
              <button className="w-full py-4 border border-white/20 rounded-xl font-black text-xs uppercase hover:bg-white hover:text-black transition-all">Começar Starter</button>
            </Link>
          </div>

          {/* PRO (DESTAQUE) */}
          <div className="p-10 rounded-3xl border-2 border-primary bg-[#120a05] relative transform md:-translate-y-4 shadow-2xl shadow-primary/20">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              Mais Escolhido
            </div>
            <h3 className="text-xl font-black uppercase text-primary mb-2">Growth</h3>
            <div className="text-5xl font-black mb-6">R$ 197<span className="text-sm font-bold text-white/40">/mês</span></div>
            <p className="text-sm text-white/50 mb-8">O sistema operacional completo. Logística, KDS e IA.</p>
            <ul className="space-y-3 mb-8 text-sm font-bold text-white">
              <li className="flex gap-2"><Check className="w-4 h-4 text-primary"/> Fotos IA Ilimitadas</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-primary"/> KDS (Tela Cozinha) + Voz</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-primary"/> App do Entregador & Rastreio</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-primary"/> Taste DNA & Menu Vivo</li>
            </ul>
            <Link to="/auth?plan=pro">
              <button className="w-full py-4 bg-primary rounded-xl font-black text-xs uppercase hover:bg-orange-600 transition-all hover:scale-105">
                Assinar Growth
              </button>
            </Link>
          </div>

          {/* SCALE */}
          <div className="p-8 rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
            <h3 className="text-xl font-black uppercase text-white/60 mb-2">Scale</h3>
            <div className="text-4xl font-black mb-6">R$ 397<span className="text-sm font-bold text-white/40">/mês</span></div>
            <p className="text-sm text-white/50 mb-8">Para redes e operações de alto volume que precisam de automação.</p>
            <ul className="space-y-3 mb-8 text-sm font-bold text-white/70">
              <li className="flex gap-2"><Check className="w-4 h-4 text-purple-500"/> Tudo do Growth</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-purple-500"/> Disparos WhatsApp (Evolution)</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-purple-500"/> IA de Reviews & Campanhas</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-purple-500"/> Múltiplas Lojas</li>
            </ul>
            <Link to="/auth?plan=scale">
              <button className="w-full py-4 border border-white/20 rounded-xl font-black text-xs uppercase hover:bg-white hover:text-black transition-all">Começar Scale</button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 border-t border-white/5 text-center md:text-left">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="text-2xl font-black italic tracking-tighter mb-4">
              Emprata<span className="text-primary">.ai</span>
            </div>
            <p className="text-white/40 text-sm max-w-xs">
              O primeiro sistema operacional neural para delivery do mundo. Feito para quem cansou de ser refém de taxas.
            </p>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-widest text-xs mb-6">Produto</h4>
            <ul className="space-y-4 text-sm text-white/60">
              <li><a href="#" className="hover:text-primary">Neural Studio</a></li>
              <li><a href="#" className="hover:text-primary">KDS de Voz</a></li>
              <li><a href="#" className="hover:text-primary">Logística</a></li>
              <li><a href="#" className="hover:text-primary">Preços</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-widest text-xs mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-white/60">
              <li><Link to="/privacy" className="hover:text-primary">Privacidade</Link></li>
              <li><Link to="/terms" className="hover:text-primary">Termos de Uso</Link></li>
              <li><a href="#" className="hover:text-primary">Contato</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-white/20 font-bold uppercase tracking-widest">
          <p>© 2025 Emprata Inc. Curitiba, PR.</p>
          <p>Designed with 🧡 by Gemini 3 Pro</p>
        </div>
      </footer>

      {/* VIDEO MODAL */}
      <AnimatePresence>
        {isVideoModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6"
            onClick={() => setIsVideoModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl border border-white/10 flex items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <Play className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/40">Vídeo demo em breve</p>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
