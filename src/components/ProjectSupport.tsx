import { motion } from 'motion/react';
import { FileText, Camera, Radio, Target, Calendar, ArrowRight, Info } from 'lucide-react';
import { ProjectSupportConfig } from '../types';

const PACKAGE_ICONS = [FileText, Camera, Radio, Target];

export default function ProjectSupport({
  onOpenBooking,
  config
}: {
  onOpenBooking: () => void;
  config?: ProjectSupportConfig;
}) {
  if (config?.enabled === false) return null;

  const eyebrow = config?.eyebrow || 'ERGÄNZUNG ZUR INSTAGRAM-DAUERBETREUUNG';
  const title = config?.title || 'Projektbezogene Betreuung';
  const description = config?.description || 'Nicht jeder braucht eine dauerhafte Betreuung. Manchmal reicht ein einzelner Anlass, ein Event, eine Kampagne, ein Launch. Auch dafür bin ich buchbar, ohne dass daraus automatisch ein Dauerauftrag wird.';
  const noteText = config?.noteText || 'Der Umfang und das Honorar richten sich individuell nach dem jeweiligen Projekt.';
  const buttonText = config?.buttonText || 'Projekt anfragen';

  const defaultPackages = [
    {
      id: 'einzelbeitrag',
      title: 'Einzelbeitrag',
      description: 'Ein einzelner Post oder Reel zu einem konkreten Anlass.'
    },
    {
      id: 'event-tagespaket',
      title: 'Event-Tagespaket',
      description: 'Ich bin vor Ort, drehe und liefere mehrere fertige Formate.'
    },
    {
      id: 'live-begleitung',
      title: 'Live-Begleitung',
      description: 'Ich begleite dich live direkt in deinen eigenen Stories, echt und ungekünstelt statt inszeniert.'
    },
    {
      id: 'kampagnenpaket',
      title: 'Kampagnenpaket',
      description: 'Für einen begrenzten Zeitraum rund um ein Ereignis.'
    }
  ];

  const packages = (config?.packages && config.packages.length > 0) ? config.packages : defaultPackages;

  const renderHeadline = (text: string) => {
    const parts = text.split(/\[(.*?)\]/g);
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
  };

  return (
    <section id="projektbetreuung" className="py-16 md:py-24 relative overflow-hidden bg-gradient-to-b from-brand-dark to-brand-darker px-4 sm:px-6 border-t border-[#014e7a]/30">
      {/* Ambient decorative glow */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-accent filter blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <span className="inline-block py-1 px-3.5 bg-accent/15 border border-accent/25 text-accent text-xs font-mono font-bold tracking-[0.2em] rounded uppercase mb-4">
            {eyebrow}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none mb-6">
            {renderHeadline(title)}
          </h2>
          <p className="text-[#e6f4ff]/90 text-base md:text-lg leading-relaxed font-sans font-light">
            {description}
          </p>
        </div>

        {/* 4 Packages Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {packages.map((pkg, idx) => {
            const IconComponent = PACKAGE_ICONS[idx % PACKAGE_ICONS.length];
            return (
              <motion.div
                key={pkg.id || idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -4, borderColor: 'var(--color-accent)' }}
                className="bg-brand-darker/90 border border-[#014e7a]/50 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 shadow-lg hover:shadow-[0_0_25px_rgba(255,204,0,0.15)] group relative overflow-hidden"
              >
                {/* Subtle top accent line on hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div>
                  {/* Icon & Package badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="p-3 bg-accent/15 rounded-xl text-accent border border-accent/30 group-hover:bg-accent group-hover:text-black transition-colors duration-300 shrink-0">
                      <IconComponent className="w-6 h-6 stroke-[2]" />
                    </div>
                    <span className="font-mono text-[10px] text-[#d6c3a3] tracking-widest uppercase bg-[#014e7a]/30 px-2.5 py-1 rounded">
                      OPTION #{idx + 1}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-display text-lg font-black text-white uppercase tracking-wide mb-2.5 group-hover:text-accent transition-colors">
                    {pkg.title}
                  </h3>
                  <p className="text-sm text-[#cce9ff]/85 leading-relaxed font-sans">
                    {pkg.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Note & CTA Footer Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-brand-darker border border-accent/30 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl"
        >
          {/* Note Text */}
          <div className="flex items-start md:items-center gap-3.5 text-left">
            <div className="p-2.5 bg-accent/15 text-accent rounded-xl border border-accent/25 shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <p className="text-xs sm:text-sm text-[#cce9ff]/90 font-mono italic">
              „{noteText}“
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={onOpenBooking}
            className="w-full md:w-auto py-3.5 px-7 bg-accent hover:bg-[#ebd500] text-black font-display text-xs font-black tracking-widest uppercase rounded-xl transition-transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-accent/20"
          >
            <Calendar className="w-4 h-4 stroke-[2.5]" />
            <span>{buttonText}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </motion.div>

      </div>
    </section>
  );
}
