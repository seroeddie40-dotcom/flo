import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Info, FileText, ChevronUp, ChevronDown, CheckCircle, Scale, ExternalLink } from 'lucide-react';

import { FooterConfig, OnePagerConfig } from '../types';
import { reconstructChunkedString } from '../lib/firebase';

export default function LegalSection({ footer, onePager }: { footer?: FooterConfig; onePager?: OnePagerConfig }) {
  const currentEmail = footer?.email || 'florian@floriankusche.de';
  const currentPhone = footer?.phone || '+49 151 28897623';
  const currentLocation = footer?.location || 'Hannover, Deutschland';

  const [activeDrawer, setActiveDrawer] = useState<'impressum' | 'datenschutz' | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const toggleDrawer = (drawer: 'impressum' | 'datenschutz') => {
    setActiveDrawer(prev => (prev === drawer ? null : drawer));
  };

  const downloadFile = async (url: string | undefined, filename: string | undefined, fallbackDefault: string) => {
    if (!url) return;
    setIsDownloading(true);
    try {
      let activeUrl = url;
      // On-the-fly chunk reconstruction in case the background load hadn't completed or has stale cache
      if (activeUrl.startsWith('chunked://')) {
        try {
          activeUrl = await reconstructChunkedString(activeUrl);
        } catch (err) {
          console.error('Error reconstructing chunked file on-the-fly during download:', err);
        }
      }

      if (activeUrl.startsWith('data:')) {
        const parts = activeUrl.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
        // Stripping whitespace/newlines is critical for atob stability with large binary base64 documents
        const base64Clean = parts[1].replace(/\s/g, '');
        const bstr = atob(base64Clean);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        
        let targetFilename = fallbackDefault;
        if (filename) {
          const ext = filename.split('.').pop() || 'pdf';
          targetFilename = `${filename.split('.')[0]}.${ext}`;
        }
        link.download = targetFilename;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } else {
        const link = document.createElement('a');
        link.href = activeUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        let targetFilename = fallbackDefault;
        if (filename) {
          const ext = filename.split('.').pop() || 'pdf';
          targetFilename = `${filename.split('.')[0]}.${ext}`;
        }
        link.download = targetFilename;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Failed to download file:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadOnePager = () => {
    // If we have an active onepager document URL, use its URL and filename
    // Otherwise, if we have a footer PDF URL, use its URL and filename
    let urlToUse = '';
    let nameToUse = '';
    let defaultName = 'Leistungsübersicht.pdf';

    if (footer?.pdfUrl && footer.pdfUrl !== '') {
      urlToUse = footer.pdfUrl;
      nameToUse = footer.pdfFilename || '';
      defaultName = 'Leistungsübersicht.pdf';
    } else if (onePager?.documentUrl && onePager.documentUrl !== '') {
      urlToUse = onePager.documentUrl;
      nameToUse = onePager.documentFilename || '';
      defaultName = 'One-Pager.pdf';
    }

    if (urlToUse) {
      downloadFile(urlToUse, nameToUse, defaultName);
    } else {
      // Fallback content matching OnePagerMockup to ensure the button is always functional
      const ownerName = onePager?.ownerName || 'FLORIAN KUSCHE';
      const title = onePager?.title || 'INSTAGRAM ERFOLGS-FAHRPLAN';
      const description = onePager?.description || 'Der exakte Blueprint, mit dem ich deinen Account aufbaue und pflege, um konstante Sichtbarkeit und planbare Direktnachrichten-Leads zu erzeugen.';
      const steps = onePager?.steps && onePager.steps.length > 0 ? onePager.steps : [
        { label: '1. HOOK PSYCHOLOGIE', percentage: 85 },
        { label: '2. VERKAUFSSTARKE CAROUSELS', percentage: 70 },
        { label: '3. STORY-DIRECT-CTA', percentage: 92 },
      ];
      const calloutText = onePager?.calloutText || 'Erzielt im Schnitt +240% Engagement-Wachstum.';

      let content = `${ownerName.toUpperCase()} - ${title.toUpperCase()}\n`;
      content += `========================================================\n\n`;
      content += `BESCHREIBUNG:\n${description}\n\n`;
      content += `SCHLÜSSEL-STRATEGIEN:\n`;
      steps.forEach((step, idx) => {
        content += `${idx + 1}. ${step.label} (${step.percentage}% Fokus)\n`;
      });
      content += `\nFOKUS-ERGEBNIS:\n- ${calloutText}\n\n`;
      content += `--------------------------------------------------------\n`;
      content += `Direkt generiert auf dem Client-Portal.`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = onePager?.documentFilename || 'Florian_Kusche_Instagram_Strategie_OnePager.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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
          <button
            onClick={handleDownloadOnePager}
            disabled={isDownloading}
            className={`py-2 px-4 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer bg-accent hover:bg-accent/90 hover:scale-105 active:scale-95 text-black font-extrabold border border-accent ${
              isDownloading ? 'opacity-80 cursor-not-allowed' : 'animate-pulse'
            }`}
            id="btn-onepager-footer-download"
          >
            {isDownloading ? (
              <span className="inline-block w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>{isDownloading ? 'Ladevorgang...' : 'Leistungsübersicht als PDF'}</span>
          </button>

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
