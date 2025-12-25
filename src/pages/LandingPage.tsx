import { motion } from 'framer-motion';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { 
  Camera, Sparkles, TrendingUp, CheckCircle2, ChevronRight, 
  Zap, ArrowRight, ShieldCheck, Clock, DollarSign, HelpCircle 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const BRANDS = ['SUCULÊNCIA', 'VENDAS', 'DELIVERY', 'APPS', 'LUCRO', 'PROFISSIONAL', 'DESEJO'];

const LandingPage = () => {
  return (
    <div className="flex flex-col bg-[#0a0a0a] text-white selection:bg-primary/30">
      
      {/* Floating CTA (Mobile) */}
      <div className="md:hidden fixed bottom-6 left-0 right-0 px-6 z-50">
        <Link to="/app">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full bg-neon-orange text-white py-5 rounded-3xl shadow-2xl flex items-center justify-center gap-3 text-xl font-black italic tracking-ultra-tight"
          >
            TESTAR GRÁTIS
            <ArrowRight className="w-6 h-6" />
          </motion.button>
        </Link>
      </div>

      {/* Nav */}
      <nav className="max-w-7xl mx-auto w-full px-6 py-8 flex justify-between items-center z-20">
        <div className="text-3xl font-black tracking-ultra-tight text-white">
          Emprata<span className="text-neon-orange italic">.ai</span>
        </div>
        <div className="hidden md:flex gap-10 items-center font-bold text-white/50 text-sm uppercase tracking-widest">
          <a href="#how" className="hover:text-white transition-colors">Tecnologia</a>
          <a href="#benefits" className="hover:text-white transition-colors">Ganhos</a>
          <a href="#pricing" className="hover:text-white transition-colors">Planos</a>
          <Link to="/app">
            <button className="bg-white/5 border border-white/10 text-white px-8 py-3 rounded-2xl font-black hover:bg-white/10 transition-all uppercase tracking-tight-titles">
              Acessar Engine
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero: ATTENTION */}
      <header className="relative max-w-7xl mx-auto px-6 pt-16 pb-32 flex flex-col items-center text-center overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[500px] bg-primary/20 blur-[120px] rounded-full z-0 opacity-20" />
        
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           className="z-10 relative"
        >
          <div className="inline-block px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8">
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neon-orange">Emprata Neural Engine™ v2.5</span>
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-ultra-tight leading-[0.95] mb-10 max-w-5xl mx-auto uppercase italic">
            PARE DE PERDER <span className="text-neon-orange">DINHEIRO</span> NO DELIVERY <br />
            POR CAUSA DE <span className="text-red-500">FOTO FEIA.</span>
          </h1>
          
          <p className="text-xl md:text-2xl font-bold text-white/70 max-w-3xl mx-auto mb-12 leading-relaxed">
            A tecnologia <span className="text-neon-orange italic">Neural Engine™</span> que os gigantes usam para fazer você salivar, agora nas suas mãos. <br />
            <span className="text-white text-2xl md:text-3xl block mt-4">Aumente suas vendas em até 3x ou seu dinheiro de volta.</span>
          </p>

          <Link to="/app">
             <motion.button 
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               animate={{ scale: [1, 1.02, 1] }}
               transition={{ repeat: Infinity, duration: 2 }}
               className="bg-neon-orange text-white px-12 py-8 rounded-[2.5rem] text-3xl font-black uppercase italic tracking-ultra-tight shadow-orange-intense mb-20 group shimmer"
             >
                Quero Vender Mais Agora
                <Zap className="inline-block ml-4 w-9 h-9 fill-current group-hover:rotate-12 transition-transform" />
             </motion.button>
          </Link>
        </motion.div>

        {/* Visual: Slider Compare - DRAMATIC CONTRAST */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.9 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true }}
           className="w-full max-w-6xl relative z-10"
        >
          <div className="rounded-[4rem] overflow-hidden border-[16px] border-[#1a1a1a] shadow-[0_50px_100px_-20px_rgba(0,0,0,1)]">
            <ReactCompareSlider
              position={50}
              handle={
                <div className="w-1.5 h-full bg-neon-orange relative flex items-center justify-center">
                   <div className="absolute w-14 h-14 bg-neon-orange rounded-full shadow-2xl flex items-center justify-center border-4 border-[#0a0a0a]">
                      <Zap className="w-7 h-7 text-white fill-current" />
                   </div>
                </div>
              }
              itemOne={
                <div className="relative h-[600px]">
                  <ReactCompareSliderImage 
                    src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1200" 
                    alt="Antes - Foto Amadora" 
                    className="w-full h-full object-cover"
                    style={{
                      filter: 'contrast(0.7) brightness(0.8) sepia(0.3) blur(1px) saturate(0.6) hue-rotate(10deg)',
                    }}
                  />
                  <div className="absolute top-8 left-8 bg-red-900/80 px-6 py-3 rounded-full border border-red-500/30 backdrop-blur-sm">
                    <span className="uppercase font-black text-sm tracking-wider text-white/90">
                      Sua foto hoje (Amadora)
                    </span>
                  </div>
                  <div className="absolute bottom-8 left-8 bg-black/60 px-4 py-2 rounded-2xl border border-white/10">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">😔 Cliente passa direto</p>
                  </div>
                </div>
              }
              itemTwo={
                <div className="relative h-[600px]">
                  <ReactCompareSliderImage 
                    src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1200" 
                    alt="Depois - Emprata AI" 
                    className="w-full h-full object-cover"
                    style={{
                      filter: 'saturate(1.4) contrast(1.15) brightness(1.05) sharpen(1.2)',
                    }}
                  />
                  <div className="absolute top-8 right-8 bg-neon-orange px-6 py-3 rounded-full shadow-xl shadow-orange-500/50">
                    <span className="uppercase font-black text-sm tracking-wider text-white">
                      Com Emprata AI (Vende Muito)
                    </span>
                  </div>
                  <div className="absolute bottom-12 right-12 flex flex-col items-end gap-2">
                     <div className="bg-black/80 p-6 rounded-3xl border border-white/10 backdrop-blur-xl animate-bounce">
                        <span className="text-3xl font-black text-neon-orange tracking-ultra-tight">+240%</span>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Aumento em Conversão</p>
                     </div>
                  </div>
                </div>
              }
              style={{ width: '100%', height: '600px' }}
            />
          </div>
        </motion.div>
      </header>

      {/* Marquee: DOPAMINE */}
      <div className="py-10 bg-neon-orange/10 border-y border-white/5 overflow-hidden">
        <div className="flex animate-[scroll_20s_linear_infinite]">
          <div className="flex gap-24 items-center shrink-0">
            {Array(10).fill(null).map((_, i) => (
              <div key={i} className="flex gap-24 items-center">
                {BRANDS.map(brand => (
                  <span key={`${brand}-${i}`} className="text-4xl font-black text-white/20 italic tracking-ultra-tight uppercase whitespace-nowrap">{brand}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: INTEREST (The Engine) */}
      <section id="how" className="max-w-7xl mx-auto px-6 py-40">
        <div className="grid md:grid-cols-2 gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="w-20 h-2 bg-neon-orange rounded-full" />
            <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] uppercase">Conheça o Emprata <span className="text-neon-orange">Neural Engine™</span></h2>
            <p className="text-xl md:text-2xl text-white/50 leading-relaxed font-medium">
               Não é filtro. É <span className="text-white">Ciência Gastronômica</span>. <br /><br />
               Nosso motor exclusivo analisa textura, iluminação e suculência para recriar o ambiente perfeito que dispara o gatilho da fome no cérebro do seu cliente.
            </p>
            <ul className="space-y-4 pt-6">
              {['Remoção Neural de Fundo', 'Relighting de Alta Gastronomia', 'Texturização via IA'].map(item => (
                <li key={item} className="flex items-center gap-4 text-lg font-bold">
                  <div className="w-6 h-6 bg-neon-orange rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <div className="relative aspect-square">
             {/* Neural Animation Mock */}
             <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-[4rem] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                  className="absolute inset-20 border-[2px] border-dashed border-white/10 rounded-full" 
                />
                <motion.div 
                   animate={{ scale: [1, 1.1, 1] }} 
                   transition={{ repeat: Infinity, duration: 4 }}
                   className="absolute inset-40 bg-neon-orange/20 blur-[60px] rounded-full" 
                />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="text-center space-y-4">
                      <Sparkles className="w-24 h-24 text-neon-orange mx-auto animate-pulse" />
                      <span className="block text-2xl font-black italic tracking-widest uppercase opacity-40">Analysing Texture...</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Section 3: DESIRE (Bento Grid) */}
      <section id="benefits" className="max-w-7xl mx-auto px-6 py-20">
         <div className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-black uppercase italic italic tracking-tighter">O Delivery <span className="text-neon-orange">Imparável.</span></h2>
         </div>

         <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              whileHover={{ rotateY: 10, rotateX: -5 }}
              className="glass-card glass-card-hover p-12 rounded-[3.5rem] md:col-span-2 relative overflow-hidden"
            >
               <TrendingUp className="w-16 h-16 text-neon-orange mb-8" />
               <h3 className="text-4xl font-extrabold mb-4 uppercase">O Fim da Guerra de Preços</h3>
               <p className="text-xl text-white/50 font-bold max-w-md italic">
                  <span className="text-white text-2xl block mb-2">Cobre mais caro pela mesma comida.</span>
                  Quando sua foto é irresistível, o cliente não compara preço. Ele compra.
               </p>
               <div className="absolute bottom-0 right-0 p-12 text-9xl font-black opacity-[0.03] uppercase italic">Sales</div>
            </motion.div>

            <motion.div 
              whileHover={{ rotateY: -10, rotateX: 5 }}
              className="glass-card glass-card-hover p-12 rounded-[3.5rem] bg-neon-orange"
            >
               <Clock className="w-16 h-16 text-white mb-8" />
               <h3 className="text-4xl font-extrabold mb-4 uppercase">Cardápios em Minutos</h3>
               <p className="text-xl text-white font-bold opacity-80 leading-tight">
                  <span className="text-2xl block mb-2">Não semanas. MINUTOS.</span>
                  Gere cardápios inteiros profissionais enquanto seu concorrente ainda está editando a primeira foto.
               </p>
            </motion.div>

            <motion.div 
              whileHover={{ rotateX: 10 }}
              className="glass-card glass-card-hover p-12 rounded-[3.5rem]"
            >
               <DollarSign className="w-16 h-16 text-neon-orange mb-8" />
               <h3 className="text-4xl font-extrabold mb-4 uppercase">Top 5% do Ranking</h3>
               <p className="text-xl text-white/50 font-bold">
                  <span className="text-white text-2xl block mb-2">Junte-se à elite.</span>
                  Apenas 5% dos restaurantes dominam os apps de delivery. Todos têm fotos profissionais. Coincidência?
               </p>
            </motion.div>

            <motion.div 
              whileHover={{ rotateY: 5 }}
              className="glass-card glass-card-hover p-12 rounded-[3.5rem] md:col-span-2 flex flex-col md:flex-row gap-8 items-center"
            >
               <ShieldCheck className="w-24 h-24 text-green-500 shrink-0" />
               <div>
                  <h3 className="text-4xl font-extrabold mb-4 uppercase tracking-tighter italic">Garantia de Conversão</h3>
                  <p className="text-xl text-white/50 font-bold max-w-sm">
                     Se seu clique no app de delivery não aumentar, devolvemos seu tempo (e seu investimento).
                  </p>
               </div>
            </motion.div>
         </div>

         {/* FOMO BANNER */}
         <div className="mt-12 bg-white/5 border-2 border-dashed border-white/20 p-8 rounded-[2.5rem] text-center">
            <p className="text-xl font-black uppercase tracking-widest text-[#FFC107] animate-pulse">
               ⚠️ Atenção: Devido à alta demanda de processamento, estamos limitando novos acessos diários.
            </p>
         </div>
      </section>

      {/* Section 4: ACTION (Pricing & FAQ) */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-40">
         <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-6">
              Escolha Seu <span className="text-neon-orange">Arsenal</span>
            </h2>
            <p className="text-xl text-white/50 font-medium max-w-2xl mx-auto">
              De teste gratuito a domínio total do mercado. Você escolhe o ritmo.
            </p>
         </div>

         <div className="grid md:grid-cols-3 gap-8 items-stretch mb-32">
            
            {/* TIER 1: FREE - Degustação */}
            <div className="glass-card p-10 rounded-[3.5rem] border-white/5 flex flex-col">
               <div className="mb-6">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Teste Grátis</span>
                  <h3 className="text-3xl font-black mt-2 mb-2 italic uppercase">Degustação</h3>
               </div>
               
               <div className="mb-8">
                  <div className="text-6xl font-black tracking-tight-titles mb-2 italic">R$ 0</div>
                  <p className="text-sm font-bold text-white/40">Sem cartão • Sem compromisso</p>
               </div>
               
               <ul className="space-y-3 mb-10 flex-grow text-sm font-bold text-white/60">
                  <li className="flex gap-3 items-start">
                     <CheckCircle2 className="w-5 h-5 text-white/20 shrink-0 mt-0.5" />
                     <span><span className="text-white">1 Crédito Único</span> para testar</span>
                  </li>
                  <li className="flex gap-3 items-start">
                     <CheckCircle2 className="w-5 h-5 text-white/20 shrink-0 mt-0.5" />
                     Baixa Resolução (720p)
                  </li>
                  <li className="flex gap-3 items-start">
                     <CheckCircle2 className="w-5 h-5 text-white/20 shrink-0 mt-0.5" />
                     Com Marca d'água
                  </li>
                  <li className="flex gap-3 items-start">
                     <CheckCircle2 className="w-5 h-5 text-white/20 shrink-0 mt-0.5" />
                     Apenas 1 Estilo disponível
                  </li>
               </ul>
               
               <Link to="/app" className="mt-auto">
                  <button className="w-full py-5 rounded-3xl border-2 border-white/10 font-black hover:bg-white/5 transition-all uppercase tracking-widest text-sm">
                     Testar Agora
                  </button>
               </Link>
            </div>

            {/* TIER 2: STARTER - Pack Delivery */}
            <div className="glass-card p-10 rounded-[3.5rem] border-white/10 flex flex-col relative">
               <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-6 py-2 rounded-full font-black text-xs tracking-widest uppercase">
                  Ideal para Cardápios Pequenos
               </div>
               
               <div className="mb-6 mt-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">Assinatura Mensal</span>
                  <h3 className="text-3xl font-black mt-2 mb-2 italic uppercase">Pack Delivery</h3>
               </div>
               
               <div className="mb-8">
                  <div className="flex items-baseline gap-2 mb-2">
                     <span className="text-6xl font-black tracking-tight-titles italic">R$ 97</span>
                     <span className="text-xl font-bold text-white/40">/mês</span>
                  </div>
                  <p className="text-sm font-bold text-blue-400">15 Créditos Mensais (Acumulativos)</p>
                  <p className="text-xs font-black text-white/30 mt-1">Sai a R$ 6,40 por foto</p>
               </div>
               
               <ul className="space-y-3 mb-10 flex-grow text-sm font-bold">
                  <li className="flex gap-3 items-start">
                     <Zap className="w-5 h-5 text-blue-400 fill-current shrink-0 mt-0.5" />
                     <span className="text-white">15 Créditos</span>
                  </li>
                  <li className="flex gap-3 items-start">
                     <Zap className="w-5 h-5 text-blue-400 fill-current shrink-0 mt-0.5" />
                     Resolução Full HD (1080p)
                  </li>
                  <li className="flex gap-3 items-start">
                     <Zap className="w-5 h-5 text-blue-400 fill-current shrink-0 mt-0.5" />
                     Sem Marca d'água
                  </li>
                  <li className="flex gap-3 items-start">
                     <Zap className="w-5 h-5 text-blue-400 fill-current shrink-0 mt-0.5" />
                     Todos os Estilos Pro
                  </li>
                  <li className="flex gap-3 items-start">
                     <Zap className="w-5 h-5 text-blue-400 fill-current shrink-0 mt-0.5" />
                     Suporte via Email
                  </li>
               </ul>
               
               <a 
                  href={`https://pay.kirvano.com/d5fb1f37-7512-492d-bb6f-b89840bdadc4?external_id=${localStorage.getItem('emprata_user_id') || 'guest'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto"
               >
                  <button className="w-full py-6 rounded-3xl bg-blue-500 hover:bg-blue-600 font-black text-white shadow-xl shadow-blue-500/30 uppercase tracking-tighter text-lg transition-all hover:scale-[1.02] active:scale-95">
                     Comprar Pack
                  </button>
               </a>
            </div>

            {/* TIER 3: PRO - Franquia */}
            <div className="glass-card p-10 rounded-[3.5rem] border-neon-orange shadow-[0_0_80px_rgba(255,94,0,0.15)] relative overflow-hidden flex flex-col scale-105">
               <div className="absolute top-0 right-0 bg-neon-orange text-white px-8 py-2 rounded-bl-3xl font-black text-[10px] tracking-widest uppercase italic">
                  MAIS VENDIDO • MELHOR ROI
               </div>
               
               <div className="mb-6 mt-8">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neon-orange">Assinatura Mensal</span>
                  <h3 className="text-3xl font-black mt-2 mb-2 italic uppercase">Franquia / Pro</h3>
               </div>
               
               <div className="mb-8">
                  <div className="flex items-baseline gap-2 mb-2">
                     <span className="text-6xl font-black tracking-tight-titles italic">R$ 197</span>
                     <span className="text-xl font-bold text-white/40">/mês</span>
                  </div>
                  <p className="text-sm font-bold text-neon-orange">50 Créditos Mensais + Vibes Exclusivas</p>
                  <p className="text-xs font-black text-white/30 mt-1">Sai a R$ 3,90 por foto 🔥</p>
               </div>
               
               <div className="bg-neon-orange/10 border border-neon-orange/20 rounded-2xl p-4 mb-8">
                  <p className="text-xs font-black text-neon-orange uppercase tracking-wider">
                     💡 Recomendado para Dark Kitchens
                  </p>
               </div>
               
               <ul className="space-y-3 mb-10 flex-grow text-sm font-bold">
                  <li className="flex gap-3 items-start">
                     <Zap className="w-5 h-5 text-neon-orange fill-current shrink-0 mt-0.5" />
                     <span className="text-white">50 Créditos Premium</span>
                  </li>
                  <li className="flex gap-3 items-start">
                     <Zap className="w-5 h-5 text-neon-orange fill-current shrink-0 mt-0.5" />
                     Resolução 4K Ultra HD
                  </li>
                  <li className="flex gap-3 items-start">
                     <Zap className="w-5 h-5 text-neon-orange fill-current shrink-0 mt-0.5" />
                     Sem Marca d'água
                  </li>
                  <li className="flex gap-3 items-start">
                     <Zap className="w-5 h-5 text-neon-orange fill-current shrink-0 mt-0.5" />
                     Todos os Estilos + Exclusivos
                  </li>
                  <li className="flex gap-3 items-start">
                     <Zap className="w-5 h-5 text-neon-orange fill-current shrink-0 mt-0.5" />
                     Suporte Prioritário WhatsApp
                  </li>
                  <li className="flex gap-3 items-start">
                     <Zap className="w-5 h-5 text-neon-orange fill-current shrink-0 mt-0.5" />
                     Processamento Mais Rápido
                  </li>
               </ul>
               
               <button 
                  onClick={() => alert('Link do PRO será configurado em breve! Por enquanto, use o Pack Delivery.')}
                  className="w-full py-6 rounded-3xl bg-neon-orange font-black text-white shadow-xl shadow-primary/30 uppercase tracking-tighter text-lg hover:scale-[1.02] transition-all active:scale-95 mt-auto"
               >
                  Quero Lucro Máximo
               </button>
            </div>

         </div>

         {/* FAQ */}
         <div className="max-w-3xl mx-auto">
            <h3 className="text-4xl font-black uppercase text-center mb-16 italic underline decoration-neon-orange underline-offset-8">Matador de Dúvidas</h3>
            <div className="space-y-6">
               {[
                 { q: 'Preciso saber design?', a: 'Zero. O Emprata Neural Engine™ faz tudo sozinho. É literalmente arrastar e baixar.' },
                 { q: 'Funciona para qualquer prato?', a: 'Sim. Somos especialistas em Marmitas, Burgers, Pizzas e Sushi. A IA identifica a textura correta para cada categoria.' },
                 { q: 'As fotos parecem reais?', a: 'Sim. A tecnologia Neural Engine™ simula física de luz real, garantindo que o cliente sinta vontade de morder a tela.' }
               ].map((item, i) => (
                 <div key={i} className="glass-card p-8 rounded-3xl border-white/5">
                    <h5 className="text-lg font-black uppercase mb-4 flex gap-3 text-neon-orange"><HelpCircle className="w-6 h-6 shrink-0" /> {item.q}</h5>
                    <p className="text-white/50 font-medium">{item.a}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      <footer className="py-20 border-t border-white/5 text-center relative overflow-hidden">
         <div className="relative z-10 space-y-8">
            <div className="text-3xl font-black tracking-tighter italic">Emprata<span className="text-neon-orange">.ai</span></div>
            <p className="text-white/30 text-xs font-bold uppercase tracking-[0.5em]">TECNOLOGIA GASTRONÔMICA PROPRIETÁRIA</p>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;
