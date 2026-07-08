import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, MessageSquare, Send, CheckCircle2, Copy, Trash2, ArrowRight } from 'lucide-react';

import { FooterConfig, BetweenSectionImageConfig } from '../types';

export default function ContactForm({ footer, contactImage }: { footer?: FooterConfig; contactImage?: BetweenSectionImageConfig }) {
  const currentEmail = footer?.email || 'florian@floriankusche.de';
  const currentPhone = footer?.phone || '+49 151 28897623';
  const currentInstagram = footer?.instagram || '@floriankusche.social';
  const cleanPhoneForWhatsApp = currentPhone.replace(/[^0-9]/g, ''); // strip spaces and + etc for wa.me link

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Preformatted WhatsApp Link
  const getWhatsAppLink = () => {
    const text = `Hallo Florian, ich schicke dir eine Anfrage über das Kontaktformular!%0A%0A👤 Name: ${formData.name}%0A✉️ E-Mail: ${formData.email}%0A📱 Telefon/WhatsApp: ${formData.phone || 'Nicht angegeben'}%0A💬 Nachricht: ${formData.message}`;
    return `https://wa.me/${cleanPhoneForWhatsApp.startsWith('00') ? cleanPhoneForWhatsApp.slice(2) : cleanPhoneForWhatsApp.startsWith('49') ? cleanPhoneForWhatsApp : '49' + cleanPhoneForWhatsApp}?text=${text}`;
  };

  // Preformatted Email Mailto link
  const getMailtoLink = () => {
    const subject = 'Anfrage über Kontaktformular - Florian Kusche';
    const body = `Hallo Florian,\n\nich möchte dir eine Anfrage über das Kontaktformular senden!\n\nName: ${formData.name}\nE-Mail: ${formData.email}\nTelefon/WhatsApp: ${formData.phone || 'Nicht angegeben'}\n\nNachricht:\n${formData.message}\n\nBitte melde dich bei mir.`;
    return `mailto:${currentEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleCopyMessage = () => {
    const summary = `Anfrage an Florian Kusche:\nName: ${formData.name}\nE-Mail: ${formData.email}\nTelefon: ${formData.phone || 'n/a'}\nNachricht: ${formData.message}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate server side submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1200);
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', message: '' });
    setIsSuccess(false);
  };

  return (
    <section id="kontakt" className="py-20 md:py-28 bg-brand-dark px-4 sm:px-6 relative overflow-hidden">
      
      {/* Background radial overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(1,78,122,0.15),transparent_60%)] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Split Section Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-start">
          
          {/* Left Side Info Pane: Contact Cards */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <span className="text-xs font-mono text-[#d6c3a3] tracking-[0.25em] uppercase block mb-3">
                KONTAKT & DIALOG
              </span>
              {contactImage?.enabled && contactImage.imageUrl && (
                <div 
                  className={`flex w-full select-none ${
                    contactImage.alignment === 'center' 
                      ? 'justify-center' 
                      : contactImage.alignment === 'right' 
                        ? 'justify-center lg:justify-end' 
                        : 'justify-center lg:justify-start'
                  }`}
                  style={{
                    marginTop: `${contactImage.marginTop}px`,
                    marginBottom: `${contactImage.marginBottom}px`
                  }}
                >
                  <motion.img
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    src={contactImage.imageUrl}
                    alt="Kontakt Foto"
                    className={`object-cover shadow-2xl border border-brand-dark-card/40 ${
                      contactImage.borderRadius === 'full' 
                        ? 'rounded-full aspect-square' 
                        : contactImage.borderRadius === 'xl' 
                          ? 'rounded-2xl' 
                          : contactImage.borderRadius === 'md' 
                            ? 'rounded-md' 
                            : 'rounded-none'
                    }`}
                    style={{
                      width: `${contactImage.width}px`
                    }}
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <h2 className="font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
                LASS UNS <br />
                <span className="text-[#ffcc00]">ETWAS GROSSES</span> STARTEN
              </h2>
              <p className="text-[#cce9ff]/80 text-sm mt-4 leading-relaxed">
                Egal ob schnelles Feedback auf WhatsApp, klassische E-Mail oder ausführliche Nachricht – wähle einfach deinen bevorzugten Kanal aus. Ich melde mich innerhalb von 24 Stunden bei dir.
              </p>
            </div>

            {/* Direct Connect Buttons */}
            <div className="space-y-4">
              
              {/* WhatsApp Card */}
              <a
                href={`https://wa.me/${cleanPhoneForWhatsApp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/50 transition-all group cursor-pointer"
                id="contact-whatsapp-link"
              >
                <div className="p-3 bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white rounded-xl transition-all">
                  <MessageSquare className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <span className="font-mono text-[9px] text-emerald-400 tracking-widest uppercase block font-semibold">WhatsApp Chat</span>
                  <span className="font-display text-base font-bold text-white block">{currentPhone}</span>
                  <span className="text-xs text-[#cce9ff]/60">Sende eine Frage direkt über WhatsApp</span>
                </div>
              </a>

              {/* Email Card */}
              <a
                href={`mailto:${currentEmail}`}
                className="flex items-center gap-4 p-4 rounded-xl bg-[#014e7a]/30 border border-[#014e7a]/40 hover:border-[#ffcc00]/30 transition-all group cursor-pointer"
                id="contact-email-link"
              >
                <div className="p-3 bg-[#014e7a] text-[#ffcc00] group-hover:bg-[#ffcc00] group-hover:text-black rounded-xl transition-all">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-mono text-[9px] text-[#d6c3a3] tracking-widest uppercase block font-semibold">Klassische Nachricht</span>
                  <span className="font-display text-base font-bold text-white block">{currentEmail}</span>
                  <span className="text-xs text-[#cce9ff]/60">Antwortgarantie unter 24 Stunden</span>
                </div>
              </a>

              {/* Instagram Handle */}
              <a
                href={`https://instagram.com/${currentInstagram.replace(/^@/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl bg-brand-darker/60 border border-[#014e7a]/20 hover:border-[#014e7a]/60 transition-all group cursor-pointer"
                id="contact-instagram-link"
              >
                <div className="p-3 bg-brand-dark text-[#cce9ff]/85 group-hover:text-accent rounded-xl transition-all">
                  <span className="font-sans font-black text-sm">IG</span>
                </div>
                <div>
                  <span className="font-mono text-[9px] text-[#d6c3a3] tracking-widest uppercase block font-semibold">Social Media</span>
                  <span className="font-display text-base font-bold text-white block">{currentInstagram}</span>
                  <span className="text-xs text-[#cce9ff]/60">Folge mir für nützliche Instagram-Hacks</span>
                </div>
              </a>

            </div>
          </div>

          {/* Right Side Form Pane */}
          <div className="lg:col-span-3 bg-brand-darker border border-[#014e7a]/30 p-6 md:p-8 rounded-3xl relative">
            
            <AnimatePresence mode="wait">
              {!isSuccess ? (
                <motion.form
                  key="form-edit"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleFormSubmit}
                  className="space-y-5"
                  id="actual-contact-form"
                >
                  <div className="pb-3 border-b border-[#014e7a]/20">
                    <h3 className="font-display text-lg font-bold uppercase text-white tracking-wider">
                      Kontaktformular
                    </h3>
                    <p className="text-xs text-[#cce9ff]/70 mt-0.5">
                      Fülle die Felder aus und ich erstelle direkt eine strukturierte Gesprächsnotiz für uns.
                    </p>
                  </div>

                  {/* Name field */}
                  <div>
                    <label className="block text-xs font-mono text-[#d6c3a3] tracking-widest uppercase mb-1.5">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Wie darf ich dich nennen?"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#002d47] border border-[#014e7a]/40 rounded-xl px-4 py-3 text-white placeholder-[#cce9ff]/30 focus:outline-none focus:border-accent text-sm"
                    />
                  </div>

                  {/* Info details grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-[#d6c3a3] tracking-widest uppercase mb-1.5">
                        E-Mail *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="deine@firma.de"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-[#002d47] border border-[#014e7a]/40 rounded-xl px-4 py-3 text-white placeholder-[#cce9ff]/30 focus:outline-none focus:border-accent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-[#d6c3a3] tracking-widest uppercase mb-1.5">
                        Telefon / WhatsApp (Optional)
                      </label>
                      <input
                        type="tel"
                        placeholder="Für schnelle Rückfragen"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-[#002d47] border border-[#014e7a]/40 rounded-xl px-4 py-3 text-white placeholder-[#cce9ff]/30 focus:outline-none focus:border-accent text-sm"
                      />
                    </div>
                  </div>

                  {/* Message field */}
                  <div>
                    <label className="block text-xs font-mono text-[#d6c3a3] tracking-widest uppercase mb-1.5">
                      Deine Nachricht *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Beschreibe kurz dein Business, deine Instagram Goals oder deine aktuellen Probleme..."
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-[#002d47] border border-[#014e7a]/40 rounded-xl px-4 py-3 text-white placeholder-[#cce9ff]/30 focus:outline-none focus:border-accent text-sm resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#ffcc00] hover:bg-[#ebd500] text-black font-display text-xs tracking-widest font-black uppercase rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    id="submit-contact-form"
                  >
                    {isSubmitting ? (
                      <span>Einen Moment...</span>
                    ) : (
                      <>
                        <span>ANFRAGE ABSENDEN</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="form-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 flex flex-col items-center justify-center h-full space-y-6"
                  id="contact-form-success"
                >
                  <div className="p-4 bg-accent/10 text-[#ffcc00] rounded-full">
                    <CheckCircle2 className="w-16 h-16 stroke-[1.5]" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-display text-xl font-black text-white tracking-wide uppercase">
                      VIELEN DANK FÜR DEINE ANFRAGE!
                    </h3>
                    <p className="text-xs text-[#cce9ff] max-w-sm mx-auto">
                      Deine Daten wurden erfolgreich strukturiert. Damit die Informationen fehlerfrei direkt zugestellt werden, kannst du das Formular direkt als Nachricht an deine Apps übergeben:
                    </p>
                  </div>

                  {/* Form Submission Delivery Options */}
                  <div className="bg-[#002d47] border border-[#014e7a]/40 p-4 rounded-xl w-full max-w-md space-y-3">
                    <span className="text-[10px] font-mono text-[#d6c3a3] uppercase block text-left">
                      Schnell-Aktionen:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <a
                        href={getWhatsAppLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 font-sans text-xs font-bold text-white rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 fill-current" />
                        Via WhatsApp
                      </a>
                      <a
                        href={getMailtoLink()}
                        className="py-2.5 px-4 bg-[#014e7a] hover:bg-[#014e7a]/80 font-sans text-xs font-bold text-white rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Mail className="w-4 h-4" />
                        Via E-Mail
                      </a>
                    </div>
                    
                    <button
                      onClick={handleCopyMessage}
                      className="w-full py-2 bg-brand-dark hover:bg-brand-dark/80 text-xs font-mono text-[#cce9ff]/80 hover:text-white rounded-lg border border-[#014e7a]/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copied ? 'Notiert!' : 'Nachricht in Zwischenablage kopieren'}
                    </button>
                  </div>

                  <button
                    onClick={resetForm}
                    className="text-xs font-mono text-[#d6c3a3] hover:text-[#ffcc00] tracking-widest uppercase flex items-center gap-1 cursor-pointer pt-4"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Neues Formular ausfüllen
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>

      </div>
    </section>
  );
}
