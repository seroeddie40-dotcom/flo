import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Settings, Check, X } from 'lucide-react';

interface CookieSettings {
  necessary: boolean;
  thirdParty: boolean; // Instagram, Calendly
}

export default function CookieBanner({
  onAcceptThirdParty,
}: {
  onAcceptThirdParty: (accepted: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [settings, setSettings] = useState<CookieSettings>({
    necessary: true,
    thirdParty: true,
  });

  useEffect(() => {
    const savedConsent = localStorage.getItem('fk_cookie_consent');
    if (!savedConsent) {
      setIsOpen(true);
    } else {
      try {
        const parsed = JSON.parse(savedConsent) as CookieSettings;
        setSettings(parsed);
        // Important: this relies on the parent's handler
        onAcceptThirdParty(parsed.thirdParty);
      } catch {
        setIsOpen(true);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = { necessary: true, thirdParty: true };
    localStorage.setItem('fk_cookie_consent', JSON.stringify(allAccepted));
    setSettings(allAccepted);
    onAcceptThirdParty(true);
    setIsOpen(false);
  };

  const handleSaveSelection = () => {
    localStorage.setItem('fk_cookie_consent', JSON.stringify(settings));
    onAcceptThirdParty(settings.thirdParty);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-x-0 bottom-0 z-50 p-4 md:p-6 bg-transparent pointer-events-none flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="pointer-events-auto w-full max-w-2xl bg-brand-darker border border-[#014e7a]/80 text-[#cce9ff] shadow-2xl rounded-2xl p-6 relative overflow-hidden backdrop-blur-md"
          id="cookie-banner-container"
        >
          {/* Subtle gold decoration bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-accent"></div>

          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#014e7a] rounded-xl text-accent shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-bold tracking-wide uppercase text-white">
                  Cookie-Bestimmungen & Drittanbieter
                </h3>
                <p className="text-sm mt-1 text-[#cce9ff]/90 leading-relaxed">
                  Um dir das beste Erlebnis zu bieten (z. B. das Abspielen unserer echten Instagram Reels und die direkte Terminbuchung über Calendly), nutzen wir optionale Drittanbieter-Services.
                </p>
              </div>
            </div>

            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-[#014e7a] pt-4 flex flex-col gap-3"
              >
                <div className="flex justify-between items-start gap-4 bg-brand-dark-card/50 p-3 rounded-lg border border-[#014e7a]/30">
                  <div>
                    <span className="font-display text-sm font-semibold text-white block">Technisch Notwendig</span>
                    <span className="text-xs text-[#cce9ff]/70">Erforderlich für den grundlegenden Betrieb der Landing Page. Keine Erfassung personenbezogener Daten.</span>
                  </div>
                  <div className="p-1 px-2.5 bg-[#014e7a] text-[#cce9ff] text-xs font-mono rounded font-medium select-none">
                    IMMER AKTIV
                  </div>
                </div>

                <div className="flex justify-between items-start gap-4 bg-brand-dark-card/50 p-3 rounded-lg border border-[#014e7a]/30">
                  <div>
                    <span className="font-display text-sm font-semibold text-white block">Drittanbieter (Instagram & Calendly)</span>
                    <span className="text-xs text-[#cce9ff]/70">Ermöglicht das Laden von Instagram-REELS und die interaktive Calendly-Terminauswahl direkt in der Seite.</span>
                  </div>
                  <button
                    onClick={() => setSettings(s => ({ ...s, thirdParty: !s.thirdParty }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.thirdParty ? 'bg-[#ffcc00]' : 'bg-[#014e7a]'
                    }`}
                    id="toggle-thirdparty-cookie"
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-brand-dark shadow ring-0 transition duration-200 ease-in-out ${
                        settings.thirdParty ? 'translate-x-5 bg-black' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </motion.div>
            )}

            <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2 mt-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-[#d6c3a3] hover:text-[#ffcc00] text-sm py-2 px-3 tracking-wider uppercase font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                id="cookie-btn-settings"
              >
                <Settings className="w-4 h-4" />
                {showDetails ? 'Auswahl ausblenden' : 'Einstellungen'}
              </button>
              
              {showDetails ? (
                <button
                  onClick={handleSaveSelection}
                  className="bg-[#014e7a] hover:bg-[#014e7a]/80 text-[#cce9ff] text-xs py-2.5 px-5 tracking-wider uppercase font-semibold rounded-xl border border-[#014e7a] transition-all cursor-pointer text-center"
                  id="cookie-btn-save"
                >
                  Auswahl speichern
                </button>
              ) : null}

              <button
                onClick={handleAcceptAll}
                className="bg-[#ffcc00] hover:bg-[#ebd500] text-black text-xs py-2.5 px-6 tracking-widest uppercase font-black rounded-xl transition-all shadow-md cursor-pointer text-center flex items-center justify-center gap-1.5"
                id="cookie-btn-accept-all"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                Alle Akzeptieren
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
