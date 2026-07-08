import { motion } from 'motion/react';
import { Sparkles, Palette, Layers, Radio, HeartHandshake, BarChart3, Presentation, ArrowRight } from 'lucide-react';
import { SERVICES } from '../data';
import { Service, ServicesSectionConfig } from '../types';

const ICON_MAP: Record<string, any> = {
  'content-creation': Sparkles,
  'strategy': Layers,
  'management': Radio,
  'community': HeartHandshake,
  'analytics': BarChart3,
  'storyboard': Presentation,
};

export default function ServicesList({ 
  onOpenBooking, 
  services,
  sectionConfig
}: { 
  onOpenBooking: () => void; 
  services?: Service[];
  sectionConfig?: ServicesSectionConfig;
}) {
  const currentServicesList = services || SERVICES;
  // Get all services marked as primary (or fallback to the first service if none are explicit)
  const primaryServices = currentServicesList.filter(s => s.isPrimary);
  const finalPrimaryServices = primaryServices.length > 0 ? primaryServices : [currentServicesList[0]];
  const secondaryServices = currentServicesList.filter(s => !finalPrimaryServices.some(p => p.id === s.id));

  const eyebrow = sectionConfig?.eyebrow || 'Portfolio & Leistungen';
  const title = sectionConfig?.title || 'Wie ich deine Marke [unschlagbar sichtbar] mache';
  const descriptions = sectionConfig?.descriptions || [
    'Mein Versprechen: Hochwertiger, strategischer Content, der deine Markenbotschaft trägt und aus Followern messbare Leads generiert. Komplett von mir abgewickelt, ohne Stress für dich.'
  ];

  const getServiceFeatures = (serviceId: string): string[] => {
    switch (serviceId) {
      case 'content-creation':
        return ['Konzeptstarke Reels', 'Wertvolle Carousels', 'Interaktive Stories'];
      case 'strategy':
        return ['Zielgruppen-Psychologie', 'Klare Positionierung', 'Maßgeschneiderter Fahrplan'];
      case 'management':
        return ['Stressfreie Veröffentlichung', 'Konstante Präsenz', 'Zeitnahes Scheduling'];
      case 'community':
        return ['Aktive Lead-Interaktion', 'Schnelle DM-Antworten', 'Markenkonformer Ton'];
      case 'analytics':
        return ['Datenbasierte Berichte', 'Conversion-Optimierung', 'Nachhaltiges Wachstum'];
      case 'storyboard':
        return ['Psychologische Hooks', 'Ausgearbeitete Skripte', 'Fesselndes Storytelling'];
      default:
        return ['Premium Qualität', '100% Zuverlässig', 'Messbarer Erfolg'];
    }
  };

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20 } },
  };

  return (
    <section id="leistungen" className="py-20 md:py-28 relative overflow-hidden bg-brand-dark px-4 sm:px-6">
      {/* Dynamic graphic background dots */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-accent filter blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-cyan-400 filter blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="mb-16 text-center md:text-left">
          <span className="text-xs font-mono text-[#d6c3a3] tracking-[0.25em] uppercase block mb-3">
            {eyebrow}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none mb-4">
            {renderHeadline(title)}
          </h2>
          <div className="space-y-8 mt-6">
            {descriptions.map((desc, idx) => {
              const dObj = typeof desc === 'string'
                ? { eyebrow: '', title: '', text: desc }
                : { eyebrow: desc?.eyebrow || '', title: desc?.title || '', text: desc?.text || '' };
              return (
                <div key={idx} className="space-y-2 border-l-2 border-accent/25 pl-4 py-1">
                  {dObj.eyebrow && (
                    <span className="text-[10px] font-mono text-accent tracking-[0.25em] uppercase block">
                      {dObj.eyebrow}
                    </span>
                  )}
                  {dObj.title && (
                    <h3 className="font-display text-lg sm:text-xl font-black text-white uppercase tracking-wider mb-1.5">
                      {renderHeadline(dObj.title)}
                    </h3>
                  )}
                  {dObj.text && (
                    <p className="text-[#e6f4ff]/85 text-sm md:text-base max-w-2xl leading-relaxed font-sans">
                      {renderHeadline(dObj.text)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Primary/Main Service Spotlight Cards (Rendered stacked if multiple) */}
        <div className="space-y-6 mb-10 text-left" id="primary-services-container">
          {finalPrimaryServices.map((pService) => {
            const PrimaryIcon = ICON_MAP[pService.id] || Sparkles;
            const features = getServiceFeatures(pService.id);
            return (
              <motion.div
                key={pService.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                whileHover={{ 
                  scale: 1.018,
                  borderColor: '#ffcc00',
                  boxShadow: '0 0 45px rgba(255, 204, 0, 0.5)'
                }}
                whileTap={{ scale: 0.995 }}
                onClick={onOpenBooking}
                className="p-6 md:p-10 rounded-2xl bg-gradient-to-br from-[#015382] via-[#014166] to-[#002940] border-[3px] border-accent relative overflow-hidden shadow-[0_0_30px_rgba(255,204,0,0.25)] group cursor-pointer pointer-events-auto transition-all duration-300 hover:from-[#025fa8] hover:to-[#003452]"
                id={`primary-service-spotlight-${pService.id}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenBooking();
                  }
                }}
              >
                {/* Spotlight Ambient Back-Glow (Anti-AI-Slop hand-crafted lighting) */}
                <div className="absolute -right-24 -top-24 w-80 h-80 bg-accent/20 rounded-full filter blur-3xl opacity-40 group-hover:opacity-75 transition-opacity duration-500 pointer-events-none" />
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-cyan-400/10 rounded-full filter blur-2xl opacity-20 group-hover:opacity-45 transition-opacity duration-500 pointer-events-none" />

                {/* Spotlight Accent Highlight Badge */}
                <div className="absolute top-0 right-0 py-2 px-5 bg-accent text-black font-mono text-[11px] font-black tracking-widest uppercase rounded-bl-xl shadow-md flex items-center gap-1.5 z-20">
                  <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping shrink-0" />
                  <span>HAUPTLEISTUNG — {pService.label}</span>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center relative z-10 pointer-events-none">
                  {/* Icon section */}
                  <div className="p-4 bg-accent/15 rounded-2xl text-accent border-2 border-accent/30 shrink-0 group-hover:bg-accent/25 group-hover:border-accent transition-all duration-300 shadow-lg shadow-black/30">
                    <PrimaryIcon className="w-10 h-10 md:w-12 md:h-12" />
                  </div>

                  <div className="flex-1 pointer-events-none">
                    <div className="flex items-center gap-2 mb-2 font-mono text-[10px] text-accent font-black tracking-[0.2em] uppercase">
                      <span>✓ PRESTIGE & EXKLUSIVITÄT</span>
                    </div>
                    <h3 className="font-display text-2xl sm:text-3.5xl font-black text-white uppercase tracking-wide mb-3 group-hover:text-accent transition-colors leading-tight">
                      {pService.title}
                    </h3>
                    <p className="text-[#e6f4ff] text-base md:text-lg max-w-4xl leading-relaxed">
                      {pService.description}
                    </p>

                    {/* Specific features under this spotlight service */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                      {features.map((feature, fIdx) => (
                        <div 
                          key={fIdx} 
                          className="flex items-center gap-2.5 text-sm bg-[#003c5d]/85 px-4 py-3 rounded-xl border border-[#015382]/50 text-white group-hover:border-accent/50 group-hover:bg-[#00476e]/100 transition-all duration-300 shadow-sm"
                        >
                          <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
                          <span className="font-semibold">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Interactive Help Hint for high CTR and clear clickability */}
                    <div className="text-accent/90 font-mono text-[10px] tracking-widest uppercase mt-5 flex items-center gap-1.5 group-hover:text-white transition-colors duration-300 animate-pulse">
                      <span>⚡ KLICKE ÜBERALL AUF DIESEN BANNER, UM JETZT DIREKT ANZUPHRAGEN!</span>
                    </div>
                  </div>

                  <div className="w-full lg:w-auto shrink-0 pt-4 lg:pt-0 pointer-events-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenBooking();
                      }}
                      className="w-full lg:w-auto py-4 px-10 bg-accent text-black font-display text-xs tracking-widest font-black uppercase rounded-xl hover:bg-[#ebd500] cursor-pointer shadow-[0_4px_20px_rgba(255,204,0,0.4)] transition-all hover:scale-[1.04] active:scale-[0.96] flex items-center justify-center gap-2 group-hover:shadow-[0_0_30px_rgba(255,204,0,0.8)]"
                    >
                      Jetzt anfragen
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Secondary Services Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          id="services-grid"
        >
          {secondaryServices.map((service: Service) => {
            const Icon = ICON_MAP[service.id] || Layers;
            return (
              <motion.div
                key={service.id}
                variants={itemVariants}
                className="bg-brand-darker border border-[#014e7a]/40 rounded-xl p-6 relative overflow-hidden group hover:border-[#ffcc00]/50 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-[#014e7a]/80 text-[#cce9ff] group-hover:text-accent group-hover:bg-[#014e7a] rounded-lg transition-colors border border-[#014e7a]/30">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-[10px] text-[#d6c3a3] tracking-[0.2em] font-semibold uppercase bg-[#014e7a]/20 py-1 px-2.5 rounded">
                      {service.label}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-white mb-2 uppercase tracking-wide group-hover:text-[#ffcc00] transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-sm text-[#cce9ff]/80 leading-relaxed font-sans mb-6">
                    {service.description}
                  </p>
                </div>
                <div className="h-[1px] bg-[#014e7a]/30 w-full mt-auto"></div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Add-on Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="p-6 md:p-8 rounded-2xl bg-brand-darker border border-[#ffcc00]/20 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-6"
          id="service-addon-banner"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#ffcc00]/10 rounded-xl text-[#ffcc00] border border-[#ffcc00]/20 shrink-0">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <span className="font-mono text-[10px] text-[#d6c3a3] tracking-[0.2em] uppercase block mb-0.5">
                EXKLUSIVES UPGRADE-ANGEBOT
              </span>
              <h4 className="font-display text-base font-bold text-white uppercase tracking-wider">
                Full-Service-Design: Website & Printmaterial
              </h4>
              <p className="text-xs text-[#cce9ff]/75 mt-0.5 max-w-xl">
                Auf Wunsch übernehme ich auch das Screendesign deiner Website sowie edle Printmaterialien (Visitenkarten, Flyer) – alles aus einer kreativen Hand.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenBooking}
            className="py-3 px-5 text-center text-xs tracking-widest font-black uppercase rounded-lg border border-[#ffcc00] text-[#ffcc00] hover:bg-[#ffcc00] hover:text-black hover:scale-[1.02] cursor-pointer transition-all shrink-0 font-display"
          >
            Auf Anfrage hinzufügen
          </button>
        </motion.div>
      </div>
    </section>
  );
}
