import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';

// Force new Git commit to trigger Vercel redeployment
interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  thirdPartyAllowed: boolean;
  calendlyConfig?: {
    calendlyUrl?: string;
    calendlyToken?: string;
    isConnected?: boolean;
    connectedEmail?: string;
    bookings?: any[];
  };
}

export default function CalendlyModal({ isOpen, onClose, thirdPartyAllowed, calendlyConfig }: BookingModalProps) {
  const [iframeLoading, setIframeLoading] = useState(true);
  const [localConsent, setLocalConsent] = useState(false);

  // Sync local consent state when thirdPartyAllowed prop changes
  useEffect(() => {
    if (thirdPartyAllowed) {
      setLocalConsent(true);
    }
  }, [thirdPartyAllowed]);

  if (!isOpen) return null;

  const rawUrl = calendlyConfig?.calendlyUrl || 'https://calendly.com/floriankusche';
  
  // Format the Calendly URL to look gorgeous as a dark theme embedded widget
  const getEmbeddedUrl = (url: string) => {
    if (!url) return '';
    let embedUrl = url.trim();
    if (!embedUrl.startsWith('http://') && !embedUrl.startsWith('https://')) {
      embedUrl = `https://${embedUrl}`;
    }
    
    // Add query params for styled Calendly embed (dark mode colors to match the brand)
    const separator = embedUrl.includes('?') ? '&' : '?';
    return `${embedUrl}${separator}hide_landing_page_details=1&hide_gdpr_banner=1&background_color=002d47&text_color=ffffff&primary_color=ffcc00`;
  };

  const finalEmbedUrl = getEmbeddedUrl(rawUrl);
  const isAllowed = thirdPartyAllowed || localConsent;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#002d47]/85 backdrop-blur-md"
          id="booking-backdrop"
        />

        {/* Modal Pane */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-5xl bg-brand-darker border border-[#014e7a]/50 text-[#cce9ff] shadow-2xl rounded-2xl overflow-hidden z-10 flex flex-col md:flex-row h-[90vh] md:h-[80vh] min-h-[500px]"
          id="booking-modal-content"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#cce9ff]/70 hover:text-white p-2 hover:bg-[#014e7a]/50 rounded-full transition-all cursor-pointer z-30"
            id="close-booking-modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Column: Context/Onboarding info */}
          <div className="w-full md:w-1/3 bg-brand-dark border-b md:border-b-0 md:border-r border-[#014e7a]/30 p-5 md:p-6 flex flex-col justify-between shrink-0">
            <div className="space-y-4">
              <div className="inline-block py-1 px-3 bg-[#014e7a] text-[#d6c3a3] text-[10px] font-mono tracking-widest uppercase rounded">
                CALENDLY ASSISTANT
              </div>
              
              <h3 className="font-display text-xl md:text-2xl font-black text-white tracking-tight uppercase">
                FLORIAN KUSCHE
              </h3>
              <p className="font-mono text-[10px] text-[#d6c3a3] tracking-widest uppercase -mt-2">
                INSTAGRAM MARKETING & CONTENT
              </p>

              <div className="h-[1px] bg-[#014e7a]/40 my-4"></div>

              <h4 className="font-display font-bold text-lg text-[#ffcc00]">
                Kostenloses Erstgespräch
              </h4>
              <p className="text-xs md:text-sm text-[#cce9ff]/90 leading-relaxed">
                Wähle rechts deinen Wunschtermin im Live-Kalender aus. Alle verfügbaren Tage und freien Uhrzeiten sind in Echtzeit synchronisiert.
              </p>

              <div className="flex flex-col gap-2 pt-2 text-xs text-[#cce9ff]/80">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent shrink-0" />
                  <span>30 Minuten Beratung</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent shrink-0" />
                  <span>Telefon oder Zoom-Call (Live)</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#014e7a]/20 text-xs text-[#cce9ff]/65">
              <span>Probleme mit der Anzeige?</span>
              <br />
              <a
                href={rawUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline font-semibold hover:text-[#ebd500] inline-flex items-center gap-1 mt-1"
              >
                <span>Direkt bei Calendly buchen</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Right Column: Embedded Calendly Iframe or Consent Prompt */}
          <div className="w-full md:w-2/3 bg-[#002d47] relative flex-1 flex flex-col min-h-0">
            {isAllowed ? (
              <div className="w-full h-full relative flex-1">
                {iframeLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#002d47] z-20">
                    <RefreshCw className="w-8 h-8 text-accent animate-spin mb-3" />
                    <p className="text-xs font-mono text-[#d6c3a3] tracking-widest uppercase">
                      Lade Calendly Kalender...
                    </p>
                  </div>
                )}
                
                <iframe
                  src={finalEmbedUrl}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  onLoad={() => setIframeLoading(false)}
                  className="w-full h-full border-0 rounded-b-2xl md:rounded-r-2xl md:rounded-b-none"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                  id="calendly-iframe"
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-5 max-w-md mx-auto">
                <div className="p-4 bg-accent/10 text-accent rounded-full">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                    Calendly-Verbindung aktivieren
                  </h4>
                  <p className="text-xs text-[#cce9ff]/85 leading-relaxed">
                    Um freie Uhrzeiten und Tage direkt hier anzuzeigen und direkt deinen Beratungstermin zu buchen, aktiviere bitte die externe Calendly-Verbindung.
                  </p>
                </div>

                <div className="flex flex-col gap-2 w-full pt-2">
                  <button
                    onClick={() => setLocalConsent(true)}
                    className="w-full py-3 px-5 bg-accent hover:bg-[#ebd500] text-black rounded-xl font-display text-xs tracking-widest font-black uppercase transition-all shadow-lg active:scale-98 cursor-pointer"
                  >
                    Dienste aktivieren & Kalender laden
                  </button>
                  
                  <a
                    href={rawUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-5 bg-transparent border border-[#014e7a]/60 hover:bg-[#014e7a]/25 text-[#cce9ff] rounded-xl font-display text-[10px] tracking-widest font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>In neuem Tab öffnen</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
