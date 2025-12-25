import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPage() {
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
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white">Política de Privacidade</h1>
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
              <h2 className="text-2xl font-bold text-white mb-4">1. Introdução</h2>
              <p className="text-white/70 leading-relaxed">
                A <strong className="text-white">Emprata AI</strong> ("nós", "nosso" ou "nossa") respeita sua privacidade e está comprometida em proteger seus dados pessoais. Esta Política de Privacidade explica como coletamos, usamos e protegemos suas informações em conformidade com a <strong className="text-white">Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong>.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Dados Coletados</h2>
              <p className="text-white/70 leading-relaxed mb-3">
                Coletamos apenas os dados essenciais para o funcionamento do serviço:
              </p>
              <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
                <li><strong className="text-white">E-mail:</strong> Utilizado para autenticação via Firebase Authentication e comunicação sobre sua conta.</li>
                <li><strong className="text-white">Nome (opcional):</strong> Fornecido durante o cadastro para personalização da experiência.</li>
                <li><strong className="text-white">Dados de Uso:</strong> Informações sobre como você utiliza a plataforma (prompts, imagens geradas, créditos consumidos).</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Uso dos Dados</h2>
              <p className="text-white/70 leading-relaxed mb-3">
                Seus dados são utilizados exclusivamente para:
              </p>
              <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
                <li>Autenticar e gerenciar sua conta</li>
                <li>Processar solicitações de geração de imagens via IA</li>
                <li>Gerenciar créditos e planos de assinatura</li>
                <li>Melhorar nossos serviços e experiência do usuário</li>
                <li>Enviar notificações importantes sobre sua conta</li>
              </ul>
              <p className="text-white/70 leading-relaxed mt-3">
                <strong className="text-white">Importante:</strong> Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing.
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Armazenamento e Segurança</h2>
              <p className="text-white/70 leading-relaxed">
                Seus dados são armazenados de forma segura no <strong className="text-white">Firebase (Google Cloud Platform)</strong>, que utiliza criptografia em trânsito e em repouso. Implementamos medidas técnicas e organizacionais para proteger suas informações contra acesso não autorizado, perda ou destruição.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Seus Direitos (LGPD)</h2>
              <p className="text-white/70 leading-relaxed mb-3">
                Você tem os seguintes direitos sobre seus dados pessoais:
              </p>
              <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
                <li><strong className="text-white">Acesso:</strong> Solicitar uma cópia dos seus dados</li>
                <li><strong className="text-white">Correção:</strong> Atualizar dados incorretos ou incompletos</li>
                <li><strong className="text-white">Exclusão:</strong> Solicitar a remoção dos seus dados</li>
                <li><strong className="text-white">Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                <li><strong className="text-white">Revogação de Consentimento:</strong> Retirar seu consentimento a qualquer momento</li>
              </ul>
              <p className="text-white/70 leading-relaxed mt-3">
                Para exercer seus direitos, entre em contato conosco através do e-mail: <a href="mailto:contato@emprata.ai" className="text-primary hover:underline">contato@emprata.ai</a>
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Cookies e Tecnologias Similares</h2>
              <p className="text-white/70 leading-relaxed">
                Utilizamos cookies essenciais para autenticação e funcionamento da plataforma. Não utilizamos cookies de rastreamento ou publicidade de terceiros.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Alterações nesta Política</h2>
              <p className="text-white/70 leading-relaxed">
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas através do e-mail cadastrado ou por aviso na plataforma.
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Contato</h2>
              <p className="text-white/70 leading-relaxed">
                Para dúvidas sobre esta Política de Privacidade ou sobre o tratamento dos seus dados, entre em contato:
              </p>
              <div className="mt-3 text-white/70">
                <p><strong className="text-white">E-mail:</strong> contato@emprata.ai</p>
                <p><strong className="text-white">Encarregado de Dados (DPO):</strong> dpo@emprata.ai</p>
              </div>
            </section>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
