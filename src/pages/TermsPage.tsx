import { motion } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Voltar</span>
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary/20 rounded-2xl p-3">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white">Termos de Uso</h1>
          </div>
          <p className="text-white/60 text-lg">Última atualização: 25 de dezembro de 2024</p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="prose prose-invert max-w-none"
        >
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-8">
            
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Aceitação dos Termos</h2>
              <p className="text-white/70 leading-relaxed">
                Ao acessar e utilizar a plataforma <strong className="text-white">Emprata AI</strong>, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não utilize nossos serviços.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Descrição do Serviço</h2>
              <p className="text-white/70 leading-relaxed">
                A Emprata AI é uma plataforma de inteligência artificial que permite aos usuários gerar imagens profissionais através de prompts de texto. O serviço é fornecido <strong className="text-white">"como está"</strong> e <strong className="text-white">"conforme disponível"</strong>, sem garantias de qualquer tipo, expressas ou implícitas.
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Uso Aceitável</h2>
              <p className="text-white/70 leading-relaxed mb-3">
                Você concorda em utilizar a plataforma apenas para fins legais e de acordo com estes Termos. É <strong className="text-white">PROIBIDO</strong>:
              </p>
              <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
                <li>Gerar conteúdo ilegal, difamatório, obsceno ou que viole direitos de terceiros</li>
                <li>Utilizar o serviço para criar deepfakes ou conteúdo enganoso</li>
                <li>Tentar burlar o sistema de créditos ou acessar funcionalidades não autorizadas</li>
                <li>Revender ou redistribuir o acesso à plataforma sem autorização</li>
                <li>Utilizar bots, scripts ou automações para abusar do serviço</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Propriedade Intelectual</h2>
              <p className="text-white/70 leading-relaxed">
                As imagens geradas pela IA são de <strong className="text-white">propriedade do usuário</strong> que as criou. No entanto, a Emprata AI não se responsabiliza por:
              </p>
              <ul className="list-disc list-inside text-white/70 space-y-2 ml-4 mt-3">
                <li>Violações de direitos autorais ou marcas registradas nas imagens geradas</li>
                <li>Uso indevido das imagens por parte do usuário</li>
                <li>Similaridades não intencionais com obras protegidas por direitos autorais</li>
              </ul>
              <p className="text-white/70 leading-relaxed mt-3">
                <strong className="text-white">Importante:</strong> Você é o único responsável pelo uso comercial ou público das imagens geradas.
              </p>
            </section>

            {/* Section 5 - CRITICAL: 7-DAY REFUND */}
            <section className="bg-primary/10 border-2 border-primary/30 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-primary">⚖️</span> 5. Política de Reembolso (CDC Art. 49)
              </h2>
              <p className="text-white/70 leading-relaxed mb-3">
                Em conformidade com o <strong className="text-white">Artigo 49 do Código de Defesa do Consumidor (CDC)</strong>, você tem o direito de desistir da compra em até <strong className="text-white">7 (sete) dias corridos</strong> a partir da data da contratação ou do recebimento do produto/serviço.
              </p>
              <div className="bg-white/5 rounded-xl p-4 mt-4">
                <h3 className="text-lg font-bold text-white mb-2">Condições para Reembolso:</h3>
                <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
                  <li>Solicitação deve ser feita em até 7 dias corridos após a compra</li>
                  <li>Reembolso integral do valor pago</li>
                  <li>Créditos não utilizados serão removidos da conta</li>
                  <li>Prazo de processamento: até 10 dias úteis</li>
                </ul>
              </div>
              <p className="text-white/70 leading-relaxed mt-4">
                Para solicitar reembolso, envie um e-mail para: <a href="mailto:reembolso@emprata.ai" className="text-primary hover:underline font-bold">reembolso@emprata.ai</a>
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Planos e Créditos</h2>
              <p className="text-white/70 leading-relaxed">
                Os créditos adquiridos são <strong className="text-white">acumulativos</strong> e não expiram enquanto sua assinatura estiver ativa. Em caso de cancelamento, os créditos restantes serão perdidos. Não há reembolso parcial de créditos não utilizados após o período de 7 dias.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Limitação de Responsabilidade</h2>
              <p className="text-white/70 leading-relaxed">
                A Emprata AI não se responsabiliza por:
              </p>
              <ul className="list-disc list-inside text-white/70 space-y-2 ml-4 mt-3">
                <li>Danos diretos ou indiretos decorrentes do uso das imagens geradas</li>
                <li>Interrupções temporárias do serviço por manutenção ou falhas técnicas</li>
                <li>Perda de dados ou conteúdo gerado</li>
                <li>Resultados específicos ou qualidade das imagens geradas</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Suspensão e Encerramento</h2>
              <p className="text-white/70 leading-relaxed">
                Reservamo-nos o direito de suspender ou encerrar sua conta imediatamente, sem aviso prévio, em caso de violação destes Termos, uso fraudulento ou atividades ilegais.
              </p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Modificações nos Termos</h2>
              <p className="text-white/70 leading-relaxed">
                Podemos atualizar estes Termos de Uso periodicamente. Mudanças significativas serão comunicadas através do e-mail cadastrado. O uso continuado da plataforma após as alterações constitui aceitação dos novos termos.
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Lei Aplicável</h2>
              <p className="text-white/70 leading-relaxed">
                Estes Termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será resolvida no foro da comarca de São Paulo/SP.
              </p>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Contato</h2>
              <p className="text-white/70 leading-relaxed">
                Para dúvidas sobre estes Termos de Uso, entre em contato:
              </p>
              <div className="mt-3 text-white/70">
                <p><strong className="text-white">E-mail:</strong> contato@emprata.ai</p>
                <p><strong className="text-white">Suporte:</strong> suporte@emprata.ai</p>
              </div>
            </section>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
