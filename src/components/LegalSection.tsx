import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Info, FileText, ChevronUp, ChevronDown, CheckCircle, Scale, ExternalLink } from 'lucide-react';

import { FooterConfig } from '../types';

export default function LegalSection({ footer }: { footer?: FooterConfig }) {
  const currentEmail = footer?.email || 'florian@floriankusche.de';
  const currentPhone = footer?.phone || '+49 151 28897623';
  const currentLocation = footer?.location || 'Hannover, Deutschland';

  const [activeDrawer, setActiveDrawer] = useState<'impressum' | 'datenschutz' | null>(null);

  const toggleDrawer = (drawer: 'impressum' | 'datenschutz') => {
    setActiveDrawer(prev => (prev === drawer ? null : drawer));
  };

  const handleDownloadPdf = () => {
    if (!footer?.pdfUrl) return;
    try {
      if (footer.pdfUrl.startsWith('data:')) {
        const parts = footer.pdfUrl.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        
        let filename = 'Leistungsübersicht.pdf';
        if (footer.pdfFilename) {
          const ext = footer.pdfFilename.split('.').pop() || 'pdf';
          filename = `Leistungsübersicht.${ext}`;
        }
        link.download = filename;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const link = document.createElement('a');
        link.href = footer.pdfUrl;
        
        let filename = 'Leistungsübersicht.pdf';
        if (footer.pdfFilename) {
          const ext = footer.pdfFilename.split('.').pop() || 'pdf';
          filename = `Leistungsübersicht.${ext}`;
        }
        link.download = filename;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Failed to download PDF:', err);
    }
  };

  return (
    <footer className="bg-brand-darker border-t border-[#014e7a]/30 text-[#cce9ff]/80 py-12 px-4 sm:px-6 relative z-20">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-[#014e7a]/20">
        
        {/* Left Side: Brand Name text-logo with wide tracking */}
        <div className="text-center md:text-left">
          <span className="font-display font-black text-lg tracking-[0.25em] text-white uppercase block">
            FLORIAN KUSCHE
          </span>
          <span className="font-mono text-[9px] tracking-[0.2em] text-[#d6c3a3] uppercase block mt-1">
            Instagram Management & Content
          </span>
        </div>

        {/* Right Side: Interactive Legal Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono tracking-widest uppercase">
          {footer?.pdfUrl && (
            <button
              onClick={handleDownloadPdf}
              className="py-2 px-4 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer bg-brand-dark border border-accent/40 hover:border-accent text-accent hover:text-white font-bold"
              id="btn-pdf-download"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Leistungsübersicht als PDF</span>
            </button>
          )}

          <button
            onClick={() => toggleDrawer('impressum')}
            className={`py-2 px-4 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeDrawer === 'impressum'
                ? 'bg-accent text-black font-bold'
                : 'bg-brand-dark border border-[#014e7a]/30 hover:border-[#ffcc00]/50 text-[#cce9ff]'
            }`}
            id="btn-impressum-toggle"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Impressum</span>
            {activeDrawer === 'impressum' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => toggleDrawer('datenschutz')}
            className={`py-2 px-4 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeDrawer === 'datenschutz'
                ? 'bg-accent text-black font-bold'
                : 'bg-brand-dark border border-[#014e7a]/30 hover:border-[#ffcc00]/50 text-[#cce9ff]'
            }`}
            id="btn-datenschutz-toggle"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Datenschutz</span>
            {activeDrawer === 'datenschutz' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Accordion Panels Drawer */}
      <AnimatePresence mode="wait">
        {activeDrawer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="max-w-6xl mx-auto overflow-hidden bg-brand-dark/40 border-b border-x border-[#014e7a]/30 rounded-b-2xl p-6 md:p-8"
            id="legal-slide-panel"
          >
            {activeDrawer === 'impressum' && (
              footer?.imprintText ? (
                <div className="text-sm text-[#cce9ff]/90 whitespace-pre-wrap leading-relaxed space-y-2" id="legal-content-impressum-custom">
                  {footer.imprintText}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm" id="legal-content-impressum">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#014e7a]/20">
                      <Info className="w-4 h-4 text-accent" />
                      <h3 className="font-display font-bold uppercase tracking-wider text-white">Angaben gemäß § 5 TMG</h3>
                    </div>
                    <div className="space-y-1 text-[#cce9ff]/90">
                      <p className="font-bold text-white">Florian Kusche</p>
                      <p>Instagram Management & Content Creation</p>
                      <p>{currentLocation}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#014e7a]/20">
                      <Info className="w-4 h-4 text-accent" />
                      <h3 className="font-display font-bold uppercase tracking-wider text-white">Kontakt & Support</h3>
                    </div>
                    <div className="space-y-1.5 text-[#cce9ff]/90">
                      <p>
                        <span className="font-mono text-xs text-[#d6c3a3]">E-Mail:</span>{' '}
                        <a href={`mailto:${currentEmail}`} className="underline text-accent">{currentEmail}</a>
                      </p>
                      <p>
                        <span className="font-mono text-xs text-[#d6c3a3]">Telefon / WhatsApp:</span>{' '}
                        <a href={`tel:${currentPhone}`} className="underline text-[#cce9ff]">{currentPhone}</a>
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}

            {activeDrawer === 'datenschutz' && (
              footer?.privacyText ? (
                <div className="text-sm text-[#cce9ff]/90 whitespace-pre-wrap leading-relaxed space-y-2" id="legal-content-datenschutz-custom">
                  {footer.privacyText}
                </div>
              ) : (
                <div className="space-y-6 text-sm" id="legal-content-datenschutz">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#014e7a]/20">
                    <ShieldCheck className="w-4 h-4 text-accent" />
                    <h3 className="font-display font-bold uppercase tracking-wider text-white">Datenschutzerklärung (Zusammenfassung)</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed text-[#cce9ff]/85">
                    <div className="space-y-2 bg-brand-dark border border-[#014e7a]/20 p-4 rounded-xl">
                      <h4 className="font-bold text-white font-display uppercase tracking-wider text-xs">1. Webhosting</h4>
                      <p>
                        Unsere Landing Page wird bei der <strong className="text-white">Strato AG</strong> gehostet. Strato erfasst serverseitige Logfiles (IP-Adresse, Datum, Uhrzeit), um den sicheren Betrieb der Systeme zu garantieren.
                      </p>
                      <a
                        href="https://www.strato.de/datenschutz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent underline inline-flex items-center gap-1 hover:text-[#ebd500] font-semibold mt-1"
                      >
                        Strato Datenschutz <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="space-y-2 bg-brand-dark border border-[#014e7a]/20 p-4 rounded-xl">
                      <h4 className="font-bold text-white font-display uppercase tracking-wider text-xs">2. Cookies & Tracker</h4>
                      <p>
                        Wir setzen technisch notwendige Session-Cookies ein, die für das reibungslose Funktionieren der Website sorgen.
                      </p>
                      <p className="mt-1">
                        Drittanbieter-Erweiterungen (Instagram-Medien, Calendly Scheduling) laden erst nach deiner ausdrücklichen Einwilligung im Cookie-Banner.
                      </p>
                    </div>

                    <div className="space-y-2 bg-brand-dark border border-[#014e7a]/20 p-4 rounded-xl">
                      <h4 className="font-bold text-white font-display uppercase tracking-wider text-xs">3. Betroffenenrechte</h4>
                      <p>
                        Du hast jederzeit das Recht auf unentgeltliche Auskunft über deine gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger sowie das Recht auf Berichtigung, Sperrung oder Löschung dieser Daten.
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 text-xs text-[#cce9ff]/50 font-mono">
        <span>© {new Date().getFullYear()} Florian Kusche. Alle Rechte vorbehalten.</span>
        <span className="flex items-center gap-1.5">
          <span>Gehostet bei Strato</span>
          <span className="w-1 h-1 rounded-full bg-accent"></span>
          <span>Made in Hannover</span>
        </span>
      </div>
    </footer>
  );
}
