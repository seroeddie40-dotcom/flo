import { motion } from 'motion/react';
import { AboutSectionConfig } from '../types';
import { User, ShieldCheck, HeartHandshake } from 'lucide-react';

interface AboutSectionProps {
  about?: AboutSectionConfig;
  defaultPortraitUrl?: string;
}

export default function AboutSection({ about, defaultPortraitUrl }: AboutSectionProps) {
  // Use config values or fallbacks
  const isEnabled = about?.enabled !== false; // default to true
  const eyebrow = about?.eyebrow || 'WER STECKT DAHINTER';
  const title = about?.title || 'Seit 2004 im Vertrieb. Seit 2017 selbstständig.';
  const text = about?.text || 'Seit 2004 im Vertrieb, seit 2017 selbstständig. Ich kenne beide Seiten: was Kunden wirklich überzeugt, und wie man das sichtbar macht. Deshalb arbeite ich ausschließlich mit Instagram, dafür richtig. Mein Tool-Stack: Canva Business, CapCut, Google Drive und Trello für die Organisation, dazu KI-gestützte Tools für Recherche und Konzeption.';
  
  const imageUrl = about?.imageUrl || defaultPortraitUrl || '';
  const isImageEnabled = about?.imageEnabled !== false && !!imageUrl;

  if (!isEnabled) return null;

  return (
    <section id="ueber-mich" className="py-20 md:py-28 bg-[#002d47] relative overflow-hidden px-4 sm:px-6">
      {/* Background visual accents */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-accent/5 rounded-full filter blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#014e7a]/15 rounded-full filter blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Portrait Image (if enabled & present) */}
          {isImageEnabled && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5 flex justify-center"
            >
              <div className="relative group">
                {/* Decorative background plate */}
                <div className="absolute -inset-2 bg-gradient-to-r from-accent to-[#014e7a]/40 rounded-2xl opacity-30 blur-lg group-hover:opacity-40 transition-all"></div>
                
                <img 
                  src={imageUrl} 
                  alt="Portrait Florian Kusche" 
                  className="relative object-cover w-72 h-96 sm:w-80 sm:h-[420px] rounded-2xl border border-[#014e7a]/30 shadow-2xl filter brightness-95 contrast-105"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>
          )}

          {/* Text/Content Area */}
          <div className={`${isImageEnabled ? 'lg:col-span-7' : 'lg:col-span-10 lg:col-start-2 text-center'} space-y-6`}>
            <span className={`text-xs font-mono text-[#d6c3a3] tracking-[0.25em] uppercase block ${!isImageEnabled && 'mx-auto'}`}>
              {eyebrow}
            </span>

            <h2 className={`font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-tight leading-tight ${!isImageEnabled && 'max-w-3xl mx-auto'}`}>
              {(() => {
                const parts = title.split(/\[(.*?)\]/g);
                return parts.map((part, index) => {
                  if (index % 2 === 1) {
                    return <span key={index} className="text-accent">{part}</span>;
                  }
                  return part.split('\n').map((line, lIdx) => (
                    <span key={`${index}-${lIdx}`}>
                      {line}
                      {lIdx < part.split('\n').length - 1 && <br className="hidden md:inline" />}
                    </span>
                  ));
                });
              })()}
            </h2>

            <div className={`text-[#cce9ff]/90 text-sm sm:text-base leading-relaxed space-y-4 max-w-2xl ${!isImageEnabled && 'mx-auto text-center'}`}>
              <p className="font-sans font-light">
                {text}
              </p>
            </div>

            {/* Micro bento highlights */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 ${!isImageEnabled && 'max-w-2xl mx-auto'}`}>
              <div className="bg-brand-dark/40 border border-[#014e7a]/30 p-5 rounded-xl flex items-start gap-4 text-left">
                <div className="p-2 bg-accent/10 rounded-lg text-accent shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-white text-xs uppercase tracking-wider">Vertriebs-Fokus</h4>
                  <p className="text-[11px] text-[#cce9ff]/75 mt-1 leading-relaxed">Seit 2004 im aktiven Vertrieb. Ich weiß genau, was Kunden zum Kaufen bewegt.</p>
                </div>
              </div>

              <div className="bg-brand-dark/40 border border-[#014e7a]/30 p-5 rounded-xl flex items-start gap-4 text-left">
                <div className="p-2 bg-accent/10 rounded-lg text-accent shrink-0">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-white text-xs uppercase tracking-wider">Ergebnis-Garantie</h4>
                  <p className="text-[11px] text-[#cce9ff]/75 mt-1 leading-relaxed">Keine nutzlosen Reichweiten-Tricks, sondern echte, messbare Ergebnisse.</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
