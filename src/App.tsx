import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PhoneCall, Calendar, ArrowUpRight, MessageSquare, Menu, X, ArrowDown, Key } from 'lucide-react';

// Subcomponents import
import CookieBanner from './components/CookieBanner';
import CalendlyModal from './components/CalendlyModal';
import ServicesList from './components/ServicesList';
import AboutSection from './components/AboutSection';
import References from './components/References';
import ProcessTimeline from './components/ProcessTimeline';
import ContactForm from './components/ContactForm';
import LegalSection from './components/LegalSection';
import OnePagerMockup from './components/OnePagerMockup';
import AdminBackend from './components/AdminBackend';
import WhatsAppPopup from './components/WhatsAppPopup';

import { loadLandingPageData, subscribeLandingPageData } from './lib/cmsStore';
import { LandingPageData } from './types';
import { adjustBrightness } from './lib/colorUtils';

export default function App() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [thirdPartyAllowed, setThirdPartyAllowed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [pageData, setPageData] = useState<LandingPageData | null>(null);

  // Load landing page data from Firebase or fallback on startup
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const loadData = () => {
      unsubscribe = subscribeLandingPageData(
        (data) => {
          setPageData(data);
        },
        (err) => {
          console.error('Failed to listen to page data:', err);
        }
      );
    };
    loadData();

    // Check pre-existing hash for admin view
    const handleHash = () => {
      if (window.location.hash === '#admin' || window.location.hash === '#wp-admin') {
        setIsAdminView(true);
      } else {
        setIsAdminView(false);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    
    return () => {
      window.removeEventListener('hashchange', handleHash);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Dynamic SEO Boost: Seamlessly sync customized CMS values to DOM header for Google/social scrapers
  useEffect(() => {
    if (!pageData) return;
    
    // 1. Dynamic Title matching brand setup
    const brandName = pageData.hero?.logoText || 'Florian Kusche';
    const subTitle = pageData.hero?.logoSubtext || 'Social Media Marketing';
    const cleanTitle = `${brandName} - ${subTitle}`;
    document.title = cleanTitle;

    // 2. Dynamic Description based on active main services text
    let mainDescription = '';
    if (pageData.servicesSection?.descriptions && pageData.servicesSection.descriptions.length > 0) {
      const firstDesc = pageData.servicesSection.descriptions[0];
      mainDescription = typeof firstDesc === 'string' ? firstDesc : (firstDesc?.text || '');
    }
    
    if (mainDescription) {
      const cleanDesc = mainDescription.replace(/[\[\]]/g, '');
      
      // Sync standard meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', cleanDesc.substring(0, 160));

      // Sync OpenGraph description for high-clickthrough sharing
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (!ogDesc) {
        ogDesc = document.createElement('meta');
        ogDesc.setAttribute('property', 'og:description');
        document.head.appendChild(ogDesc);
      }
      ogDesc.setAttribute('content', cleanDesc.substring(0, 200));
    }

    // Sync OpenGraph Title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', `${brandName} | Premium Social Media Partner`);

  }, [pageData]);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Resolve WordPress Admin Colors with brightness adjustments
  const activeColors = pageData?.colors || {
    accent: '#ffcc00',
    accentBrightness: 0,
    brandDark: '#004369',
    brandDarkBrightness: 0,
    brandDarker: '#002d47',
    brandDarkerBrightness: 0,
    brandDarkCard: '#014e7a',
    brandDarkCardBrightness: 0,
  };

  const finalAccent = adjustBrightness(activeColors.accent, activeColors.accentBrightness || 0);
  const finalBrandDark = adjustBrightness(activeColors.brandDark, activeColors.brandDarkBrightness || 0);
  const finalBrandDarker = adjustBrightness(activeColors.brandDarker, activeColors.brandDarkerBrightness || 0);
  const finalBrandDarkCard = adjustBrightness(activeColors.brandDarkCard, activeColors.brandDarkCardBrightness || 0);

  return (
    <div className="min-h-screen bg-brand-dark text-brand-main-text font-sans scroll-smooth flex flex-col justify-between lg:pl-[70px]">
      {/* Dynamic WordPress Colors Style Tag Override */}
      <style>{`
        :root {
          --color-accent: ${finalAccent} !important;
          --color-brand-dark: ${finalBrandDark} !important;
          --color-brand-darker: ${finalBrandDarker} !important;
          --color-brand-dark-card: ${finalBrandDarkCard} !important;
        }
      `}</style>
      
      {/* "Elegant Dark" Vertical Sidebar for Desktop */}
      <div className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[70px] border-r border-[#cce9ff]/10 flex-col items-center justify-between py-6 bg-brand-darker/60 backdrop-blur-md z-50">
        <div className="writing-mode-vertical rotate-180 uppercase font-black tracking-[0.4em] text-sm text-white font-display select-none">
          {pageData?.hero?.logoText || 'FLORIAN KUSCHE'}
        </div>
        <button 
          onClick={() => {
            window.location.hash = '#admin';
            setIsAdminView(true);
          }}
          className="text-[#cce9ff]/40 hover:text-accent p-2 cursor-pointer transition-colors"
          title="WordPress CMS Admin Panel"
        >
          <Key className="w-5 h-5" />
        </button>
      </div>

      {/* 1. Header / Navigation Bar */}
      <header className="sticky top-0 left-0 right-0 z-40 bg-brand-dark/85 backdrop-blur-md border-b border-brand-dark-card/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          {/* Text-Logo: MODERN/CLEAN, GROSSBUCHSTABEN, WEITES TRACKING */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-left cursor-pointer group"
          >
            <span className="font-display font-black text-xl sm:text-2xl tracking-[0.3em] text-white uppercase block leading-none transition-colors group-hover:text-accent">
              {pageData?.hero?.logoText || 'FLORIAN KUSCHE'}
            </span>
            <span className="font-mono text-[9px] tracking-[0.22em] text-[#d6c3a3] uppercase block mt-1 leading-none font-semibold">
              {pageData?.hero?.logoSubtext || 'INSTAGRAM MANAGEMENT & CONTENT'}
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-mono font-bold tracking-widest uppercase">
            <button
              onClick={() => scrollToSection('leistungen')}
              className="text-[#cce9ff]/80 hover:text-white transition-colors cursor-pointer"
            >
              Leistungen
            </button>
            <button
              onClick={() => scrollToSection('referenzen')}
              className="text-[#cce9ff]/80 hover:text-white transition-colors cursor-pointer"
            >
              Referenzen
            </button>
            <button
              onClick={() => scrollToSection('prozess')}
              className="text-[#cce9ff]/80 hover:text-white transition-colors cursor-pointer"
            >
              Prozess
            </button>
            <button
              onClick={() => scrollToSection('kontakt')}
              className="text-[#cce9ff]/80 hover:text-white transition-colors cursor-pointer"
            >
              Kontakt
            </button>

            {/* Quick Primary Button */}
            <button
              onClick={() => setIsBookingOpen(true)}
              className="ml-4 py-2.5 px-5 bg-accent hover:bg-[#ebd500] text-black text-xs font-display font-black tracking-widest uppercase rounded-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
              id="nav-booking-cta"
            >
              <Calendar className="w-3.5 h-3.5 stroke-[2.5]" />
              Gespräch buchen
            </button>
          </nav>

          {/* Mobile Hamburguer Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white hover:text-accent p-2 cursor-pointer transition-colors"
            id="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        <div
          className={`md:hidden absolute top-20 left-0 right-0 bg-brand-darker/98 border-b border-brand-dark-card/50 p-6 flex flex-col gap-5 text-sm tracking-widest font-mono uppercase text-[#cce9ff] transition-all duration-300 ${
            mobileMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-8 pointer-events-none'
          }`}
          id="mobile-nav-menu"
        >
          <button onClick={() => scrollToSection('leistungen')} className="text-left font-bold border-b border-brand-dark-card/20 pb-2">
            Leistungen
          </button>
          <button onClick={() => scrollToSection('referenzen')} className="text-left font-bold border-b border-brand-dark-card/20 pb-2">
            Referenzen
          </button>
          <button onClick={() => scrollToSection('prozess')} className="text-left font-bold border-b border-brand-dark-card/20 pb-2">
            Prozess
          </button>
          <button onClick={() => scrollToSection('kontakt')} className="text-left font-bold border-b border-brand-dark-card/20 pb-2">
            Kontakt
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setIsBookingOpen(true);
            }}
            className="w-full py-3.5 px-4 bg-accent text-black font-display font-black text-xs text-center rounded-xl flex items-center justify-center gap-1.5 tracking-widest cursor-pointer"
          >
            <Calendar className="w-4 h-4 stroke-[3]" />
            KOSTENLOSES ERSTGESPRÄCH
          </button>
        </div>
      </header>

      {/* 2. Block 1: Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-b from-brand-dark to-brand-darker px-4 sm:px-6">
        
        {/* Ambient grid background overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(var(--color-brand-dark-card)_1px,transparent_1px),linear-gradient(90deg,var(--color-brand-dark-card)_1px,transparent_1px)] bg-[size:32px_32px] opacity-10 pointer-events-none"></div>

        <div className="max-w-4xl mx-auto relative z-10 text-center flex flex-col items-center">
          
          {/* Main Column: Bold Copy & CTAs */}
          <div className="space-y-6 text-center flex flex-col items-center">
            
            {/* Zwischenfoto / Banner */}
            {pageData?.betweenSectionImage?.enabled && pageData.betweenSectionImage.imageUrl && (
              <div 
                className="flex w-full select-none justify-center"
                style={{
                  marginTop: `${pageData.betweenSectionImage.marginTop}px`,
                  marginBottom: `${pageData.betweenSectionImage.marginBottom}px`
                }}
              >
                <motion.img
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  src={pageData.betweenSectionImage.imageUrl}
                  alt="Florian Kusche Foto"
                  className={`object-cover shadow-2xl border border-brand-dark-card/40 ${
                    pageData.betweenSectionImage.borderRadius === 'full' 
                      ? 'rounded-full aspect-square' 
                      : pageData.betweenSectionImage.borderRadius === 'xl' 
                        ? 'rounded-2xl' 
                        : pageData.betweenSectionImage.borderRadius === 'md' 
                          ? 'rounded-md' 
                          : 'rounded-none'
                  }`}
                  style={{
                    width: `${pageData.betweenSectionImage.width}px`
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <span className="inline-block py-1 px-3.5 bg-brand-dark-card text-[#d6c3a3] font-mono text-xs font-bold tracking-[0.2em] rounded uppercase">
              {pageData?.hero?.eyebrow || 'Instagram Management & Content'}
            </span>

            {/* MAIN HEADLINE */}
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-white uppercase tracking-tight leading-none whitespace-pre-line max-w-3xl">
              {pageData?.hero?.headline || 'Mehr Anfragen.\nMehr Sichtbarkeit.\nKein Stress.'}
            </h1>

            {/* SUBTITLE */}
            <p className="text-[#cce9ff]/90 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-sans font-light">
              {pageData?.hero?.subtitle || 'Ich übernehme deinen Instagram-Auftritt komplett, damit du dich auf dein Business konzentrieren kannst.'}
            </p>

            {/* CTA BUTTONS */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full sm:w-auto">
              
              <button
                onClick={() => setIsBookingOpen(true)}
                className="w-full sm:w-auto py-4 px-8 bg-accent hover:bg-[#ebd500] text-black font-display text-sm tracking-widest font-black uppercase rounded-xl shadow-xl transition-all hover:scale-[1.03] cursor-pointer flex items-center justify-center gap-2"
                id="hero-primary-cta"
              >
                <Calendar className="w-4 h-4 stroke-[2.5]" />
                {pageData?.hero?.primaryCta || 'Kostenloses Erstgespräch'}
              </button>

              <button
                onClick={() => scrollToSection('prozess')}
                className="w-full sm:w-auto py-4 px-8 bg-transparent text-[#cce9ff] hover:text-white font-display text-sm tracking-widest font-bold uppercase rounded-xl border border-brand-dark-card hover:border-accent/50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                id="hero-secondary-cta"
              >
                <span>{pageData?.hero?.secondaryCta || 'Wie ich arbeite'}</span>
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>

            {/* Onboarding Quick Check */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[#cce9ff]/75 font-mono">
              {(pageData?.hero?.checklist || ['100% Betreut', 'Keine Vorkenntnisse Nötig', 'Transparente Monatsplanung']).map((item, index) => (
                <span key={index} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                  {item}
                </span>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 3. Block 1.5: Wer steckt dahinter */}
      <AboutSection 
        about={pageData?.about} 
        defaultPortraitUrl={pageData?.betweenSectionImage?.imageUrl || pageData?.contactImage?.imageUrl}
      />

      {/* 3. Block 2: Leistungen (Services) */}
      <ServicesList 
        onOpenBooking={() => setIsBookingOpen(true)} 
        services={pageData?.services} 
        sectionConfig={pageData?.servicesSection} 
      />

      {/* 5. Block 4: Referenzen (Kunden & Testimonial) */}
      <References references={pageData?.references} fehrmannStats={pageData?.fehrmannStats} />

      {/* 6. Block 5: Zusammenarbeit & Onboarding */}
      <ProcessTimeline 
        onOpenBooking={() => setIsBookingOpen(true)} 
        processes={pageData?.processes} 
        trustBlock={pageData?.trustBlock}
      />

      {/* 7. Block 6: Kontaktformular */}
      <ContactForm footer={pageData?.footer} contactImage={pageData?.contactImage} />

      {/* 8. Block 7: Rechtliches (Footer) */}
      <LegalSection footer={pageData?.footer} />

      {/* 9. Cookie Consent Overlay */}
      <CookieBanner onAcceptThirdParty={(accepted) => setThirdPartyAllowed(accepted)} />

      {/* 10. Calendly Appointment Booking Assistant Modal */}
      <CalendlyModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        thirdPartyAllowed={thirdPartyAllowed}
        calendlyConfig={pageData?.calendly}
      />

      {/* 11. Custom CMS WordPress admin panel overlay */}
      {isAdminView && (
        <AdminBackend onClose={() => {
          setIsAdminView(false);
          window.location.hash = '';
        }} />
      )}

      {/* 12. Floating WhatsApp Interactive Popup Widget */}
      <WhatsAppPopup 
        phone={pageData?.footer?.phone} 
        avatarUrl={pageData?.betweenSectionImage?.imageUrl || pageData?.contactImage?.imageUrl} 
      />

    </div>
  );
}
