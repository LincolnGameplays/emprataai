/**
 * Landing Page - Killer Conversion Design
 * Bento Grid, Cinematic Hero, ROI Calculator
 */

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { 
  Zap, Camera, ChefHat, TrendingUp, Smartphone, QrCode,
  CheckCircle, Star, ArrowRight, Play, Sparkles, DollarSign,
  Users, Clock, Shield, HelpCircle, ChevronRight
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// ══════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ══════════════════════════════════════════════════════════════════

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } }
};

// ══════════════════════════════════════════════════════════════════
// SOCIAL PROOF BRANDS
// ══════════════════════════════════════════════════════════════════

const BRANDS = [
  'Burger Kingdom', 'Pizza Express', 'Açaí Premium', 'Sushi Master',
  'Poke Bowl', 'Fit Kitchen', 'Taco Loco', 'Frozen Delights'
];

// ══════════════════════════════════════════════════════════════════
// ANIMATED SECTION WRAPPER
// ══════════════════════════════════════════════════════════════════

function AnimatedSection({ 
  children, 
  className = '',
  id
}: { 
  children: React.ReactNode; 
  className?: string;
  id?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ══════════════════════════════════════════════════════════════════
// BENTO CARD COMPONENT
// ══════════════════════════════════════════════════════════════════

function BentoCard({
  title,
  description,
  icon,
  className = '',
  gradient = false,
  children
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
  gradient?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      className={`
        relative p-6 md:p-8 rounded-3xl border border-white/10
        bg-gradient-to-br from-white/5 to-transparent
        overflow-hidden group cursor-pointer
        ${className}
      `}
    >
      {/* Hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
          {icon}
        </div>
        <h3 className="text-xl md:text-2xl font-black tracking-tight mb-2">{title}</h3>
        <p className="text-white/50 text-sm md:text-base">{description}</p>
        {children}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function LandingPage() {
  const { user } = useAuth();
  const [ordersPerDay, setOrdersPerDay] = useState(50);
  
  // Parallax
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  // ROI Calculation
  const lostRevenue = Math.round(ordersPerDay * 0.15 * 35 * 30);

  /**
   * Handle checkout
   */
  const handleCheckout = (plan: 'starter' | 'pro') => {
    const links = {
      starter: "https://pay.kirvano.com/30cef9d1-c08e-49ed-b361-2862f182485f",
      pro: "https://pay.kirvano.com/b26facd0-9585-4b17-8b68-d58aaf659939"
    };
    const url = links[plan];
    const finalLink = user ? `${url}?external_id=${user.uid}` : url;
    window.open(finalLink, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      
      {/* ══════════════════════════════════════════════════════════ */}
      {/* NAVBAR */}
      {/* ══════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black italic tracking-tighter">
            Emprata<span className="text-primary">.ai</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-white/50">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Preços</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2.5 bg-primary rounded-full font-bold text-sm"
                >
                  Dashboard
                </motion.button>
              </Link>
            ) : (
              <>
                <Link to="/auth" className="hidden md:block text-sm font-bold text-white/60 hover:text-white px-4 py-2">
                  Entrar
                </Link>
                <Link to="/dashboard">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-2.5 bg-primary rounded-full font-bold text-sm shadow-lg shadow-primary/30"
                  >
                    Começar Grátis
                  </motion.button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* HERO SECTION - CINEMATIC */}
      {/* ══════════════════════════════════════════════════════════ */}
      <header className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] opacity-50" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[120px] opacity-30" />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />

        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-6xl mx-auto px-6 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-white/60">
              Neural Engine v3.0 — IA Generativa
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-6"
          >
            O Sistema Operacional<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-yellow-500">
              do seu Delivery.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xl md:text-2xl text-white/50 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            IA que <span className="text-white font-bold">fotografa</span>, 
            Cardápio que <span className="text-white font-bold">vende</span> e 
            Gestão que <span className="text-white font-bold">lucra</span>.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(255,107,0,0.4)' }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-primary hover:bg-orange-600 rounded-2xl font-black text-lg uppercase tracking-wide flex items-center gap-3 shadow-2xl shadow-primary/30"
              >
                <Zap className="w-5 h-5 fill-current" />
                Começar Grátis
              </motion.button>
            </Link>
            <button className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-lg flex items-center gap-3 transition-colors">
              <Play className="w-5 h-5" />
              Ver Demo
            </button>
          </motion.div>

          {/* Floating Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 1 }}
            className="mt-16 relative"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="relative mx-auto max-w-4xl"
            >
              <div className="aspect-video bg-gradient-to-br from-white/10 to-white/5 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <img 
                  src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80"
                  alt="Food Photography"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                  <div className="bg-black/60 backdrop-blur-xl rounded-2xl px-6 py-3 border border-white/10">
                    <span className="text-primary font-black">+847%</span>
                    <span className="text-white/60 text-sm ml-2">mais cliques</span>
                  </div>
                  <div className="bg-primary rounded-2xl px-6 py-3 font-bold">
                    Foto gerada por IA
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2"
          >
            <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
          </motion.div>
        </motion.div>
      </header>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SOCIAL PROOF TICKER */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="py-8 border-y border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="flex items-center">
          <span className="px-6 text-xs font-bold uppercase tracking-widest text-white/30 whitespace-nowrap">
            Usado por deliveries que faturam alto:
          </span>
          <div className="flex animate-[scroll_30s_linear_infinite]">
            {[...BRANDS, ...BRANDS].map((brand, i) => (
              <span 
                key={i} 
                className="px-8 text-lg font-black text-white/20 whitespace-nowrap"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* PROBLEM VS SOLUTION SLIDER */}
      {/* ══════════════════════════════════════════════════════════ */}
      <AnimatedSection className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            A diferença está nos <span className="text-primary">detalhes.</span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Arraste para ver a transformação que multiplica suas vendas.
          </p>
        </div>

        <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          <ReactCompareSlider
            position={50}
            handle={
              <div className="w-1 h-full bg-primary flex items-center justify-center">
                <div className="w-12 h-12 bg-primary rounded-full shadow-xl flex items-center justify-center border-4 border-black">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              </div>
            }
            itemOne={
              <div className="relative h-[500px]">
                <ReactCompareSliderImage
                  src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80"
                  alt="Antes"
                  className="w-full h-full object-cover"
                  style={{ filter: 'brightness(0.6) saturate(0.5) contrast(0.8)' }}
                />
                <div className="absolute top-6 left-6 bg-red-900/80 backdrop-blur px-4 py-2 rounded-full border border-red-500/30">
                  <span className="text-sm font-bold text-red-300">❌ Foto de Celular</span>
                </div>
                <div className="absolute bottom-6 left-6 bg-black/80 backdrop-blur px-4 py-2 rounded-xl">
                  <span className="text-white/50 text-sm">Conversão: <span className="text-red-400 font-bold">2.1%</span></span>
                </div>
              </div>
            }
            itemTwo={
              <div className="relative h-[500px]">
                <ReactCompareSliderImage
                  src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80"
                  alt="Depois"
                  className="w-full h-full object-cover"
                  style={{ filter: 'saturate(1.3) contrast(1.1) brightness(1.05)' }}
                />
                <div className="absolute top-6 right-6 bg-primary px-4 py-2 rounded-full shadow-lg">
                  <span className="text-sm font-bold">✨ Emprata.ai</span>
                </div>
                <div className="absolute bottom-6 right-6 bg-black/80 backdrop-blur px-4 py-2 rounded-xl">
                  <span className="text-white/50 text-sm">Conversão: <span className="text-green-400 font-bold">8.7%</span></span>
                </div>
              </div>
            }
            style={{ height: '500px' }}
          />
        </div>
      </AnimatedSection>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* BENTO GRID FEATURES */}
      {/* ══════════════════════════════════════════════════════════ */}
      <AnimatedSection id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            Tudo que você precisa.<br />
            <span className="text-primary">Num só lugar.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Large Card - Neural Engine */}
          <BentoCard
            title="Neural Engine"
            description="IA treinada em milhões de fotos gastronômicas. Transforma qualquer foto de celular em imagem profissional."
            icon={<Camera className="w-6 h-6 text-primary" />}
            className="md:col-span-2 md:row-span-2"
          >
            <div className="mt-6 aspect-video bg-black/50 rounded-2xl overflow-hidden border border-white/10">
              <motion.img
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
                src="https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80"
                alt="Burger"
                className="w-full h-full object-cover"
              />
            </div>
          </BentoCard>

          {/* Medium Card - Cardápio */}
          <BentoCard
            title="Cardápio Vivo"
            description="QR Code dinâmico com fotos que vendem. Atualização em tempo real."
            icon={<QrCode className="w-6 h-6 text-blue-400" />}
          >
            <div className="mt-4 flex items-center gap-3">
              <Smartphone className="w-8 h-8 text-white/20" />
              <span className="text-xs text-white/40">Escaneie e veja</span>
            </div>
          </BentoCard>

          {/* Medium Card - Garçom */}
          <BentoCard
            title="Modo Garçom"
            description="App ultrarrápido para lançar pedidos. Sem treinamento."
            icon={<ChefHat className="w-6 h-6 text-green-400" />}
          >
            <div className="mt-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-white/40" />
              <span className="text-xs text-white/40">Setup em 2 min</span>
            </div>
          </BentoCard>

          {/* Small Card - Analytics */}
          <BentoCard
            title="Analytics em Tempo Real"
            description="Dashboard com métricas que importam."
            icon={<TrendingUp className="w-6 h-6 text-purple-400" />}
          />

          {/* Small Card - Equipe */}
          <BentoCard
            title="Gestão de Equipe"
            description="Controle de garçons e performance."
            icon={<Users className="w-6 h-6 text-yellow-400" />}
          />

          {/* Small Card - Segurança */}
          <BentoCard
            title="Seguro e Rápido"
            description="Dados criptografados. 99.9% uptime."
            icon={<Shield className="w-6 h-6 text-cyan-400" />}
          />
        </div>
      </AnimatedSection>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ROI CALCULATOR */}
      {/* ══════════════════════════════════════════════════════════ */}
      <AnimatedSection className="max-w-4xl mx-auto px-6 py-24">
        <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-2">
              Calculadora de <span className="text-primary">Oportunidade Perdida</span>
            </h2>
            <p className="text-white/50">Descubra quanto dinheiro você está deixando escapar.</p>
          </div>

          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-white/60">Pedidos por dia:</span>
                <span className="text-2xl font-black text-primary">{ordersPerDay}</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                value={ordersPerDay}
                onChange={(e) => setOrdersPerDay(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
              <p className="text-sm text-red-400 mb-2">
                Você está deixando na mesa por mês:
              </p>
              <p className="text-4xl md:text-5xl font-black text-red-400">
                R$ {lostRevenue.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-white/40 mt-2">
                * Baseado em 15% de aumento de conversão com fotos profissionais
              </p>
            </div>

            <Link to="/dashboard" className="block">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-primary hover:bg-orange-600 rounded-2xl font-black text-lg transition-colors"
              >
                Recuperar Esse Dinheiro Agora
              </motion.button>
            </Link>
          </div>
        </div>
      </AnimatedSection>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* PRICING */}
      {/* ══════════════════════════════════════════════════════════ */}
      <AnimatedSection id="pricing" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            Preço Justo.<br />
            <span className="text-primary">Valor Absurdo.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {/* Free */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col">
            <h3 className="text-2xl font-black mb-2">Grátis</h3>
            <p className="text-4xl font-black mb-6">R$ 0</p>
            <ul className="space-y-3 mb-8 flex-1 text-sm text-white/60">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-white/30" />
                1 crédito para testar
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-white/30" />
                Resolução 720p
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-white/30" />
                Com marca d'água
              </li>
            </ul>
            <Link to="/dashboard">
              <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors">
                Começar Grátis
              </button>
            </Link>
          </div>

          {/* Starter */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col">
            <h3 className="text-2xl font-black mb-2">Pack Delivery</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-black">R$ 97</span>
              <span className="text-white/40">/mês</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                50 créditos/mês
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                Full HD (1080p)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                Sem marca d'água
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                Todos os estilos
              </li>
            </ul>
            <button 
              onClick={() => handleCheckout('starter')}
              className="w-full py-4 bg-blue-500 hover:bg-blue-600 rounded-xl font-bold transition-colors"
            >
              Assinar Pack
            </button>
          </div>

          {/* Pro */}
          <div className="relative bg-gradient-to-br from-primary/20 to-transparent border-2 border-primary rounded-3xl p-8 flex flex-col scale-105 shadow-2xl shadow-primary/20">
            {/* Badge */}
            <motion.div
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider"
            >
              ⭐ Mais Vendido
            </motion.div>

            <h3 className="text-2xl font-black mb-2 mt-4">Franquia / Pro</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-black text-primary">R$ 197</span>
              <span className="text-white/40">/mês</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="font-bold">200 créditos/mês</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                4K Ultra HD
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                Estilos exclusivos
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                Suporte prioritário
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                Processamento rápido
              </li>
            </ul>
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(255,107,0,0.5)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCheckout('pro')}
              className="w-full py-4 bg-primary hover:bg-orange-600 rounded-xl font-black transition-colors"
            >
              Quero Lucrar Mais
            </motion.button>
          </div>
        </div>
      </AnimatedSection>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* FAQ */}
      {/* ══════════════════════════════════════════════════════════ */}
      <AnimatedSection id="faq" className="max-w-4xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black tracking-tighter mb-4">
            Dúvidas? <span className="text-primary">Respostas.</span>
          </h2>
        </div>

        <div className="space-y-4">
          {[
            { q: 'Preciso saber editar fotos?', a: 'Não! A IA faz tudo automaticamente. Você só precisa tirar a foto e clicar em gerar.' },
            { q: 'Funciona para qualquer tipo de comida?', a: 'Sim! Treinamos a IA em milhões de fotos de todos os tipos: pizzas, burgers, sushi, marmitas, sobremesas...' },
            { q: 'Posso cancelar a qualquer momento?', a: 'Com certeza. Sem multas, sem burocracia. Cancele direto no painel.' },
            { q: 'As fotos parecem reais?', a: 'Absolutamente. Nossa tecnologia Neural Engine simula iluminação física real, garantindo fotos hiper-realistas.' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <h4 className="font-bold text-lg flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                {item.q}
              </h4>
              <p className="text-white/50 mt-2 ml-8">{item.a}</p>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-2xl font-black italic tracking-tighter">
              Emprata<span className="text-primary">.ai</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacidade</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Termos</Link>
              <a href="mailto:suporte@emprata.ai" className="hover:text-white transition-colors">Suporte</a>
            </div>
            <p className="text-xs text-white/30">
              © 2025 Emprata.ai • Todos os direitos reservados
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile CTA Fixed */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-black/95 backdrop-blur-xl border-t border-white/10 z-50">
        <Link to="/dashboard">
          <button className="w-full py-4 bg-primary rounded-2xl font-black text-lg flex items-center justify-center gap-2">
            <Zap className="w-5 h-5" />
            Começar Grátis
          </button>
        </Link>
      </div>
    </div>
  );
}
