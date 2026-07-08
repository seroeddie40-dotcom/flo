import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Quote, Play, Pause, Heart, MessageCircle, Send, Bookmark, Eye, MapPin, Sparkles, ExternalLink, ShieldCheck, X } from 'lucide-react';
import { REFERENCES } from '../data';

function getInstagramEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(/(?:instagram\.com)\/(?:reel|p)\/([A-Za-z0-9_-]+)/i);
  if (match && match[1]) {
    return `https://www.instagram.com/reel/${match[1]}/embed`;
  }
  return null;
}

// Mock Post Data for Scrollender Marquee (Fehrmann)
const FEHRMANN_POSTS = [
  { id: 1, title: 'Glas-Trends 2026 💎', type: 'Reel', views: '24.5k', likes: 1204, image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&auto=format&fit=crop&q=60' },
  { id: 2, title: 'Wandspiegel XXL Vorher/Nachher', type: 'Carousel', views: '18.2k', likes: 984, image: 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=400&auto=format&fit=crop&q=60' },
  { id: 3, title: 'Handwerk trifft Ästhetik ✨', type: 'Reel', views: '32.1k', likes: 2190, image: 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=400&auto=format&fit=crop&q=60' },
  { id: 4, title: 'Aura-Spiegel Produktlaunch', type: 'Carousel', views: '15.9k', likes: 780, image: 'https://images.unsplash.com/photo-1617806118233-18e1db207faf?w=400&auto=format&fit=crop&q=60' },
];

import { ClientReference } from '../types';

export default function References({ references }: { references?: ClientReference[] }) {
  const [isPlayingReel, setIsPlayingReel] = useState(false);
  const [rodizioLikes, setRodizioLikes] = useState(1342);
  const [isLiked, setIsLiked] = useState(false);
  const [progress, setProgress] = useState(30);
  const [activeModalReel, setActiveModalReel] = useState<string | null>(null);
  const [activeModalTitle, setActiveModalTitle] = useState<string>('');

  // Only display active / freigegeben references (or ones with undefined status for backwards compatibility)
  const isFallbackMode = references === undefined;
  const list = (references || REFERENCES).filter(r => r.status === 'freigegeben' || r.status === undefined);
  const spotlightList = list.filter(r => r.isSpotlight);

  const refFehrmann = spotlightList[0] || list.find(r => r.name.toLowerCase().includes('fehrmann')) || list[0] || (isFallbackMode ? REFERENCES[0] : null);
  const refRodizio = spotlightList[1] || list.find(r => r.name.toLowerCase().includes('rodizio')) || list[1] || (isFallbackMode ? REFERENCES[1] : null);
  const refMallorca = spotlightList[2] || list.find(r => r.name.toLowerCase().includes('eck')) || list[2] || (isFallbackMode ? REFERENCES[2] : null);

  // Simulate reel progress bar ticking
  useEffect(() => {
    let interval: any;
    if (isPlayingReel) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) return 0;
          return prev + 1.5;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlayingReel]);

  const handleLikeReel = () => {
    if (isLiked) {
      setRodizioLikes(prev => prev - 1);
      setIsLiked(false);
    } else {
      setRodizioLikes(prev => prev + 1);
      setIsLiked(true);
    }
  };

  return (
    <section id="referenzen" className="py-20 md:py-28 bg-brand-dark relative px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Header */}
        <div className="mb-16 text-center">
          <span className="text-xs font-mono text-[#d6c3a3] tracking-[0.25em] uppercase block mb-3">
            Kunden & Erfolge
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            Ergebnisse, die <span className="text-[#ffcc00]">für sich sprechen</span>
          </h2>
          <p className="text-[#cce9ff]/70 text-sm max-w-xl mx-auto mt-3">
            Transparente Einblicke. Echtes Kundenfeedback und repräsentative Einblicke in erfolgreiche Accounts.
          </p>
        </div>

        {/* Testimonial Spotlight - Fehrmann Glas & Design */}
        {refFehrmann && (
          <div className="mb-16">
            <div className="inline-block py-1 px-2.5 bg-accent/15 border border-accent/25 text-[#ffcc00] text-[10px] font-mono tracking-widest uppercase rounded mb-4">
              KUNDENSTIMME
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-brand-darker border-l-4 border-accent p-8 md:p-10 rounded-r-2xl relative shadow-xl overflow-hidden"
              id="testimonial-claudia-fehrmann"
            >
              {/* Design Watermark quote icon */}
              <Quote className="absolute right-6 top-6 w-36 h-36 text-[#014e7a]/20 stroke-[1.5] pointer-events-none" />

              <div className="relative z-10">
                <p className="text-[#cce9ff] text-base md:text-lg italic leading-relaxed mb-6">
                  &bdquo;{refFehrmann.testimonial?.text || 'Ich habe wenig Zeit für Social Media...'}&ldquo;
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#014e7a]/30">
                  <div className="flex items-center gap-4">
                    {refFehrmann.logoUrl ? (
                      <div className="h-16 flex items-center shrink-0">
                        <img
                          src={refFehrmann.logoUrl}
                          alt={refFehrmann.testimonial?.author || refFehrmann.name}
                          className="max-h-16 max-w-[130px] object-contain rounded-md bg-white/5 p-1"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : refFehrmann.imageUrl && refFehrmann.mediaType !== 'video' && refFehrmann.mediaType !== 'image' ? (
                      <div className="h-16 flex items-center shrink-0">
                        <img
                          src={refFehrmann.imageUrl}
                          alt={refFehrmann.testimonial?.author || refFehrmann.name}
                          className="max-h-16 max-w-[130px] object-contain rounded-md"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#002d47] border-2 border-[#014e7a] flex items-center justify-center font-display font-black text-accent uppercase shrink-0">
                        {(refFehrmann.testimonial?.author || refFehrmann.name || 'CF').split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-display font-bold text-white text-base">
                        {refFehrmann.testimonial?.author || refFehrmann.name}
                      </h4>
                      <p className="text-xs text-[#d6c3a3] font-mono uppercase tracking-wider">
                        {refFehrmann.testimonial?.role || 'Kooperationspartner'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {refFehrmann.reelLink && (
                      <button 
                        onClick={() => {
                          setActiveModalReel(refFehrmann.reelLink || null);
                          setActiveModalTitle(refFehrmann.name);
                        }}
                        className="flex items-center gap-1 text-[11px] text-black bg-[#ffcc00] hover:bg-[#e0b400] py-1.5 px-3 rounded-lg font-bold transition-all hover:scale-105 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Reel ansehen</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </button>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-accent bg-[#014e7a]/40 py-1.5 px-3 rounded-lg border border-[#014e7a]/30">
                      <ShieldCheck className="w-4 h-4 text-[#ffcc00]" />
                      <span className="font-mono uppercase tracking-wider font-semibold">Projekt: {refFehrmann.format}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Split Grid for Formats */}
        {(refFehrmann || refRodizio) && (
          <div className={refFehrmann && refRodizio ? "grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mt-12" : "max-w-2xl mx-auto mt-12"}>
            
            {/* Left Side: Fehrmann Scrolling Marquee */}
            {refFehrmann && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-display text-xl font-bold text-white uppercase tracking-wider">
                    {refFehrmann.name}: <span className="text-[#ffcc00]">{refFehrmann.format}</span>
                  </h3>
                  <p className="text-xs text-[#cce9ff]/75 leading-relaxed">
                    Beispielhafte Vorschau-Galerie aus unserer Zusammenarbeit. Diese Mischung aus edlen Inspirations-Carousels und dynamischen Handwerks-Reels lockt täglich neue Kunden an. (Bewege die Maus über die Karten, um den Fluss anzuhalten).
                  </p>
                </div>

                {/* Scrolling Marquee Slider Container */}
                <div className="relative w-full overflow-hidden border border-[#014e7a]/40 rounded-2xl bg-[#002d47]/50 p-4">
                  <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-brand-dark to-transparent z-10 pointer-events-none"></div>
                  <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-brand-dark to-transparent z-10 pointer-events-none"></div>
                  
                  <div className="flex gap-4 animate-[marquee_25s_linear_infinite] hover:[animation-play-state:paused] whitespace-nowrap">
                    {/* Render cards twice to infinite scroll */}
                    {[...FEHRMANN_POSTS, ...FEHRMANN_POSTS].map((post, index) => (
                      <div
                        key={`${post.id}-${index}`}
                        className="inline-block w-48 bg-[#004369] border border-[#014e7a] rounded-xl overflow-hidden shadow shrink-0 select-none"
                      >
                        <div className="relative h-28 bg-[#002d47] overflow-hidden">
                          <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover opacity-80"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/75 rounded text-[9px] text-[#ffcc00] font-mono tracking-wider uppercase">
                            {post.type}
                          </span>
                        </div>
                        <div className="p-3">
                          <p className="text-xs font-bold text-white truncate">{post.title}</p>
                          <div className="flex justify-between items-center mt-2.5 text-[10px] text-[#cce9ff]/60 font-mono">
                            <span className="flex items-center gap-0.5">
                              <Eye className="w-3 h-3 text-accent" />
                              {post.views}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Heart className="w-3 h-3 text-red-400" />
                              {post.likes}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Right Side: Rodizio Simulated Phone Video Post */}
            {refRodizio && (
              <div className={refFehrmann ? "" : "max-w-md mx-auto"}>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-mono text-[10px] text-[#d6c3a3] tracking-[0.2em] uppercase block">
                        {refRodizio.name}
                      </span>
                      <h3 className="font-display text-xl font-bold text-white uppercase tracking-wider">
                        {refRodizio.format}
                      </h3>
                    </div>
                  </div>
                  <p className="text-xs text-[#cce9ff]/75 leading-relaxed">
                    Hier siehst du einen repräsentativen Vorschau-Schnitt für das geplante kulinarisches Reel. Du kannst die Wiedergabe anhalten oder ein Like da lassen, um die Interaktionsrate zu testen!
                  </p>
                </div>

                {/* MOCK SMARTPHONE */}
                <div className="flex justify-center">
                  <div className="w-[310px] h-[550px] rounded-[40px] border-2 border-[#014e7a]/40 bg-black shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85)] relative overflow-hidden select-none">
                    
                    {/* HIGH-FIDELITY SMARTPHONE STATUS BAR */}
                    <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between px-5 text-[10px] font-sans font-semibold text-zinc-300 z-30 select-none">
                      <span className="tracking-tight">12:30</span>
                      
                      {/* Dynamic Island Capsule */}
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-18 h-3.5 bg-black rounded-full border border-zinc-900/30 flex items-center justify-center gap-1 z-35">
                        <div className="w-1 h-1 rounded-full bg-[#0a3147]"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-pulse"></div>
                      </div>
                      
                      {/* Status Icons */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-[#ffcc00] font-mono tracking-tighter">5G</span>
                        <div className="flex items-end gap-[1px] h-2">
                          <span className="w-[1.5px] h-[3px] bg-zinc-300 rounded-[0.5px]"></span>
                          <span className="w-[1.5px] h-[5px] bg-zinc-300 rounded-[0.5px]"></span>
                          <span className="w-[1.5px] h-[7px] bg-zinc-300 rounded-[0.5px]"></span>
                        </div>
                        <div className="w-[18px] h-[9px] border border-zinc-400/80 rounded-[2px] p-[1px] flex items-center">
                          <div className="h-full w-[85%] bg-emerald-500 rounded-[1px]"></div>
                        </div>
                      </div>
                    </div>

                    {/* Video Area (Simulated Container) */}
                    <div className="absolute inset-0 bg-zinc-950 overflow-hidden rounded-[38px]">
                      
                      {/* Photo content or actual uploaded Video background */}
                      <div className="absolute inset-0 z-0 overflow-hidden">
                        {getInstagramEmbedUrl(refRodizio.reelLink) ? (
                          <iframe
                            src={getInstagramEmbedUrl(refRodizio.reelLink)!}
                            className="absolute w-[102%] h-[calc(100%+114px)] -top-[54px] -left-[1%] border-0"
                            allowFullScreen
                            scrolling="no"
                            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                          />
                        ) : refRodizio.mediaType === 'video' && refRodizio.imageUrl ? (
                          <video
                            src={refRodizio.imageUrl}
                            className={`w-full h-full object-cover transition-opacity duration-500 ${isPlayingReel ? 'opacity-100' : 'opacity-40'}`}
                            muted
                            loop
                            playsInline
                            ref={(el) => {
                              if (el) {
                                  if (isPlayingReel) {
                                    el.play().catch(() => {});
                                  } else {
                                    el.pause();
                                  }
                              }
                            }}
                          />
                        ) : (
                          <img
                            src={refRodizio.imageUrl || "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=70"}
                            alt="Steakhouse steak"
                            className={`w-full h-full object-cover transition-opacity duration-500 ${isPlayingReel ? 'opacity-80 scale-105 saturate-110' : 'opacity-40 animate-pulse'}`}
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </div>

                      {!getInstagramEmbedUrl(refRodizio.reelLink) && (
                        <>
                          {/* Play/Pause Button Overlay */}
                          <button
                            onClick={() => setIsPlayingReel(!isPlayingReel)}
                            className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/20 hover:bg-black/30 transition-all z-10 cursor-pointer"
                            id="play-reel-button"
                          >
                            {!isPlayingReel && (
                              <div className="p-4 rounded-full bg-accent text-black scale-100 hover:scale-110 transition-transform shadow-lg">
                                <Play className="w-6 h-6 fill-current" />
                              </div>
                            )}
                          </button>

                          {/* Left Bottom Info Overlay */}
                          <div className="absolute left-4 bottom-4 z-20 text-white select-none max-w-[80%] mb-2">
                            <div className="flex items-center gap-1.5 mb-2">
                              {refRodizio.logoUrl ? (
                                <div className="h-6 flex items-center shrink-0 bg-white/10 px-1 rounded border border-accent/20">
                                  <img 
                                    src={refRodizio.logoUrl} 
                                    alt={refRodizio.name} 
                                    className="max-h-5 max-w-[50px] object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded bg-accent/25 border border-accent flex items-center justify-center font-display text-[9px] font-black shrink-0 uppercase">
                                  {(refRodizio.name || 'RO').slice(0, 2)}
                                </div>
                              )}
                              <span className="text-xs font-bold font-sans tracking-wide">{refRodizio.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '') || 'rodizio'}</span>
                            </div>
                            <p className="text-[10px] leading-tight text-white/95">
                              {refRodizio.testimonial?.text || 'Frischer Grill-Spieß direkt an deinen Tisch! 🔥🥩 Unfassbare Geschmacksexplosion bei uns. Kommt vorbei! #rodizio #barbecue #foodie'}
                            </p>
                            {refRodizio.reelLink && (
                              <a 
                                href={refRodizio.reelLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-[9px] text-[#ffcc00] font-bold hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Auf Instagram ansehen</span>
                              </a>
                            )}
                            <div className="mt-2.5 flex items-center gap-1 text-[9px] font-mono text-[#ffcc00]">
                              <Sparkles className="w-3 h-3 anim-pulse" />
                              <span>Sound von floriankusche.social</span>
                            </div>
                          </div>

                          {/* Right Side Column Buttons (Instagram Style) */}
                          <div className="absolute right-2 bottom-12 flex flex-col items-center gap-3.5 z-20">
                            <button
                              onClick={handleLikeReel}
                              className="flex flex-col items-center transition-all hover:scale-110 cursor-pointer"
                              id="like-rodizio-reel"
                            >
                              <div className={`p-2 rounded-full ${isLiked ? 'bg-red-500/25 text-red-500' : 'bg-black/45 text-white'}`}>
                                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                              </div>
                              <span className="text-[9px] text-white mt-0.5">{rodizioLikes}</span>
                            </button>

                            <div className="flex flex-col items-center">
                              <div className="p-2 rounded-full bg-black/45 text-white">
                                <MessageCircle className="w-4 h-4" />
                              </div>
                              <span className="text-[9px] text-white mt-0.5">84</span>
                            </div>

                            <div className="flex flex-col items-center">
                              <div className="p-2 rounded-full bg-black/45 text-white">
                                <Send className="w-4 h-4" />
                              </div>
                              <span className="text-[9px] text-white mt-0.5">152</span>
                            </div>

                            <div className="p-2 rounded-full bg-black/45 text-white">
                              <Bookmark className="w-4 h-4" />
                            </div>
                          </div>

                          {/* Reel Timeline Progress Bar */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800 z-20">
                            <div
                              className="h-full bg-accent transition-all duration-100 ease-linear"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </>
                      )}

                    </div>

                    {/* Indicator Details Bottom */}
                    <div className="h-6 bg-zinc-900 flex justify-center items-center">
                      <div className="w-16 h-1 rounded-full bg-zinc-700"></div>
                    </div>

                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Coming soon section - Deutsches Eck */}
        {refMallorca && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 p-6 rounded-2xl bg-[#002d47]/30 border border-[#014e7a]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden"
          >
            {refMallorca.imageUrl && (
              <div className="absolute inset-0 opacity-15 pointer-events-none">
                <img
                  src={refMallorca.imageUrl}
                  alt={refMallorca.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div className="flex items-center gap-3 relative z-10">
              <MapPin className="w-5 h-5 text-[#ffcc00] shrink-0" />
              <div className="relative z-10">
                <span className="text-[10px] font-mono text-[#d6c3a3] uppercase tracking-wider block">
                  {refMallorca.format || 'IN ABSTIMMUNG VOR ORT'}
                </span>
                <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                  {refMallorca.name || 'Deutsches Eck, Mallorca'}
                </h4>
              </div>
            </div>
          </motion.div>
        )}

        {/* Dynamic hand-added further references */}
        {(() => {
          const gridReferences = list.filter(r => r !== refFehrmann && r !== refRodizio && r !== refMallorca);
          if (gridReferences.length === 0) return null;

          return (
            <div className="mt-16 space-y-8">
              <div className="text-center">
                <span className="text-xs font-mono text-[#d6c3a3] tracking-[0.25em] uppercase block mb-3">
                  Zusätzliche Einblicke
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                  Weitere <span className="text-[#ffcc00]">Erfolgsgeschichten</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gridReferences.map((ref, idx) => {
                  const initials = (ref.testimonial?.author || ref.name || 'R')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      className="bg-brand-darker border border-[#014e7a]/30 rounded-2xl p-6 flex flex-col justify-between shadow-lg hover:border-accent hover:shadow-[#014e7a]/20 transition-all duration-300"
                    >
                      <div className="space-y-4">
                        {/* Optional Image or Video */}
                        {ref.imageUrl ? (
                          <div className="w-full h-44 bg-zinc-950 rounded-xl overflow-hidden mb-4 border border-[#014e7a]/20 relative group">
                            {ref.mediaType === 'video' ? (
                              <video
                                src={ref.imageUrl}
                                className="w-full h-full object-cover"
                                muted
                                loop
                                playsInline
                                controls
                              />
                            ) : (
                              <img
                                src={ref.imageUrl}
                                alt={ref.name}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            {ref.reelLink && (
                              <button
                                onClick={() => {
                                  setActiveModalReel(ref.reelLink || null);
                                  setActiveModalTitle(ref.name);
                                }}
                                className="absolute bottom-2 right-2 p-1.5 bg-black/85 hover:bg-black text-[#ffcc00] rounded-lg border border-[#ffcc00]/20 flex items-center gap-1 text-[10px] font-mono font-semibold opacity-90 hover:opacity-100 transition-opacity z-10 shadow cursor-pointer"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>Reel</span>
                                <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          ref.reelLink ? (
                            <div className="mb-4">
                              <button
                                onClick={() => {
                                  setActiveModalReel(ref.reelLink || null);
                                  setActiveModalTitle(ref.name);
                                }}
                                className="w-full h-24 bg-[#002d47]/40 border border-[#014e7a]/30 hover:border-accent rounded-xl flex flex-col items-center justify-center text-center p-3 gap-1 transition-all cursor-pointer"
                              >
                                <Play className="w-5 h-5 text-[#ffcc00] fill-current animate-pulse mb-1" />
                                <span className="text-[10px] font-mono text-[#cce9ff]/80">Instagram Reel</span>
                                <span className="text-xs font-bold text-white hover:underline flex items-center gap-1">
                                  Reel ansehen <ExternalLink className="w-3 h-3" />
                                </span>
                              </button>
                            </div>
                          ) : (
                            <div className="w-full h-1 bg-gradient-to-r from-accent/50 to-transparent rounded mb-4" />
                          )
                        )}

                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <h4 className="font-display font-bold text-white text-base truncate">
                              {ref.name}
                            </h4>
                            <span className="text-[10px] font-mono text-[#d6c3a3] uppercase tracking-wider block mt-0.5 truncate">
                              Projekt: {ref.format}
                            </span>
                          </div>

                        </div>

                        {ref.testimonial?.text && (
                          <p className="text-[#cce9ff]/80 text-xs italic leading-relaxed pt-2 border-t border-[#014e7a]/25">
                            &bdquo;{ref.testimonial.text}&ldquo;
                          </p>
                        )}
                      </div>

                      {/* Author Profile Footer with visible recognizable Logo in Originalgrösse */}
                      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#014e7a]/25">
                        {ref.logoUrl ? (
                          <div className="h-12 flex items-center shrink-0">
                            <img 
                              src={ref.logoUrl} 
                              alt={ref.testimonial?.author || ref.name} 
                              className="max-h-12 max-w-[110px] object-contain rounded bg-white/5 p-0.5" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : ref.imageUrl && ref.mediaType !== 'video' && ref.mediaType !== 'image' ? (
                          <div className="h-12 flex items-center shrink-0">
                            <img 
                              src={ref.imageUrl} 
                              alt={ref.testimonial?.author || ref.name} 
                              className="max-h-12 max-w-[110px] object-contain rounded" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-[#002d47] border-2 border-[#014e7a] flex items-center justify-center overflow-hidden shrink-0 shadow">
                            <div className="text-accent font-display font-black text-xs uppercase flex items-center justify-center h-full w-full bg-[#002d47]">
                              {initials}
                            </div>
                          </div>
                        )}
                        <div className="min-w-0 flex-1 ml-1">
                          <p className="text-xs font-bold text-white truncate">
                            {ref.testimonial?.author || ref.name}
                          </p>
                          <p className="text-[10px] text-[#d6c3a3] font-mono uppercase tracking-wider truncate">
                            {ref.testimonial?.role || 'Kooperationspartner'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Reel Modal Overlay */}
        {activeModalReel && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="relative max-w-full">
              {/* Close Button */}
              <button 
                onClick={() => setActiveModalReel(null)}
                className="absolute -top-12 right-0 text-white hover:text-accent flex items-center gap-1 text-sm font-bold bg-white/10 hover:bg-white/20 py-1.5 px-3 rounded-full cursor-pointer transition-all"
              >
                <span>Schließen</span>
                <X className="w-4 h-4" />
              </button>

              <div className="bg-[#001f33] border border-[#014e7a]/40 rounded-3xl p-6 text-center max-w-[340px] flex flex-col items-center shadow-2xl relative">
                <h4 className="font-display font-black text-white text-sm mb-4 uppercase tracking-wider truncate w-full">
                  {activeModalTitle} <span className="text-[#ffcc00]">Reel</span>
                </h4>

                {/* Mock Smartphone Inside Modal */}
                <div className="w-[310px] h-[550px] rounded-[40px] border-2 border-[#014e7a]/40 bg-black shadow-2xl relative overflow-hidden select-none">
                  
                  {/* HIGH-FIDELITY SMARTPHONE STATUS BAR */}
                  <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between px-5 text-[10px] font-sans font-semibold text-zinc-300 z-30 select-none">
                    <span className="tracking-tight">12:30</span>
                    
                    {/* Dynamic Island Capsule */}
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-18 h-3.5 bg-black rounded-full border border-zinc-900/30 flex items-center justify-center gap-1 z-35">
                      <div className="w-1 h-1 rounded-full bg-[#0a3147]"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-pulse"></div>
                    </div>
                    
                    {/* Status Icons */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-[#ffcc00] font-mono tracking-tighter">5G</span>
                      <div className="flex items-end gap-[1px] h-2">
                        <span className="w-[1.5px] h-[3px] bg-zinc-300 rounded-[0.5px]"></span>
                        <span className="w-[1.5px] h-[5px] bg-zinc-300 rounded-[0.5px]"></span>
                        <span className="w-[1.5px] h-[7px] bg-zinc-300 rounded-[0.5px]"></span>
                      </div>
                      <div className="w-[18px] h-[9px] border border-zinc-400/80 rounded-[2px] p-[1px] flex items-center">
                        <div className="h-full w-[85%] bg-emerald-500 rounded-[1px]"></div>
                      </div>
                    </div>
                  </div>

                  {/* Reel Embed Area */}
                  <div className="absolute inset-0 bg-zinc-950 overflow-hidden rounded-[38px]">
                    {getInstagramEmbedUrl(activeModalReel) ? (
                      <iframe
                        src={getInstagramEmbedUrl(activeModalReel)!}
                        className="absolute w-[102%] h-[calc(100%+114px)] -top-[54px] -left-[1%] border-0"
                        allowFullScreen
                        scrolling="no"
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#002d47]">
                        <p className="text-sm text-white font-bold mb-2">Reel nicht einbettbar</p>
                        <p className="text-xs text-[#cce9ff]/70 mb-4">Dieser Link kann nicht direkt hier abgespielt werden.</p>
                        <a 
                          href={activeModalReel}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-black bg-[#ffcc00] py-2 px-4 rounded-xl font-bold hover:scale-105 transition-all"
                        >
                          Auf Instagram öffnen
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer link in modal */}
                <a 
                  href={activeModalReel}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#ffcc00] font-bold hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Direkt auf Instagram ansehen</span>
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
