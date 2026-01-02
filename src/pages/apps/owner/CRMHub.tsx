/**
 * 📊 CRM Hub - Central de Relacionamento com Cliente
 * 
 * Main page that combines:
 * - Lead Manager (import, sync)
 * - Campaign access
 * - Quick stats
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, Calendar, Send, Database, ArrowRight, 
  TrendingUp, MessageCircle, Target
} from 'lucide-react';
import LeadManager from '../../../components/marketing/LeadManager';

export default function CRMHub() {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Marketing WhatsApp',
      description: 'Disparos com IA',
      icon: <MessageCircle size={24} />,
      path: '/whatsapp',
      color: 'bg-green-500'
    },
    {
      title: 'Réguas de Contato',
      description: 'Sequências automatizadas',
      icon: <Calendar size={24} />,
      path: '/campaigns',
      color: 'bg-purple-500'
    },
    {
      title: 'Minha Vitrine',
      description: 'Configurar cardápio',
      icon: <Target size={24} />,
      path: '/store-settings',
      color: 'bg-blue-500'
    }
  ];

  return (
    <div className="min-h-screen pb-20 space-y-8 animate-in fade-in">
      
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
            <Database size={24} className="text-white" />
          </div>
          Central CRM
        </h1>
        <p className="text-white/50 mt-1">Gestão de audiência e campanhas de retenção.</p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* QUICK ACTIONS */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid md:grid-cols-3 gap-4">
        {quickActions.map((action, i) => (
          <motion.button
            key={action.path}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => navigate(action.path)}
            className="bg-[#121212] p-6 rounded-2xl border border-white/5 text-left hover:border-white/20 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 ${action.color} rounded-xl text-white mb-4`}>
                {action.icon}
              </div>
              <ArrowRight className="text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all" size={20} />
            </div>
            <h3 className="font-bold text-white">{action.title}</h3>
            <p className="text-sm text-white/40 mt-1">{action.description}</p>
          </motion.button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* LEAD MANAGER */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <LeadManager />
    </div>
  );
}
