/**
 * UserDropdown Component
 * Header dropdown menu for user profile, admin, and logout
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, ChevronDown, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface UserDropdownProps {}

export function UserDropdown({}: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, userData, signOut } = useAuth();
  const navigate = useNavigate();



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfile = () => {
    navigate('/profile');
    setIsOpen(false);
  };



  const handleLogout = async () => {
    await signOut();
    navigate('/');
    setIsOpen(false);
  };

  const getInitial = () => {
    if (userData?.name) return userData.name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-sm font-black">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span>{getInitial()}</span>
          )}
        </div>

        {/* Name (Desktop only) */}
        <span className="hidden md:block text-sm font-bold text-white/80 max-w-[120px] truncate">
          {userData?.name || 'Usuário'}
        </span>

        {/* Chevron */}
        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/5">
              <p className="text-sm font-bold text-white truncate">{userData?.name || 'Usuário'}</p>
              <p className="text-xs text-white/40 font-medium truncate">{user?.email}</p>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {/* My Profile */}
              <button
                onClick={handleProfile}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
              >
                <User className="w-4 h-4 text-white/60" />
                <span className="text-sm font-bold text-white">Meu Perfil</span>
              </button>



              {/* Switch to Customer Mode */}
              <button
                onClick={() => {
                   localStorage.setItem('activeRole', 'CUSTOMER');
                   window.location.href = '/delivery';
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
              >
                <Store className="w-4 h-4 text-primary" />
                <div>
                  <span className="text-sm font-bold text-white block">Modo Cliente</span>
                  <span className="text-[10px] text-white/40 block">Fazer pedidos</span>
                </div>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-500/10 transition-colors text-left border-t border-white/5"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span className="text-sm font-bold text-red-400">Sair</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
