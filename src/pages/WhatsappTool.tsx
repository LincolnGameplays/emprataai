/**
 * ⚡ EMPRATA ZAP - WhatsApp Automation Tool ⚡
 * Frontend UI for WhatsApp automation (Evolution API ready)
 * 
 * Features:
 * - QR Code connection status
 * - Manual message dispatch
 * - Campaign templates (future)
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, MessageCircle, QrCode, 
  Send, RefreshCw, Wifi, WifiOff,
  User, Phone, FileText
} from 'lucide-react';
import { IMaskInput } from 'react-imask';
import { toast } from 'sonner';

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function WhatsappTool() {
  // Connection State (Mock for now)
  const [isConnected, setIsConnected] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  // Message State
  const [activeTab, setActiveTab] = useState<'manual' | 'campaigns'>('manual');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Mock QR Code generation
  const handleGenerateQR = () => {
    setIsGeneratingQR(true);
    // Simulate QR generation
    setTimeout(() => {
      setIsGeneratingQR(false);
      toast.success('QR Code gerado! Escaneie com WhatsApp.');
    }, 2000);
  };

  // Mock send message
  const handleSendMessage = () => {
    if (!phone || !message.trim()) {
      toast.error('Preencha telefone e mensagem!');
      return;
    }

    if (!isConnected) {
      toast.error('Conecte seu WhatsApp primeiro!');
      return;
    }

    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      toast.success('Mensagem enviada!');
      setMessage('');
    }, 1500);
  };

  // Insert variable into message
  const insertVariable = (variable: string) => {
    setMessage(prev => prev + `{${variable}}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/tools" className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-black text-lg">Emprata Zap</h1>
                <p className="text-xs text-white/40">Automação de WhatsApp</p>
              </div>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-bold">
            Beta
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* ════════════════════════════════════════════════════════════ */}
          {/* LEFT COLUMN: CONNECTION */}
          {/* ════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-6"
          >
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-white/40" />
              Conexão WhatsApp
            </h2>

            {/* Status Badge */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className={`font-bold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? 'Online' : 'Desconectado'}
              </span>
              {isConnected ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
            </div>

            {/* QR Code Area */}
            <div className="aspect-square max-w-[280px] mx-auto mb-6 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center overflow-hidden">
              {isGeneratingQR ? (
                <div className="flex flex-col items-center gap-4">
                  <RefreshCw className="w-8 h-8 text-green-400 animate-spin" />
                  <p className="text-sm text-white/40">Gerando QR Code...</p>
                </div>
              ) : isConnected ? (
                <div className="flex flex-col items-center gap-4 text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Wifi className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-sm text-white/60">WhatsApp conectado e pronto para enviar mensagens.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center p-6">
                  {/* Placeholder QR Pattern */}
                  <div className="grid grid-cols-5 gap-1">
                    {[...Array(25)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-4 h-4 rounded-sm ${Math.random() > 0.5 ? 'bg-white/20' : 'bg-white/5'}`} 
                      />
                    ))}
                  </div>
                  <p className="text-xs text-white/40 mt-4">
                    Clique em "Gerar QR Code" e escaneie com seu WhatsApp
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {!isConnected ? (
                <button
                  onClick={handleGenerateQR}
                  disabled={isGeneratingQR}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 font-bold flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all"
                >
                  <QrCode className="w-5 h-5" />
                  {isGeneratingQR ? 'Gerando...' : 'Gerar Novo QR Code'}
                </button>
              ) : (
                <button
                  onClick={() => setIsConnected(false)}
                  className="w-full py-3 rounded-xl bg-red-500/20 text-red-400 font-bold hover:bg-red-500/30 transition-all"
                >
                  Desconectar
                </button>
              )}

              {/* Dev toggle for testing */}
              <button
                onClick={() => setIsConnected(!isConnected)}
                className="w-full py-2 text-xs text-white/30 hover:text-white/50 transition-colors"
              >
                [Dev] Toggle Connection
              </button>
            </div>
          </motion.div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* RIGHT COLUMN: DISPATCHER */}
          {/* ════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-6"
          >
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'manual' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                Disparo Manual
              </button>
              <button
                onClick={() => setActiveTab('campaigns')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'campaigns' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                Campanhas
              </button>
            </div>

            {activeTab === 'manual' ? (
              <div className="space-y-5">
                {/* Phone Input */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold mb-2 text-white/60">
                    <Phone className="w-4 h-4" /> Telefone
                  </label>
                  <IMaskInput
                    mask="+55 (00) 00000-0000"
                    value={phone}
                    unmask={false}
                    onAccept={(value: string) => setPhone(value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 focus:border-green-500 focus:outline-none"
                    placeholder="+55 (11) 99999-9999"
                  />
                </div>

                {/* Message Input */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold mb-2 text-white/60">
                    <FileText className="w-4 h-4" /> Mensagem
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Digite sua mensagem aqui...

Use variáveis como {nome_cliente} para personalizar."
                    className="w-full h-32 bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 focus:border-green-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Quick Variables */}
                <div>
                  <p className="text-xs text-white/40 mb-2">Variáveis rápidas:</p>
                  <div className="flex flex-wrap gap-2">
                    {['nome_cliente', 'pedido', 'valor'].map((variable) => (
                      <button
                        key={variable}
                        onClick={() => insertVariable(variable)}
                        className="px-3 py-1 rounded-lg bg-white/5 text-xs font-mono text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        {`{${variable}}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={isSending || !isConnected}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 font-bold text-lg flex items-center justify-center gap-3 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Enviar Agora
                    </>
                  )}
                </button>

                {!isConnected && (
                  <p className="text-center text-xs text-red-400">
                    ⚠️ Conecte seu WhatsApp primeiro para enviar mensagens.
                  </p>
                )}
              </div>
            ) : (
              /* Campaigns Tab - Coming Soon */
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-white/20" />
                </div>
                <h3 className="text-lg font-bold text-white/60 mb-2">Em Breve</h3>
                <p className="text-sm text-white/40 max-w-xs">
                  Crie campanhas automatizadas com templates, listas de contatos e agendamento.
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-center"
        >
          <p className="text-sm text-green-400">
            🔒 <strong>Seguro:</strong> Usamos a Evolution API oficial. Suas mensagens são criptografadas de ponta a ponta.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
