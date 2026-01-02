import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  ArrowRight, ChefHat, MapPin, Zap, ShieldCheck, 
  Smartphone, TrendingUp, DollarSign, BrainCircuit,
  Clock, Target, Sparkles
} from 'lucide-react';
import { usePlatformStats } from '../hooks/usePlatformStats';
import { SeoEngine } from '../components/seo/SeoEngine';

export default function LandingPage() {
  const [viewMode, setViewMode] = useState<'CONSUMER' | 'BUSINESS'>('CONSUMER');
  const navigate = useNavigate();
  const stats = usePlatformStats();
  const containerRef = useRef(null);
  
  // Scroll Animations
  const { scrollYProgress } = useScroll({ target: containerRef });
  const ecosystemY = useTransform(scrollYProgress, [0.2, 0.5], [100, 0]);
  const ecosystemOpacity = useTransform(scrollYProgress, [0.2, 0.4], [0, 1]);

  // Configurações de Tema Dinâmico
  const theme = viewMode === 'CONSUMER' 
    ? { 
        id: 'consumer',
        primary: 'text-green-400',
        accentColor: '#4ade80', // green-400 hex
        bgGradient: 'from-green-900/30 via-[#050505] to-[#050505]',
        button: 'bg-green-500 hover:bg-green-400 text-black',
        glow: 'shadow-[0_0_50px_rgba(34,197,94,0.3)]',
        headline: <>Sua Fome, <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">Decodificada pela IA.</span></>,
        subhead: "Esqueça o scroll infinito. O EmprataBrain aprende seu paladar e te serve o prato perfeito antes mesmo de você saber o que quer. É cashback, é vídeo, é comida de verdade."
      }
    : { 
        id: 'business',
        primary: 'text-purple-400', 
        accentColor: '#a855f7', // purple-500 hex
        bgGradient: 'from-purple-900/30 via-[#050505] to-[#050505]',
        button: 'bg-purple-600 hover:bg-purple-500 text-white',
        glow: 'shadow-[0_0_50px_rgba(147,51,234,0.3)]',
        headline: <>Seu Delivery, <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">No Piloto Automático.</span></>,
        subhead: "Abandone a guerra de taxas. Assuma o controle com um Sistema Operacional que une KDS, Logística Própria e uma IA que prevê seu faturamento antes do mês começar."
      };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white selection:text-black overflow-x-hidden">
      
      <SeoEngine 
        title={viewMode === 'CONSUMER' ? "Emprata | A Revolução do Delivery" : "Emprata | OS para Restaurantes"}
        description="Onde a inteligência artificial encontra a gastronomia. O ecossistema definitivo."
        path="/"
      />

      {/* --- NAVBAR MÁGICA --- */}
      <nav className="fixed top-6 w-full flex justify-center z-50 pointer-events-none px-4">
         <motion.div 
            layoutId="navbar-container"
            className="bg-black/70 backdrop-blur-xl border border-white/10 p-1.5 rounded-full flex items-center gap-1 shadow-2xl pointer-events-auto"
         >
            <TabButton mode="CONSUMER" current={viewMode} onClick={setViewMode} label="Para Comer" icon={Sparkles} color="bg-green-500 text-black"/>
            <TabButton mode="BUSINESS" current={viewMode} onClick={setViewMode} label="Para Vender" icon={Target} color="bg-purple-600 text-white"/>
         </motion.div>
      </nav>

      {/* --- HERO SECTION: A ESCOLHA --- */}
      <main className="relative h-[90vh] flex flex-col items-center justify-center px-6 overflow-hidden">
         {/* Background Dinâmico Vivo */}
         <AnimatePresence mode="popLayout">
            <motion.div 
               key={theme.id + '-bg'}
               initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2, ease: "easeInOut" }}
               className={`absolute inset-0 bg-gradient-radial ${theme.bgGradient} pointer-events-none`}
            />
         </AnimatePresence>
         <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>

         <div className="max-w-5xl mx-auto text-center relative z-10 mt-20">
            <AnimatePresence mode="wait">
               <motion.div
                 key={theme.id + '-content'}
                 initial={{ y: 30, opacity: 0, filter: 'blur(8px)' }}
                 animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                 exit={{ y: -30, opacity: 0, filter: 'blur(8px)' }}
                 transition={{ duration: 0.6 }}
               >
                  {/* Prova Social Flutuante */}
                  <motion.div 
                    initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                    className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8 backdrop-blur-md"
                  >
                     <div className="flex -space-x-3">
                        {[1,2,3].map(i => <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 border-2 border-[#050505]" />)}
                     </div>
                     <p className="text-sm font-medium"><span className="font-bold text-white">+{stats.orders > 50 ? stats.orders : '2.4k'}</span> pedidos processados hoje.</p>
                  </motion.div>

                  <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-6 leading-[0.9]">
                     {theme.headline}
                  </h1>
                  <p className="text-xl text-white/60 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
                     {theme.subhead}
                  </p>

                  <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                     <motion.button 
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(viewMode === 'CONSUMER' ? '/delivery' : '/auth')}
                        className={`${theme.button} px-12 py-6 rounded-2xl font-black text-xl flex items-center gap-3 transition-all ${theme.glow}`}
                     >
                        {viewMode === 'CONSUMER' ? 'EXPLORAR RESTAURANTES' : 'COMEÇAR OPERAÇÃO'} 
                        <ArrowRight size={24} />
                     </motion.button>
                     <button 
                        onClick={() => navigate('/apps')}
                        className="px-8 py-6 rounded-2xl font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all flex items-center gap-3 border border-transparent hover:border-white/10"
                     >
                        <Smartphone size={22} /> Baixar Super App
                     </button>
                  </div>
               </motion.div>
            </AnimatePresence>
         </div>
         
         {/* Scroll Indicator Animado */}
         <motion.div animate={{ y: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} className="absolute bottom-8 pointer-events-none opacity-50">
            <ArrowRight size={24} className="rotate-90" />
         </motion.div>
      </main>

      {/* --- SEÇÃO DE CONEXÃO: A SIMBIOSE --- */}
      <motion.section 
        style={{ y: ecosystemY, opacity: ecosystemOpacity }}
        className="py-24 relative z-20 overflow-hidden"
      >
         <div className="max-w-7xl mx-auto px-6">
             <div className="text-center mb-16">
                <span className={`text-sm font-black uppercase tracking-widest ${theme.primary}`}>O Ecossistema Emprata</span>
                <h2 className="text-4xl font-black mt-4 mb-6">Onde o desejo vira lucro.</h2>
                <p className="text-white/50 max-w-2xl mx-auto">Uma plataforma única que conecta a intenção de compra do cliente à eficiência operacional do restaurante em milissegundos.</p>
             </div>
             
             {/* Diagrama Animado da Simbiose */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center relative">
                {/* Lado Consumidor */}
                <div className="bg-[#121212] p-8 rounded-[3rem] border border-green-500/20 relative overflow-hidden group">
                   <div className="absolute inset-0 bg-green-500/5 blur-3xl group-hover:opacity-100 opacity-50 transition-opacity" />
                   <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-2xl flex items-center justify-center text-green-400 mb-6 relative z-10">
                      <Smartphone size={40} />
                   </div>
                   <h3 className="text-xl font-black mb-2">1. O Desejo</h3>
                   <p className="text-white/50 text-sm">Cliente sente fome. A IA sugere o prato exato com vídeo.</p>
                </div>

                {/* O Conector Central */}
                <div className="relative h-32 md:h-auto flex flex-col md:flex-row items-center justify-center z-0">
                    {/* Linhas de conexão animadas */}
                    <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                        <motion.path 
                           d="M 0 50 H 100" 
                           stroke="url(#gradientLine)" 
                           strokeWidth="4" strokeDasharray="10 10"
                           animate={{ strokeDashoffset: [0, -20] }} transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
                           className="hidden md:block"
                        />
                        <motion.path 
                           d="M 50 0 V 100" 
                           stroke="url(#gradientLine)" 
                           strokeWidth="4" strokeDasharray="10 10"
                           animate={{ strokeDashoffset: [0, -20] }} transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
                           className="md:hidden"
                        />
                        <defs>
                            <linearGradient id="gradientLine" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#22c55e" />
                                <stop offset="100%" stopColor="#9333ea" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center z-10 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                        <Zap size={32} className="text-black" />
                    </div>
                </div>

                {/* Lado Business */}
                <div className="bg-[#121212] p-8 rounded-[3rem] border border-purple-500/20 relative overflow-hidden group">
                   <div className="absolute inset-0 bg-purple-500/5 blur-3xl group-hover:opacity-100 opacity-50 transition-opacity" />
                   <div className="w-20 h-20 mx-auto bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 mb-6 relative z-10">
                      <ChefHat size={40} />
                   </div>
                   <h3 className="text-xl font-black mb-2">2. A Execução</h3>
                   <p className="text-white/50 text-sm">Pedido cai direto na KDS da cozinha. Sem erros, sem papel.</p>
                </div>
             </div>
         </div>
      </motion.section>

      {/* --- MEGA BENTO GRIDS (DETALHES EXTREMOS) --- */}
      <section className="py-32 px-6 relative z-10">
         <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-black mb-12 uppercase tracking-tight text-white/30">
               {viewMode === 'CONSUMER' ? 'Arsenal do Consumidor' : 'Painel de Controle do Dono'}
            </h2>
            
            <AnimatePresence mode="wait">
               {viewMode === 'CONSUMER' ? <ConsumerMegaGrid key="c" /> : <BusinessMegaGrid key="b" />}
            </AnimatePresence>
         </div>
      </section>

      {/* --- FINAL CTA (ULTIMATO) --- */}
      <section className="py-40 relative overflow-hidden">
         <div className={`absolute inset-0 bg-gradient-to-t ${theme.bgGradient} opacity-80 pointer-events-none`} />
         <div className="max-w-4xl mx-auto text-center relative z-10 px-6">
            <h2 className="text-5xl md:text-8xl font-black italic tracking-tighter mb-8 leading-none">
               NÃO É DELIVERY. <br/> É <span className={theme.primary}>EVOLUÇÃO.</span>
            </h2>
            <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto">
               {viewMode === 'CONSUMER' 
                  ? "A era da comida fria e do suporte robótico acabou. Bem-vindo ao delivery que te entende." 
                  : "Enquanto seus concorrentes brigam por migalhas nos apps grandes, você constrói seu império com dados proprietários."}
            </p>
            <motion.button 
               whileHover={{ scale: 1.05, boxShadow: `0 0 50px ${theme.accentColor}80` }}
               onClick={() => navigate(viewMode === 'CONSUMER' ? '/delivery' : '/auth')}
               className={`bg-white text-black px-16 py-8 rounded-full font-black text-2xl shadow-2xl transition-all`}
            >
               {viewMode === 'CONSUMER' ? 'ACESSAR O FUTURO AGORA' : 'BLINDAR MINHA OPERAÇÃO'}
            </motion.button>
         </div>
      </section>
    </div>
  );
}

// --- COMPONENTES AUXILIARES & MEGA CARDS ---

function TabButton({ mode, current, onClick, label, icon: Icon, color }: any) {
    const isActive = current === mode;
    return (
       <button 
         onClick={() => onClick(mode)}
         className={`relative px-6 py-3 rounded-full text-sm font-black uppercase tracking-wider flex items-center gap-2 transition-all duration-300 ${isActive ? color : 'text-white/40 hover:text-white'}`}
       >
          {isActive && <motion.div layoutId="tab-bg" className={`absolute inset-0 ${color} rounded-full -z-10`} transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
          <Icon size={16} />
          <span className="relative z-10">{label}</span>
       </button>
    )
 }

// --- CONSUMER DETAILED CARDS ---
function ConsumerMegaGrid() {
   return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-6 h-auto md:h-[800px]">
         {/* CARD 1: IA SOMMELIER (Grande Vertical) */}
         <MegaCard 
            colSpan="md:col-span-2 md:row-span-2"
            icon={BrainCircuit} color="text-green-400" bgGlow="bg-green-500/10"
            title="O 'Cérebro' que conhece sua fome."
            subtitle="IA Preditiva & Personalização Extrema"
            detailContent={
               <div className="mt-6 space-y-4">
                  <div className="bg-black/50 p-4 rounded-xl border border-green-500/20 flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center"><Sparkles size={20} className="text-green-400"/></div>
                     <p className="text-sm"><span className="text-green-400 font-bold">Previsão:</span> "Sexta à noite? Você costuma pedir Pizza de Pepperoni com borda recheada."</p>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">Analisamos seus horários, clima e histórico para sugerir o que você quer antes de você pensar. Filtra ingredientes que odeia (adeus, uva passa!) automaticamente.</p>
               </div>
            }
         />
         {/* CARD 2: FOOD PORN (Horizontal) */}
         <MegaCard 
            colSpan="md:col-span-2"
            icon={Smartphone} color="text-yellow-400" bgGlow="bg-yellow-500/10"
            title="Cardápio Vivo em 4K"
            subtitle="Vídeos reais. Chega de fotos fakes."
            detailContent={
               <div className="mt-4 flex gap-4 items-center">
                  <div className="w-24 h-32 bg-zinc-800 rounded-lg animate-pulse"></div> {/* Placeholder de vídeo */}
                  <p className="text-sm text-white/60 flex-1">Veja a fumaça saindo, o queijo derretendo. Coma com os olhos primeiro. A decisão de compra é emocional, e nós a estimulamos ao máximo.</p>
               </div>
            }
         />
         {/* CARD 3: LOGÍSTICA MILITAR */}
         <MegaCard 
            icon={MapPin} color="text-blue-400" bgGlow="bg-blue-500/10"
            title="Rastreio Militar"
            subtitle="GPS em Tempo Real (Sem Delay)"
            detailContent={<p className="mt-4 text-sm text-white/60">Acompanhe o ícone do motoboy na rua exata. Atualização por segundo. Saiba exatamente quando descer para a portaria.</p>}
         />
         {/* CARD 4: CASHBACK VIRAL */}
         <MegaCard 
            icon={DollarSign} color="text-purple-400" bgGlow="bg-purple-500/10"
            title="Cashback Infinito"
            subtitle="Ganhe dinheiro de verdade."
            detailContent={<p className="mt-4 text-sm text-white/60">Convide um amigo: R$ 10 pra você, R$ 10 pra ele na carteira digital. Use em qualquer restaurante do ecossistema. Sem pontos que expiram.</p>}
         />
      </motion.div>
   )
}

// --- BUSINESS DETAILED CARDS ---
function BusinessMegaGrid() {
   return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-6 h-auto md:h-[800px]">
         {/* CARD 1: LUCRO AUTOMÁTICO (Grande Horizontal) */}
         <MegaCard 
            colSpan="md:col-span-3"
            icon={TrendingUp} color="text-purple-400" bgGlow="bg-purple-500/10"
            title="O Piloto Automático de Lucro"
            subtitle="Precificação Dinâmica & Modo Chuva com IA"
            detailContent={
               <div className="mt-6 grid md:grid-cols-2 gap-6">
                  <div className="bg-black/50 p-4 rounded-xl border border-purple-500/20">
                     <p className="text-purple-400 font-bold text-sm mb-2 flex items-center gap-2"><Clock size={14}/> Cenário: Alta Demanda (Sábado 20h)</p>
                     <p className="text-white/60 text-xs">A IA aumenta automaticamente a taxa de entrega em R$ 2,00 e o tempo médio em 15min para controlar o fluxo e maximizar a margem.</p>
                  </div>
                  <div className="bg-black/50 p-4 rounded-xl border border-blue-500/20">
                     <p className="text-blue-400 font-bold text-sm mb-2 flex items-center gap-2"><CloudRain size={14} className="text-blue-400"/> Cenário: Chuva Detectada</p>
                     <p className="text-white/60 text-xs">Ativação automática do "Modo Chuva", notificando clientes sobre possíveis atrasos e ajustando valores de frete para incentivar motoboys.</p>
                  </div>
               </div>
            }
         />
         {/* CARD 2: SEGURANÇA (Vertical) */}
         <MegaCard 
            icon={ShieldCheck} color="text-green-400" bgGlow="bg-green-500/10"
            title="Checkout Blindado"
            subtitle="Anti-Fraude & KYC"
            detailContent={<p className="mt-4 text-sm text-white/60">Validação de CPF na Receita Federal e análise de risco antes do pedido entrar. Reduza chargebacks a zero. Só clientes reais.</p>}
         />
         {/* CARD 3: KDS (Quadrado) */}
         <MegaCard 
            icon={ChefHat} color="text-orange-400" bgGlow="bg-orange-500/10"
            title="KDS: Cozinha Digital"
            subtitle="Fim das impressoras."
            detailContent={<p className="mt-4 text-sm text-white/60">Tela touch na cozinha. Pedidos organizados por tempo de preparo e cor. O cozinheiro dá "baixa" e o cliente é notificado na hora. Eficiência brutal.</p>}
         />
         {/* CARD 4: OMNICHANNEL (Grande Horizontal Baixo) */}
         <MegaCard 
            colSpan="md:col-span-3"
            icon={Zap} color="text-blue-400" bgGlow="bg-blue-500/10"
            title="Central de Comando Omnichannel"
            subtitle="Todos os canais. Uma única tela."
            detailContent={
               <div className="mt-4 flex gap-4 text-sm text-white/60 items-center">
                  <div className="flex -space-x-2 shrink-0">
                     <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-black font-bold text-[10px]">WPP</div>
                     <div className="w-8 h-8 rounded-full bg-[#ea1d2c] flex items-center justify-center text-white font-bold text-[10px]">IFD</div>
                     <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black font-bold text-[10px]">APP</div>
                  </div>
                  <p>Integração nativa de pedidos do WhatsApp (com bot), iFood (via hub), Balcão e seu App Próprio. Gerencie tudo no mesmo painel financeiro e KDS.</p>
               </div>
            }
         />
      </motion.div>
   )
}


// --- O COMPONENTE MEGA CARD (A Mágica Visual) ---
function MegaCard({ icon: Icon, title, subtitle, detailContent, color, bgGlow, colSpan = "" }: any) {
   return (
      <motion.div 
         whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.02)' }}
         className={`${colSpan} bg-[#121212] rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group transition-all duration-500 flex flex-col justify-between`}
      >
         {/* Glow de Fundo Dinâmico */}
         <div className={`absolute inset-0 ${bgGlow} opacity-0 group-hover:opacity-20 blur-[100px] transition-opacity duration-700 pointer-events-none`} />
         
         <div className="relative z-10">
            <div className={`w-14 h-14 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center mb-6 ${color} shadow-lg group-hover:scale-110 transition-transform`}>
               <Icon size={28} />
            </div>
            <h3 className="text-2xl font-black mb-2 text-white">{title}</h3>
            <p className="text-lg font-medium text-white/50">{subtitle}</p>
            
            {/* Conteúdo Detalhado (Aparece e expande) */}
            <div className="relative overflow-hidden max-h-0 group-hover:max-h-[500px] transition-all duration-700 ease-in-out opacity-0 group-hover:opacity-100">
               {detailContent}
            </div>
         </div>

         {/* Indicador de "Saiba Mais" */}
         <div className="absolute bottom-6 right-6 opacity-20 group-hover:opacity-100 transition-opacity delay-100">
            <ArrowRight className={`${color} group-hover:translate-x-2 transition-transform`}/>
         </div>
      </motion.div>
   )
}

// Ícone de Nuvem para o exemplo do Modo Chuva
const CloudRain = ({ size, className }: any) => (
   <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M8 19v2"/><path d="M8 13v2"/><path d="M16 19v2"/><path d="M16 13v2"/><path d="M12 21v2"/><path d="M12 15v2"/></svg>
);
