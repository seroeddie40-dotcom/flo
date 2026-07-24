import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Quote, Play, Pause, Heart, MessageCircle, Send, Sparkles, ExternalLink, ShieldCheck, X, Image, Instagram, Smartphone, Film, Camera } from 'lucide-react';
import { REFERENCES } from '../data';
import { ClientReference } from '../types';
import { resolveChunkedUrl } from '../lib/firebase';

function getInstagramEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed === "") return null;
  const match = trimmed.match(/(?:instagram\.com|instagr\.am)\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i);
  if (match && match[1]) {
    return `https://www.instagram.com/reel/${match[1]}/embed/`;
  }
  return null;
}

interface ReferenceCardProps {
  key?: any;
  refData: ClientReference;
  idx: number;
  onOpenModal: (url: string, title: string) => void;
}

function ReferenceCard({ refData, idx, onOpenModal }: ReferenceCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(742 + idx * 87);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.duration) {
      setProgress((video.currentTime / video.duration) * 100);
    }
  };

  useEffect(() => {
    let interval: any;
    // Only use animated timer fallback if we have no video element or it has no duration (e.g. for images/embeds)
    if (isPlaying && (!videoRef.current || isNaN(videoRef.current.duration) || videoRef.current.duration === 0)) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) return 0;
          return prev + 1.5;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (isPlaying) {
        video.play().catch(err => {
          console.warn('Video playback failed:', err);
        });
      } else {
        video.pause();
      }
    }
  }, [isPlaying, refData.imageUrl]);

  const handleLike = () => {
    if (isLiked) {
      setLikesCount(prev => prev - 1);
      setIsLiked(false);
    } else {
      setLikesCount(prev => prev + 1);
      setIsLiked(true);
    }
  };

  const initials = (refData.testimonial?.author || refData.name || 'CF')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isLinkDisplay = refData.videoDisplayMode === 'link';
  const embedUrl = isLinkDisplay ? null : getInstagramEmbedUrl(refData.reelLink);
  const showUploadedVideo = !isLinkDisplay && refData.mediaType === 'video' && !!refData.imageUrl;
  const showUploadedImage = refData.mediaType === 'image' && !!refData.imageUrl;
  const showUploadedMedia = showUploadedVideo || showUploadedImage;

  return (
    <div className="border-b border-[#014e7a]/20 pb-24 last:border-b-0 last:pb-0">
      {/* 1. KUNDENSTIMME BLOCK */}
      <div className="inline-block py-1 px-2.5 bg-accent/15 border border-accent/25 text-[#ffcc00] text-[10px] font-mono tracking-widest uppercase rounded mb-4">
        REFERENZ {idx + 1}: {refData.name}
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-[#001726] border-l-4 border-accent p-8 md:p-10 rounded-r-2xl relative shadow-xl overflow-hidden mb-12"
      >
        <Quote className="absolute right-6 top-6 w-36 h-36 text-[#014e7a]/15 stroke-[1.5] pointer-events-none" />

        <div className="relative z-10">
          {refData.testimonial?.text ? (
            <p className="text-[#cce9ff] text-base md:text-lg italic leading-relaxed mb-6">
              &bdquo;{refData.testimonial.text}&ldquo;
            </p>
          ) : (
            <p className="text-[#cce9ff]/60 text-sm italic mb-6">Kein Empfehlungstext hinterlegt.</p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#014e7a]/30">
            <div className="flex items-center gap-4">
              {refData.logoUrl ? (
                <div className="h-16 flex items-center shrink-0">
                  <img
                    src={resolveChunkedUrl(refData.logoUrl, 'image')}
                    alt={refData.testimonial?.author || refData.name}
                    className="max-h-16 max-w-[130px] object-contain rounded-md bg-white/5 p-1"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-[#002d47] border-2 border-[#014e7a] flex items-center justify-center font-display font-black text-accent uppercase shrink-0">
                  {initials}
                </div>
              )}
              <div>
                <h4 className="font-display font-bold text-white text-base">
                  {refData.testimonial?.author || refData.name}
                </h4>
                <p className="text-xs text-[#d6c3a3] font-mono uppercase tracking-wider">
                  {refData.testimonial?.role || refData.format || 'Kooperationspartner'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-accent bg-[#014e7a]/40 py-1.5 px-3 rounded-lg border border-[#014e7a]/30">
                <ShieldCheck className="w-4 h-4 text-[#ffcc00]" />
                <span className="font-mono uppercase tracking-wider font-semibold">Format: {refData.format}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. MEDIA GRID: PHONE MOCK + BEITRAGSBILDER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Embedded Reel / Phone Mock Block */}
        <div className={`col-span-1 lg:col-span-6 flex flex-col items-center ${
          (refData.reelPosition || 'left') === 'right' ? 'lg:order-last' : 'lg:order-first'
        }`}>
          <div className="space-y-4 w-full max-w-[310px]">
            <div className="text-center">
              <span className="font-mono text-[10px] text-accent tracking-[0.2em] uppercase block">
                {refData.highlightReelTitle || 'REEL-PLAYER'}
              </span>
              <h3 className="font-display text-base font-bold text-white uppercase tracking-wider mt-1">
                {isLinkDisplay ? 'Reel-Link' : 'Eingebettetes Reel'}
              </h3>
            </div>

            {/* Clean Video Player */}
            <div className="w-[310px] h-[550px] rounded-2xl border border-[#014e7a]/20 bg-black shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85)] relative overflow-hidden select-none mx-auto">
              
              {/* Video / Embed Content */}
              <div className="absolute inset-0 bg-zinc-950 overflow-hidden rounded-2xl">
                {isLinkDisplay && refData.reelLink ? (
                  <div className="absolute inset-0 bg-[#001c2e] flex flex-col items-center justify-between p-6 text-center select-none">
                    {/* Background decoration or poster image if available */}
                    {refData.imageUrl ? (
                      <img
                        src={resolveChunkedUrl(refData.imageUrl, 'image')}
                        alt={refData.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-35"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#f09433]/15 via-[#e6683c]/15 to-[#bc1888]/15" />
                    )}
                    
                    {/* Top Brand Tag */}
                    <div className="relative z-10 w-full flex items-center justify-between border-b border-white/10 pb-3 mt-4">
                      <span className="text-[10px] font-mono text-[#ffcc00] tracking-wider uppercase">Instagram Reel</span>
                      <Instagram className="w-4 h-4 text-white/60" />
                    </div>

                    {/* Middle Call-To-Action */}
                    <div className="relative z-10 my-auto flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center text-white shadow-lg animate-pulse">
                        <Play className="w-7 h-7 fill-current ml-1 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm mb-1">{refData.name}</h4>
                        <p className="text-xs text-white/60 leading-relaxed max-w-[200px] mx-auto">
                          Dieses Reel ist als externer Link hinterlegt. Klicke, um es direkt anzusehen.
                        </p>
                      </div>
                    </div>

                    {/* Bottom CTA Button */}
                    <a
                      href={refData.reelLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative z-10 w-full py-3 px-4 bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#bc1888] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-md mb-2"
                    >
                      <span>Reel auf Instagram öffnen</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : showUploadedVideo ? (
                  <div className="absolute inset-0 z-0 bg-[#001c2e] flex items-center justify-center">
                    <video
                      src={resolveChunkedUrl(refData.imageUrl, 'video')}
                      className={`w-full h-full object-cover transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-40'}`}
                      muted
                      loop
                      playsInline
                      ref={videoRef}
                      onTimeUpdate={handleTimeUpdate}
                    />
                  </div>
                ) : showUploadedImage ? (
                  <div className="absolute inset-0 z-0 bg-[#001c2e] flex items-center justify-center">
                    <img
                      src={resolveChunkedUrl(refData.imageUrl, 'image')}
                      alt={refData.name}
                      className={`w-full h-full object-cover transition-opacity duration-500 ${isPlaying ? 'opacity-80 scale-105 saturate-110' : 'opacity-40'}`}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : embedUrl ? (
                  <div className="absolute inset-0 z-0 bg-black">
                    <iframe
                      src={embedUrl}
                      className="absolute w-[102%] h-[calc(100%+114px)] -top-[54px] -left-[1%] border-0"
                      allowFullScreen
                      scrolling="no"
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      title={`Reel embed ${refData.name}`}
                      loading="lazy"
                    />
                  </div>
                ) : refData.imageUrl ? (
                  <div className="absolute inset-0 z-0 bg-[#001c2e] flex items-center justify-center">
                    {refData.imageUrl.includes('video') || refData.imageUrl.startsWith('data:video/') || refData.imageUrl.endsWith('.mp4') ? (
                      <video
                        src={resolveChunkedUrl(refData.imageUrl, 'video')}
                        className={`w-full h-full object-cover transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-40'}`}
                        muted
                        loop
                        playsInline
                        ref={videoRef}
                        onTimeUpdate={handleTimeUpdate}
                      />
                    ) : (
                      <img
                        src={resolveChunkedUrl(refData.imageUrl, 'image')}
                        alt={refData.name}
                        className={`w-full h-full object-cover transition-opacity duration-500 ${isPlaying ? 'opacity-80 scale-105 saturate-110' : 'opacity-40'}`}
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-0 z-0 bg-[#001c2e] flex flex-col items-center justify-center p-6 text-center select-none">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent/40 mb-2 border border-accent/20">
                      <Play className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-[#cce9ff]/60 font-semibold uppercase font-mono">Kein Video hinterlegt</span>
                  </div>
                )}

                {/* Play button overlay (Only for direct video/images, not for iframes) */}
                {(showUploadedMedia || (!isLinkDisplay && !embedUrl && refData.imageUrl)) && (
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/20 hover:bg-black/30 transition-all z-10 cursor-pointer border-0"
                  >
                    {!isPlaying && (
                      <div className="p-4 rounded-full bg-accent text-black scale-100 hover:scale-110 transition-transform shadow-lg">
                        <Play className="w-6 h-6 fill-current" />
                      </div>
                    )}
                    {isPlaying && (
                      <div className="p-4 rounded-full bg-black/40 text-white scale-100 hover:scale-110 transition-transform opacity-0 hover:opacity-100 duration-300">
                        <Pause className="w-6 h-6 fill-current" />
                      </div>
                    )}
                  </button>
                )}
              </div>

              {/* Smartphone Like Panel Overlay (Only for direct video/images, not for iframes) */}
              {(showUploadedMedia || (!isLinkDisplay && !embedUrl && refData.imageUrl)) && (
                <>
                  {/* Information Block Overlay */}
                  <div className="absolute left-4 bottom-4 z-20 text-white select-none max-w-[80%] mb-2 text-left">
                    <div className="flex items-center gap-1.5 mb-2">
                      {refData.logoUrl ? (
                        <div className="h-6 flex items-center shrink-0 bg-white/10 px-1 rounded border border-accent/20">
                          <img 
                            src={resolveChunkedUrl(refData.logoUrl, 'image')} 
                            alt={refData.name} 
                            className="max-h-5 max-w-[50px] object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded bg-accent/25 border border-accent flex items-center justify-center font-display text-[9px] font-black shrink-0 uppercase">
                          {refData.name.slice(0, 2)}
                        </div>
                      )}
                      <span className="text-xs font-bold font-sans tracking-wide">
                        {refData.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')}
                      </span>
                    </div>
                    <p className="text-[10px] leading-tight text-white/95 line-clamp-3">
                      {refData.highlightReelText || refData.testimonial?.text || 'Instagram Reels Strategie & Content Kreation.'}
                    </p>
                    <div className="mt-2.5 flex items-center gap-1 text-[9px] font-mono text-[#ffcc00]">
                      <Sparkles className="w-3 h-3 animate-pulse" />
                      <span>Sound von floriankusche.social</span>
                    </div>
                  </div>

                  {/* Column of buttons on the right side */}
                  <div className="absolute right-2 bottom-12 flex flex-col items-center gap-3.5 z-20">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike();
                      }}
                      className="flex flex-col items-center transition-all hover:scale-110 cursor-pointer bg-transparent border-0"
                    >
                      <div className={`p-2 rounded-full ${isLiked ? 'bg-red-500/25 text-red-500' : 'bg-black/45 text-white'}`}>
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                      </div>
                      <span className="text-[9px] text-white mt-0.5">{likesCount}</span>
                    </button>

                    <div className="flex flex-col items-center">
                      <div className="p-2 rounded-full bg-black/45 text-white">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] text-white mt-0.5">38</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="p-2 rounded-full bg-black/45 text-white">
                        <Send className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] text-white mt-0.5">14</span>
                    </div>
                  </div>

                  {/* High-Fidelity Instagram-style Bottom Progress Bar */}
                  <div className="absolute bottom-2 left-4 right-4 h-[2px] bg-white/20 rounded overflow-hidden z-25">
                    <div 
                      className="h-full bg-accent transition-all duration-100 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Beitragsbilder, Reels & Storys Block */}
        <div className="col-span-1 lg:col-span-6 space-y-4">
          <div className="text-center lg:text-left">
            <span className="font-mono text-[10px] text-accent tracking-[0.2em] uppercase block">
              INSTAGRAM CONTENT
            </span>
            <h3 className="font-display text-xl font-bold text-white uppercase tracking-wider">
              Beiträge, Reels & Storys
            </h3>
            <p className="text-xs text-[#cce9ff]/75 leading-relaxed max-w-md mx-auto lg:mx-0 mt-1">
              Klicke auf eine Story, ein Reel oder einen Beitrag, um direkt zum entsprechenden Originalinhalt auf Instagram zu gelangen.
            </p>
          </div>

          {(!refData.postImages || refData.postImages.length === 0) ? (
            <div className="p-8 rounded-2xl bg-[#002d47]/30 border border-dashed border-[#014e7a]/40 text-center flex flex-col items-center justify-center">
              <Image className="w-8 h-8 text-[#014e7a]/60 mb-2" />
              <p className="text-xs text-[#cce9ff]/50">Keine Instagram-Inhalte hochgeladen.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0">
              {refData.postImages.map((img, imgIdx) => {
                const itemType = img.type || 'post';

                return (
                  <motion.a
                    key={imgIdx}
                    href={img.instagramLink || refData.reelLink || 'https://instagram.com/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-square bg-[#001c2e] border border-[#014e7a]/30 rounded-2xl overflow-hidden shadow-lg block hover:border-accent hover:shadow-[#014e7a]/45 transition-all duration-300"
                    whileHover={{ scale: 1.03 }}
                  >
                    {img.imageUrl ? (
                      <img
                        src={resolveChunkedUrl(img.imageUrl)}
                        alt={img.title || `Instagram Inhalt von ${refData.name}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#002d47]/60">
                        <Image className="w-8 h-8 text-white/20" />
                      </div>
                    )}

                    {/* Permanent Format Badge in Top Left */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-white shadow-md backdrop-blur-md ${
                        itemType === 'story'
                          ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 border border-rose-400/40'
                          : itemType === 'reel'
                          ? 'bg-purple-600/90 border border-purple-400/40'
                          : 'bg-[#0073aa]/90 border border-blue-400/40'
                      }`}>
                        {itemType === 'story' && <Smartphone className="w-2.5 h-2.5" />}
                        {itemType === 'reel' && <Film className="w-2.5 h-2.5" />}
                        {itemType === 'post' && <Camera className="w-2.5 h-2.5" />}
                        <span>{itemType === 'story' ? 'STORY' : itemType === 'reel' ? 'REEL' : 'BEITRAG'}</span>
                      </span>
                    </div>

                    {/* Optional Title Label at Bottom if provided */}
                    {img.title && (
                      <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-30">
                        <p className="text-[10px] font-semibold text-white/90 truncate px-1">
                          {img.title}
                        </p>
                      </div>
                    )}
                    
                    {/* Hover Overlay with Link icon and Action indicator */}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-all duration-300 z-20 p-2 text-center">
                      <div className="p-2 rounded-full bg-accent text-black shadow">
                        <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      {img.title ? (
                        <p className="text-xs font-bold text-white line-clamp-2 px-1">
                          {img.title}
                        </p>
                      ) : null}
                      <span className="text-[10px] font-bold text-accent uppercase tracking-widest font-sans">
                        Auf Instagram ansehen
                      </span>
                    </div>
                  </motion.a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. DYNAMISCHE 3D-STATISTIK-GRAFIK (IF ENABLED) */}
      {refData.showStats && refData.stats && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-[#002d47]/20 border border-[#014e7a]/20 rounded-3xl p-6 sm:p-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="col-span-1 lg:col-span-4 space-y-2 text-center lg:text-left">
              <span className="font-mono text-[10px] text-accent tracking-[0.2em] uppercase block">
                Echte Live-Zahlen
              </span>
              <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                {refData.sichtbarkeitTitle || 'Sichtbarkeit & Reichweite'}
              </h3>
              <p className="text-xs text-[#cce9ff]/75 leading-relaxed">
                {refData.sichtbarkeitText || 'Unsere gezielte, datengetriebene organische Reichweiten-Strategie führt zu signifikantem Wachstum in deiner Zielgruppe.'}
              </p>
            </div>

            <div className="col-span-1 lg:col-span-8">
              <div className="relative bg-gradient-to-b from-[#0f4b73]/60 via-[#013554]/60 to-[#001f33]/60 border border-[#014e7a]/40 rounded-2xl p-6 overflow-hidden shadow-2xl flex flex-col items-center justify-between min-h-[280px]">
                
                {/* Grid Lines */}
                <div className="absolute inset-x-0 bottom-12 top-10 flex flex-col justify-between pointer-events-none opacity-5">
                  <div className="h-[1px] bg-white w-full"></div>
                  <div className="h-[1px] bg-white w-full"></div>
                  <div className="h-[1px] bg-white w-full"></div>
                </div>

                {/* Upward Winding Arrow */}
                <svg
                  viewBox="0 0 500 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-35"
                >
                  <path
                    d="M 50,150 Q 150,50 250,110 T 450,50"
                    stroke="#22c55e"
                    strokeWidth="8"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 440,45 L 455,48 L 448,65 Z"
                    fill="#22c55e"
                  />
                </svg>

                {/* Columns */}
                <div className="relative z-20 flex justify-around items-end w-full h-[180px] gap-4">
                  {/* Col 1 */}
                  <div className="flex flex-col items-center w-[28%] justify-end">
                    <span className="text-[#93c5fd] font-display text-xs sm:text-sm font-black mb-1">
                      {refData.stats.aufrufe || '+ 270 %'}
                    </span>
                    <div className="w-full bg-gradient-to-t from-[#1d4ed8] via-[#2563eb] to-[#60a5fa] rounded-2xl h-[55%] relative shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] border border-[#3b82f6]/40 flex items-center justify-center">
                      <span className="font-display font-black text-[9px] text-[#002d47]/80 uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 py-2 select-none">
                        AUFRUFE
                      </span>
                    </div>
                  </div>

                  {/* Col 2 */}
                  <div className="flex flex-col items-center w-[28%] justify-end">
                    <span className="text-[#7ff2db] font-display text-xs sm:text-sm font-black mb-1">
                      {refData.stats.reichweite || '+ 2.000 %'}
                    </span>
                    <div className="w-full bg-gradient-to-t from-[#0f766e] via-[#0d9488] to-[#2dd4bf] rounded-2xl h-[78%] relative shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] border border-[#14b8a6]/40 flex items-center justify-center">
                      <span className="font-display font-black text-[9px] text-[#002d47]/80 uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 py-2 select-none">
                        REICHWEITE
                      </span>
                    </div>
                  </div>

                  {/* Col 3 */}
                  <div className="flex flex-col items-center w-[28%] justify-end">
                    <span className="text-[#a7f3d0] font-display text-xs sm:text-sm font-black mb-1">
                      {refData.stats.interaktion || '+ 9.000 %'}
                    </span>
                    <div className="w-full bg-gradient-to-t from-[#047857] via-[#10b981] to-[#34d399] rounded-2xl h-[95%] relative shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] border border-[#10b981]/40 flex items-center justify-center">
                      <span className="font-display font-black text-[9px] text-[#002d47]/80 uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 py-2 select-none">
                        INTERAKTION
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function References({ 
  references, 
  fehrmannStats 
}: { 
  references?: ClientReference[]; 
  fehrmannStats?: { 
    aufrufe: string; 
    reichweite: string; 
    interaktion: string; 
    reelLink?: string;
    highlightReelTitle?: string;
    highlightReelText?: string;
    sichtbarkeitTitle?: string;
    sichtbarkeitText?: string;
    videoType?: 'reel' | 'uploaded';
    uploadedVideoUrl?: string;
  };
}) {
  const [activeModalReel, setActiveModalReel] = useState<string | null>(null);
  const [activeModalTitle, setActiveModalTitle] = useState<string>('');

  const list = (references || REFERENCES).map(r => {
    if (r.name === 'Fehrmann Glas & Design') {
      const stats = fehrmannStats || {
        aufrufe: '+ 270 %',
        reichweite: '+ 2.000 %',
        interaktion: '+ 9.000 %',
        videoType: 'uploaded' as 'reel' | 'uploaded',
        uploadedVideoUrl: 'https://uchdjdmdzuvsgqhlczwk.supabase.co/storage/v1/object/public/public%20media/Glasvordach_x264%20(1).mp4',
        reelLink: 'https://www.instagram.com/reel/DaS9nyUMUEg/',
        highlightReelTitle: 'HIGHLIGHT-REEL',
        highlightReelText: 'Dieses Reel demonstriert die faszinierende Ästhetik von handgefertigtem Glas und modernem Design. Klicke auf Play, um das Video zu starten, oder teste das Like-System!',
        sichtbarkeitTitle: 'Sichtbarkeit & Reichweite',
        sichtbarkeitText: 'Unsere datengetriebene Reels-Strategie sorgt für überproportionales Wachstum in der Zielgruppe. Die Zahlenwerte passen sich dynamisch an.',
      };
      const isReel = (stats.videoType || 'uploaded') === 'reel';
      const videoUrl = stats.uploadedVideoUrl || 'https://uchdjdmdzuvsgqhlczwk.supabase.co/storage/v1/object/public/public%20media/Glasvordach_x264%20(1).mp4';
      return {
        ...r,
        reelLink: isReel ? (stats.reelLink || r.reelLink) : undefined,
        imageUrl: isReel ? r.imageUrl : videoUrl,
        mediaType: isReel ? r.mediaType : 'video',
        videoDisplayMode: isReel ? r.videoDisplayMode : 'embedded',
        stats: {
          aufrufe: stats.aufrufe || r.stats?.aufrufe || '+ 270 %',
          reichweite: stats.reichweite || r.stats?.reichweite || '+ 2.000 %',
          interaktion: stats.interaktion || r.stats?.interaktion || '+ 9.000 %',
        },
        highlightReelTitle: stats.highlightReelTitle || 'HIGHLIGHT-REEL',
        highlightReelText: stats.highlightReelText || 'Dieses Reel demonstriert die faszinierende Ästhetik von handgefertigtem Glas und modernem Design. Klicke auf Play, um das Video zu starten, oder teste das Like-System!',
        sichtbarkeitTitle: stats.sichtbarkeitTitle || 'Sichtbarkeit & Reichweite',
        sichtbarkeitText: stats.sichtbarkeitText || 'Unsere datengetriebene Reels-Strategie sorgt für überproportionales Wachstum in der Zielgruppe. Die Zahlenwerte passen sich dynamisch an.',
      } as ClientReference;
    }
    return r;
  }).filter(r => r.status === 'freigegeben' || r.status === undefined);

  const handleOpenModal = (url: string, title: string) => {
    setActiveModalReel(url);
    setActiveModalTitle(title);
  };

  const handleCloseModal = () => {
    setActiveModalReel(null);
    setActiveModalTitle('');
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

        {/* Dynamic References List */}
        <div className="space-y-32">
          {list.map((ref, index) => (
            <ReferenceCard
              key={index}
              refData={ref}
              idx={index}
              onOpenModal={handleOpenModal}
            />
          ))}
        </div>

        {/* Instagram Reels Modal Overlay */}
        {activeModalReel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none bg-black/90 backdrop-blur-md">
            <div className="absolute inset-0 cursor-pointer" onClick={handleCloseModal} />
            
            <div className="relative bg-[#001c2e] border border-[#014e7a]/40 rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl z-10 p-5">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#014e7a]/30 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#ffcc00] animate-pulse"></div>
                  <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider truncate max-w-[200px]">
                    {activeModalTitle || 'Instagram Reel'}
                  </h3>
                </div>
                <button 
                  onClick={handleCloseModal}
                  className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer border-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Embedded Player */}
              <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center py-2">
                <div className="w-[280px] h-[500px] rounded-2xl border border-[#014e7a]/30 bg-black shadow-2xl relative overflow-hidden flex items-center justify-center shrink-0">
                  
                  {/* Reel Embed Area */}
                  <div className="absolute inset-0 bg-zinc-950 overflow-hidden rounded-2xl">
                    {getInstagramEmbedUrl(activeModalReel) ? (
                      <iframe
                        src={getInstagramEmbedUrl(activeModalReel)!}
                        className="absolute w-[102%] h-[calc(100%+114px)] -top-[54px] -left-[1%] border-0"
                        allowFullScreen
                        scrolling="no"
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                        title={`Modal Reel ${activeModalTitle}`}
                        loading="lazy"
                      />
                    ) : (activeModalReel.startsWith('data:video/') || activeModalReel.startsWith('chunked://') || activeModalReel.endsWith('.mp4') || activeModalReel.endsWith('.mov') || activeModalReel.endsWith('.webm') || activeModalReel.includes('video')) ? (
                      <video
                        src={resolveChunkedUrl(activeModalReel, 'video')}
                        className="w-full h-full object-cover"
                        controls
                        autoPlay
                        playsInline
                        loop
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#002d47]">
                        <p className="text-sm text-white font-bold mb-2">Inhalt nicht einbettbar</p>
                        <p className="text-xs text-[#cce9ff]/70 mb-4">Dieser Link kann nicht direkt hier abgespielt werden.</p>
                        <a 
                          href={activeModalReel}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-black bg-[#ffcc00] py-2 px-4 rounded-xl font-bold hover:scale-105 transition-all"
                        >
                          Öffnen
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer link in modal */}
                <div className="mt-4 flex flex-col items-center gap-2 text-center">
                  <a 
                    href={activeModalReel}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#ffcc00] font-bold hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Direkt auf Instagram ansehen</span>
                  </a>
                  <p className="text-[10px] text-[#cce9ff]/60 max-w-[280px] leading-relaxed">
                    Hinweis: Falls die Video-Wiedergabe durch Browser-Filter blockiert wird, klicke auf den Link oben, um das Reel direkt auf Instagram anzusehen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
