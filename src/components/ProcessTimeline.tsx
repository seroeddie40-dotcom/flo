import { motion } from 'motion/react';
import { Send, PhoneCall, ScrollText, CheckCircle2, ChevronRight, CornerDownRight, ShieldAlert } from 'lucide-react';
import { PROCESS_STEPS } from '../data';

const STEP_ICONS = [Send, PhoneCall, ScrollText, CheckCircle2];

import { ProcessStep } from '../types';

export default function ProcessTimeline({ onOpenBooking, processes }: { onOpenBooking: () => void; processes?: ProcessStep[] }) {
  const currentProcesses = processes || PROCESS_STEPS;
  return (
    <section id="prozess" className="py-20 md:py-28 bg-[#002d47] relative px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Header */}
        <div className="mb-16 text-center">
          <span className="text-xs font-mono text-[#d6c3a3] tracking-[0.25em] uppercase block mb-3">
            ZUSTÄNDIGKEIT, SCHRITTE & ONBOARDING
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            Der Weg zu deinem <span className="text-[#ffcc00]">neuen Instagram-Auftritt</span>
          </h2>
          <p className="text-[#cce9ff]/70 text-sm max-w-xl mx-auto mt-3">
            Unkompliziert, direkt und absolut zeitsparend für dich. So läuft unsere Zusammenarbeit ab.
          </p>
        </div>

        {/* Process Roadmap: Next Steps Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative mb-20">
          
          {/* Connecting line on desktop */}
          <div className="hidden md:block absolute top-1/2 left-4 right-4 h-0.5 bg-gradient-to-r from-[#014e7a]/20 via-[#ffcc00]/20 to-[#014e7a]/20 transform -translate-y-12 -z-0"></div>

          {currentProcesses.map((step, idx) => {
            const Icon = STEP_ICONS[idx] || CheckCircle2;
            return (
              <motion.div
                key={step.stepNumber}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-brand-dark border border-[#014e7a]/30 p-6 rounded-2xl relative z-10 flex flex-col justify-between"
              >
                <div>
                  {/* Step bubble */}
                  <div className="flex justify-between items-center mb-6">
                    <span className="w-10 h-10 rounded-xl bg-accent text-black font-mono font-black text-lg flex items-center justify-center">
                      {step.stepNumber}
                    </span>
                    <span className="text-[10px] font-mono text-[#d6c3a3] tracking-widest uppercase bg-[#014e7a] py-1 px-2 rounded-lg">
                      SCHRITT {step.stepNumber}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-lg text-white mb-2 uppercase tracking-wide">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#cce9ff]/85 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#014e7a]/20 flex items-center gap-1 text-xs text-accent font-semibold tracking-wider uppercase">
                  {idx === 1 ? (
                    <button
                      onClick={onOpenBooking}
                      className="hover:underline flex items-center gap-1 text-[#ffcc00] cursor-pointer"
                    >
                      Termin buchen <CornerDownRight className="w-3 h-3" />
                    </button>
                  ) : idx === 3 ? (
                    <span className="text-[#ffcc00]">Let's Go!</span>
                  ) : (
                    <span className="text-[#cce9ff]/40">Kostenfrei</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Highlighted block: No "Schnupperangebot", direct high-quality entry */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 bg-brand-dark border border-[#014e7a]/40 rounded-3xl p-8 md:p-10 relative overflow-hidden items-center shadow-xl">
          
          <div className="absolute right-0 top-0 w-24 h-24 bg-accent/5 rounded-full filter blur-3xl pointer-events-none"></div>

          {/* Left Block: Offer Note */}
          <div className="lg:col-span-2 space-y-4">
            <span className="font-mono text-xs text-[#d6c3a3] tracking-widest uppercase block">
              ZUSAMMENARBEIT-PHILO
            </span>
            <h3 className="font-display text-2xl font-black text-white uppercase tracking-tight">
              Keine Schnupperangebote. <br />
              <span className="text-[#ffcc00]">Klare Verbindlichkeit.</span>
            </h3>
            <p className="text-xs text-[#cce9ff]/75 leading-relaxed">
              Ich glaube an nachhaltiges Wachstum und erstklassigen Service. Social Media funktioniert nicht über Nacht. Der beste und fairste Einstieg ist das kostenlose Erstgespräch, bei dem wir deine langfristigen Potenziale ermitteln.
            </p>
            <button
              onClick={onOpenBooking}
              className="py-3 px-6 bg-accent text-black font-display text-xs tracking-widest font-black uppercase rounded-xl hover:bg-[#ebd500] cursor-pointer shadow-lg transition-transform hover:scale-105"
            >
              Kostenloses Erstgespräch buchen
            </button>
          </div>

          {/* Right Block: Onboarding Roadmap graphic placeholder (Instead of "Foto wird nachgeliefert" we create an astounding interactive SVG diagram!) */}
          <div className="lg:col-span-3 bg-brand-darker border border-[#014e7a]/40 p-6 rounded-2xl space-y-4 relative">
            <div className="flex justify-between items-center pb-3 border-b border-[#014e7a]/30">
              <span className="text-xs font-mono text-[#d6c3a3] tracking-wider uppercase font-semibold">
                ONBOARDING ROADMAP (14 - 28 TAGE)
              </span>
              <span className="py-0.5 px-2.5 bg-[#014e7a] text-accent text-[9px] font-mono rounded tracking-widest">
                FOTO FOLGT SPÄTER
              </span>
            </div>

            <p className="text-xs text-[#cce9ff]/90 leading-relaxed italic border-l-2 border-[#ffcc00]/50 pl-3">
              &bdquo;Du stellst mir einmalig Zugänge, Infos und vorhandenes Material zur Verfügung. Den Rest übernehme ich komplett. Onboarding je nach Aufwand 14 bis 28 Tage, danach läuft alles vollautomatisch.&ldquo;
            </p>

            {/* Interactive Roadmap Tracker */}
            <div className="space-y-3 mt-4 pt-1">
              {/* Point 1 */}
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                </div>
                <div>
                  <span className="font-display text-[11px] font-bold text-white block uppercase">Tag 1 - 7: Fundament & Logins</span>
                  <p className="text-[10px] text-[#cce9ff]/70 leading-relaxed">Sichere Übergabe deiner vorhandenen Zugänge, Brand-Guidelines und CI.</p>
                </div>
              </div>

              {/* Point 2 */}
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                </div>
                <div>
                  <span className="font-display text-[11px] font-bold text-white block uppercase">Tag 8 - 14: Strategie & Redaktionsplan</span>
                  <p className="text-[10px] text-[#cce9ff]/70 leading-relaxed">Erstellung der Zielgruppen-Analysen sowie fertiges Storyboard für die ersten 9 Posts.</p>
                </div>
              </div>

              {/* Point 3 */}
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                </div>
                <div>
                  <span className="font-display text-[11px] font-bold text-white block uppercase">Tag 15+: Go-Live & Vollbetreuung</span>
                  <p className="text-[10px] text-[#cce9ff]/70 leading-relaxed">Regelmäßiges Posting, kontinuierliches Community Management und Performance-Analyse.</p>
                </div>
              </div>
            </div>

            {/* Hint Box */}
            <div className="bg-[#002d47] border border-[#014e7a]/20 p-2.5 rounded-lg flex items-center gap-2 mt-4">
              <ShieldAlert className="w-4 h-4 text-accent shrink-0" />
              <span className="text-[9px] text-[#cce9ff]/80">Deine vertraulichen Accounts & Daten werden stets verschlüsselt und sicher verwahrt.</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
