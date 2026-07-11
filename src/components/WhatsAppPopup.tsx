import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Send, X, Check } from 'lucide-react';

interface WhatsAppPopupProps {
  phone?: string;
  avatarUrl?: string;
}

export default function WhatsAppPopup({ phone, avatarUrl }: WhatsAppPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const rawPhone = phone || '+49 151 28897623';
  
  // Format phone number for wa.me link
  const getCleanPhone = () => {
    let clean = rawPhone.replace(/[^0-9]/g, '');
    if (clean.startsWith('00')) {
      clean = clean.substring(2);
    }
    // Convert local German format (0151...) to international (49151...)
    if (clean.startsWith('0') && !rawPhone.startsWith('+')) {
      clean = '49' + clean.substring(1);
    }
    // Default country prefix if missing
    if (!clean.startsWith('49') && clean.length <= 11) {
      clean = '49' + clean;
    }
    return clean;
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const formattedPhone = getCleanPhone();
    const encodedText = encodeURIComponent(message.trim());
    const waLink = `https://wa.me/${formattedPhone}?text=${encodedText}`;

    // Open WhatsApp in a new tab
    window.open(waLink, '_blank', 'noopener,noreferrer');

    // Show success checkmark in the UI
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      setMessage('');
      setIsOpen(false);
    }, 2000);
  };

  // Close when clicking outside of the popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={popupRef} className="fixed bottom-6 right-6 z-45 font-sans select-none flex flex-col items-end" id="whatsapp-floating-widget">
      {/* Expanded Conversation Popup Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="mb-4 w-[330px] sm:w-[360px] bg-brand-darker border border-emerald-500/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 mr-0"
            id="whatsapp-chat-panel"
          >
            {/* Header: WhatsApp Brand Header */}
            <div className="bg-[#128C7E] p-4 text-white flex items-center justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/30 to-transparent pointer-events-none"></div>
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="relative">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Florian Kusche" 
                      className="w-10 h-10 rounded-full object-cover border border-white/20"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-900/40 flex items-center justify-center font-display font-black text-xs text-emerald-300 border border-emerald-400/30">
                      FK
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#128C7E] rounded-full"></span>
                </div>
                <div>
                  <h4 className="text-sm font-bold font-display tracking-wide uppercase leading-tight">Florian Kusche</h4>
                  <span className="text-[10px] text-emerald-100 flex items-center gap-1 font-medium">
                    <span className="w-1 h-1 rounded-full bg-emerald-300 animate-pulse"></span>
                    Online • Antwortet meistens sofort
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors cursor-pointer"
                aria-label="Schließen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conversation Area & Input Form */}
            <div className="p-4 bg-[#0d1e2d] relative space-y-4">
              {/* Background abstract doodle overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(var(--color-brand-dark-card)_1px,transparent_1px),linear-gradient(90deg,var(--color-brand-dark-card)_1px,transparent_1px)] bg-[size:24px_24px] opacity-5 pointer-events-none"></div>

              {/* Chat bubble placeholder */}
              <div className="bg-[#1f374c] text-zinc-100 text-xs p-3.5 rounded-2xl rounded-tl-none max-w-[85%] border border-[#014e7a]/20 shadow-sm leading-relaxed relative z-10">
                Hallo! 👋 Wie kann ich dir bei deinem Instagram-Auftritt helfen? Schreib mir deine Frage einfach hier rein!
              </div>

              {/* Form containing message input and action button */}
              <form onSubmit={handleSend} className="space-y-3 relative z-10">
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Deine Frage an Florian..."
                  className="w-full bg-[#002d47] border border-[#014e7a]/40 focus:border-emerald-500/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 resize-none transition-all leading-normal"
                />

                <button
                  type="submit"
                  disabled={isSent || !message.trim()}
                  className="w-full py-3 bg-[#25D366] hover:bg-[#20ba59] disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSent ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Weiterleitung zu WhatsApp...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Frage senden</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button (Pill Badge with explicit "WhatsApp" text) */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2.5 px-5 py-3 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-full shadow-[0_8px_30px_rgb(37,211,102,0.3)] hover:shadow-[0_8px_30px_rgb(37,211,102,0.5)] border border-emerald-400/20 font-display font-black tracking-widest uppercase text-xs transition-all duration-300 cursor-pointer"
        id="whatsapp-trigger-btn"
      >
        <div className="relative flex items-center justify-center">
          <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border border-white rounded-full animate-pulse"></span>
        </div>
        <span>WHATSAPP</span>
      </motion.button>
    </div>
  );
}
