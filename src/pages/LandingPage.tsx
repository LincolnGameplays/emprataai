/**
 * 🚀 ULTRA LANDING PAGE - Surreal Experience
 * 
 * Features:
 * - Split Screen with parallax & grayscale-to-color effect
 * - Scroll storytelling with Framer Motion transforms
 * - Bento Grid with animated toggle between Consumer/Business
 * - Cinematographic transitions
 */

import { useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, ChefHat, ShieldCheck, Smartphone, 
  TrendingUp, LayoutGrid, 
  MapPin, DollarSign, BrainCircuit 
} from 'lucide-react';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'consumer' | 'business'>('consumer');
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Scroll Progress para Parallax
  const { scrollYProgress } = useScroll({ target: containerRef });
  const yHero = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacityHero = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050505] text-white selection:bg-primary selection:text-black overflow-x-hidden font-sans">
      
      {/* --- NAVBAR FLUTUANTE --- */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-black/50 backdrop-blur-xl border border-white/10 px-8 py-3 rounded-full flex items-center gap-8 shadow-2xl">
         <span className="text-xl font-black italic tracking-tighter cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            Emprata<span className="text-primary">.ai</span>
         </span>
         <div className="hidden md:flex gap-6 text-sm font-bold text-white/60">
            <button onClick={() => document.getElementById('details')?.scrollIntoView({behavior: 'smooth'})} className="hover:text-white transition-colors">Funcionalidades</button>
            <button onClick={() => navigate('/apps')} className="hover:text-white transition-colors">Apps</button>
         </div>
         <button onClick={() => navigate('/auth')} className="bg-white text-black px-5 py-2 rounded-full text-xs font-black hover:scale-105 transition-transform">
            LOGIN
         </button>
      </nav>

      {/* --- HERO SECTION (SPLIT INTERATIVO) --- */}
      <motion.section 
        style={{ y: yHero, opacity: opacityHero }}
        className="relative h-screen w-full flex flex-col md:flex-row overflow-hidden"
      >
        {/* LADO CONSUMIDOR */}
        <SplitSide 
          side="left" 
          title="Fome de Futuro?" 
          subtitle="A única IA que conhece seu paladar."
          color="primary"
          onClick={() => navigate('/delivery')}
          bgImage="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop"
        />

        {/* LADO BUSINESS */}
        <SplitSide 
          side="right" 
          title="Gestão Neural." 
          subtitle="Automatize sua loja com Inteligência Artificial."
          color="purple"
          onClick={() => navigate('/auth')}
          bgImage="https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=2070&auto=format&fit=crop"
        />
        
        {/* SCROLL INDICATOR */}
        <motion.div 
           initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
           className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20 pointer-events-none mix-blend-difference"
        >
           <span className="text-[10px] font-black uppercase tracking-[0.3em]">Explore</span>
           <motion.div 
             animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}
             className="w-px h-12 bg-white" 
           />
        </motion.div>
      </motion.section>

      {/* --- DETALHES "DEEP DIVE" (Onde a mágica acontece) --- */}
      <section id="details" className="relative z-10 bg-[#050505] min-h-screen pt-20 pb-32 px-6 md:px-20">
         
         {/* TÍTULO DA SEÇÃO */}
         <div className="max-w-4xl mx-auto text-center mb-20">
            <motion.h2 
              initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-4xl md:text-7xl font-black tracking-tighter mb-6"
            >
               Um Ecossistema. <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-purple-500">
                  Duas Realidades.
               </span>
            </motion.h2>
            
            {/* TOGGLE SWITCH */}
            <div className="inline-flex bg-[#121212] p-2 rounded-full border border-white/10 relative">
               <motion.div 
                  layoutId="activeTab"
                  className={`absolute inset-2 w-[calc(50%-8px)] rounded-full ${activeTab === 'consumer' ? 'bg-primary' : 'bg-purple-600 left-[50%]'}`}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
               />
               <button 
                  onClick={() => setActiveTab('consumer')}
                  className={`relative z-10 px-8 py-3 rounded-full text-sm font-black uppercase tracking-wider transition-colors ${activeTab === 'consumer' ? 'text-black' : 'text-white/40 hover:text-white'}`}
               >
                  Para Você
               </button>
               <button 
                  onClick={() => setActiveTab('business')}
                  className={`relative z-10 px-8 py-3 rounded-full text-sm font-black uppercase tracking-wider transition-colors ${activeTab === 'business' ? 'text-white' : 'text-white/40 hover:text-white'}`}
               >
                  Para Negócios
               </button>
            </div>
         </div>

         {/* CONTEÚDO DINÂMICO (BENTO GRID) */}
         <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
               {activeTab === 'consumer' ? <ConsumerContent key="c" /> : <BusinessContent key="b" />}
            </AnimatePresence>
         </div>

      </section>

      {/* --- FOOTER CTA --- */}
      <section className="py-32 border-t border-white/5 relative overflow-hidden">
         <div className="absolute inset-0 bg-primary/5 blur-[100px]" />
         <div className="relative z-10 text-center px-6">
            <h2 className="text-5xl md:text-8xl font-black italic tracking-tighter mb-8">
               EMPRATA<span className="text-primary">.AI</span>
            </h2>
            <p className="text-white/40 max-w-lg mx-auto mb-10 text-lg">
               O futuro do delivery já chegou. Você vem junto?
            </p>
            <div className="flex flex-col md:flex-row justify-center gap-4">
               <button onClick={() => navigate('/delivery')} className="bg-white text-black px-10 py-5 rounded-2xl font-black text-lg hover:scale-105 transition-transform">
                  PEDIR COMIDA
               </button>
               <button onClick={() => navigate('/auth')} className="bg-[#121212] border border-white/20 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-white/5 transition-colors">
                  CADASTRAR RESTAURANTE
               </button>
            </div>
         </div>
      </section>

    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ══════════════════════════════════════════════════════════════════

