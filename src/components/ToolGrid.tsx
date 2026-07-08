import { motion } from 'motion/react';
import { LayoutTemplate, Cloud, Scissors, Instagram, Check } from 'lucide-react';
import { TOOLS } from '../data';
import { Tool } from '../types';

const TOOL_ICONS: Record<string, any> = {
  'Canva': LayoutTemplate,
  'Drive': Cloud,
  'CapCut': Scissors,
  'Instagram': Instagram,
};

export default function ToolGrid({ tools }: { tools?: Tool[] }) {
  const currentTools = tools || TOOLS;
  return (
    <section id="tools" className="py-20 bg-brand-darker relative overflow-hidden px-4 sm:px-6 border-y border-[#014e7a]/20">
      <div className="max-w-6xl mx-auto">
        {/* Section Title */}
        <div className="text-center mb-16">
          <span className="text-xs font-mono text-[#d6c3a3] tracking-[0.25em] uppercase block mb-3">
            Workflow & Effizienz
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
            Meine Profi-Tools für <span className="text-[#ffcc00]">Premium-Ergebnisse</span>
          </h2>
          <p className="text-[#cce9ff]/70 text-sm max-w-lg mx-auto mt-3">
            Keine Kompromisse bei der Qualität. Mit diesen Branchenstandards sorge ich für perfekten, reibungslosen Workflow und messerscharfen Content.
          </p>
        </div>

        {/* Tools Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {currentTools.map((tool: Tool) => {
            const IconComponent = TOOL_ICONS[tool.iconName] || LayoutTemplate;
            return (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-brand-dark border border-[#014e7a]/30 p-6 rounded-2xl relative overflow-hidden group hover:border-accent hover:shadow-xl transition-all duration-300"
              >
                {/* Visual Background Accent */}
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#014e7a]/10 rounded-full group-hover:scale-150 transition-all duration-500 blur-xl"></div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-[#014e7a] text-[#ffcc00] group-hover:bg-[#ffcc00] group-hover:text-black rounded-xl transition-all duration-300">
                    <IconComponent className="w-5 h-5 shrink-0" />
                  </div>
                  <h3 className="font-display font-bold text-base text-white tracking-wide uppercase">
                    {tool.name}
                  </h3>
                </div>

                <p className="text-xs text-[#cce9ff]/80 leading-relaxed relative z-10">
                  {tool.description}
                </p>

                {/* Micro Indicator List */}
                <div className="mt-4 pt-4 border-t border-[#014e7a]/20 flex items-center gap-1.5 text-[10px] text-accent font-mono tracking-widest uppercase">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Branchenstandard</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