function SplitSide({ side, title, subtitle, color, onClick, bgImage }: any) {
   const isLeft = side === 'left';
   
   return (
      <motion.div 
         initial={{ x: isLeft ? '-100%' : '100%' }}
         animate={{ x: '0%' }}
         transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
         className={`relative flex-1 h-[50vh] md:h-full flex flex-col justify-center p-12 md:p-24 group cursor-pointer overflow-hidden border-b md:border-b-0 md:border-r border-white/10`}
         onClick={onClick}
      >
         {/* Background Image with Zoom Effect */}
         <div className="absolute inset-0 z-0">
            <motion.div 
               whileHover={{ scale: 1.1 }}
               transition={{ duration: 1.5 }}
               className="w-full h-full bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-700"
               style={{ backgroundImage: `url(${bgImage})` }}
            />
            <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-500" />
            <div className={`absolute inset-0 bg-gradient-to-${isLeft ? 'r' : 'l'} from-black to-transparent`} />
         </div>

         <div className="relative z-10 max-w-lg">
            <motion.div 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
               className={`flex items-center gap-2 mb-6`}
            >
               <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border bg-black/50 backdrop-blur-md ${color === 'primary' ? 'text-primary border-primary/30' : 'text-purple-400 border-purple-500/30'}`}>
                  {isLeft ? 'Consumidor' : 'Parceiro'}
               </span>
            </motion.div>
            
            <h2 className="text-5xl md:text-7xl font-black leading-tight mb-6 group-hover:translate-x-2 transition-transform duration-500">
               {title}
            </h2>
            <p className="text-white/60 text-lg md:text-xl font-medium mb-10 max-w-sm group-hover:text-white transition-colors">
               {subtitle}
            </p>

            <motion.div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
               <span className={`text-lg font-bold border-b-2 ${color === 'primary' ? 'border-primary text-primary' : 'border-purple-400 text-purple-400'}`}>
                  Começar Agora
               </span>
               <ArrowRight />
            </motion.div>
         </div>
      </motion.div>
   )
}

function ConsumerContent() {
   return (
      <motion.div 
         initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
         className="grid md:grid-cols-3 gap-6"
      >
         <BentoCard 
            title="IA Sommelier" 
            desc="O EmprataBrain aprende o que você gosta. Odeia coentro? Ama apimentado? A gente sabe."
            icon={BrainCircuit}
            colSpan="md:col-span-2"
            bg="bg-gradient-to-br from-[#121212] to-black"
         />
         <BentoCard 
            title="Entrega Flash" 
            desc="Rastreamento GPS em tempo real. Veja sua comida chegando na esquina."
            icon={MapPin}
            color="text-green-400"
         />
         <BentoCard 
            title="Cashback Real" 
            desc="Ganhe moedas em cada pedido e use em qualquer loja da rede."
            icon={DollarSign}
            color="text-yellow-400"
         />
         <BentoCard 
            title="Cardápio Vivo" 
            desc="Chega de texto. Veja vídeos reais dos pratos antes de pedir. É Food Porn no seu bolso."
            icon={Smartphone}
            colSpan="md:col-span-2"
            bg="bg-[#121212]"
            hasImage="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000&auto=format&fit=crop"
         />
      </motion.div>
   )
}

function BusinessContent() {
   return (
      <motion.div 
         initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
         className="grid md:grid-cols-3 gap-6"
      >
         <BentoCard 
            title="Lucro Automático" 
            desc="Nossa IA sugere preços dinâmicos. Choveu? O preço ajusta. Loja vazia? Promoção dispara."
            icon={TrendingUp}
            color="text-purple-400"
         />
         <BentoCard 
            title="Gestão 360º" 
            desc="KDS (Cozinha), Logística de Motoboys e Financeiro em um único Dashboard."
            icon={LayoutGrid}
            colSpan="md:col-span-2"
            bg="bg-gradient-to-br from-[#121212] to-black"
         />
         <BentoCard 
            title="Segurança Militar" 
            desc="Validação de CPF, proteção contra Chargeback e avaliações 100% reais."
            icon={ShieldCheck}
            colSpan="md:col-span-2"
            bg="bg-[#121212]"
            hasImage="https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=1000&auto=format&fit=crop"
         />
         <BentoCard 
            title="Taxa Justa" 
            desc="Planos que cabem no bolso. Deixe de ser sócio majoritário dos apps grandes."
            icon={DollarSign}
            color="text-green-400"
         />
      </motion.div>
   )
}

function BentoCard({ title, desc, icon: Icon, colSpan = "", bg = "bg-[#121212]", color = "text-white", hasImage }: any) {
   return (
      <div className={`${colSpan} ${bg} rounded-[2rem] p-8 border border-white/5 relative overflow-hidden group hover:border-white/20 transition-all min-h-[250px] flex flex-col justify-between`}>
         
         {hasImage && (
            <>
               <div className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: `url(${hasImage})` }} />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            </>
         )}

         <div className="relative z-10">
            <div className={`w-12 h-12 rounded-xl bg-white/5 backdrop-blur-md flex items-center justify-center mb-4 ${color}`}>
               <Icon size={24} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">{title}</h3>
            <p className="text-white/60 font-medium leading-relaxed">{desc}</p>
         </div>

         {/* Efeito Hover */}
         <div className="absolute -bottom-2 -right-2 p-20 bg-white/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-white/10 transition-colors" />
      </div>
   )
}
