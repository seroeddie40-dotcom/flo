import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { FileText, Download, Check, Sparkles, Eye, X, Copy, ExternalLink, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { OnePagerConfig } from '../types';
import { reconstructChunkedString } from '../lib/firebase';

export default function OnePagerMockup({ config }: { config?: OnePagerConfig }) {
  const [downloaded, setDownloaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string>('');
  const [pdfjs, setPdfjs] = useState<any>(null);
  const [isPdfjsLoading, setIsPdfjsLoading] = useState(false);

  useEffect(() => {
    if (isViewerOpen && !pdfjs && !isPdfjsLoading) {
      setIsPdfjsLoading(true);
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
      script.async = true;
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        if (pdfjsLib) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
          setPdfjs(pdfjsLib);
        }
        setIsPdfjsLoading(false);
      };
      script.onerror = (err) => {
        console.error('Failed to load PDF.js script', err);
        setIsPdfjsLoading(false);
      };
      document.head.appendChild(script);
    }
  }, [isViewerOpen, pdfjs, isPdfjsLoading]);

  useEffect(() => {
    let active = true;
    let localBlobUrl = '';

    if (!config?.documentUrl) {
      setViewerUrl('');
      return;
    }

    const loadViewerUrl = async () => {
      let url = config.documentUrl;
      if (url.startsWith('chunked://')) {
        try {
          url = await reconstructChunkedString(url);
        } catch (err) {
          console.error('Failed to reconstruct chunked URL for viewer:', err);
        }
      }

      if (!active) return;

      if (url.startsWith('data:')) {
        try {
          const parts = url.split(',');
          const mimeMatch = parts[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
          // Clean base64 for atob safety
          const base64Clean = parts[1].replace(/\s/g, '');
          const bstr = atob(base64Clean);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mime });
          localBlobUrl = URL.createObjectURL(blob);
          if (active) {
            setViewerUrl(localBlobUrl);
          }
        } catch (err) {
          console.error('Error generating blob URL for preview:', err);
          if (active) setViewerUrl(url);
        }
      } else {
        if (active) setViewerUrl(url);
      }
    };

    loadViewerUrl();

    return () => {
      active = false;
      if (localBlobUrl) {
        URL.revokeObjectURL(localBlobUrl);
      }
    };
  }, [config?.documentUrl]);

  // Fallbacks if database contains no elements yet
  const eyebrow = config?.eyebrow || 'STRATEGIE-AUFBAU';
  const ownerName = config?.ownerName || 'FLORIAN KUSCHE';
  const title = config?.title || 'INSTAGRAM ERFOLGS-FAHRPLAN';
  const description = config?.description || 'Der exakte Blueprint, mit dem ich deinen Account aufbaue und pflege, um konstante Sichtbarkeit und planbare Direktnachrichten-Leads zu erzeugen.';
  const steps = config?.steps && config.steps.length > 0 ? config.steps : [
    { label: '1. HOOK PSYCHOLOGIE', percentage: 85 },
    { label: '2. VERKAUFSSTARKE CAROUSELS', percentage: 70 },
    { label: '3. STORY-DIRECT-CTA', percentage: 92 },
  ];
  const calloutText = config?.calloutText || 'Erzielt im Schnitt +240% Engagement-Wachstum.';
  const buttonLabel = config?.buttonLabel || 'ONE-PAGER LOGBUCH DOWNLOAD';
  const viewButtonLabel = config?.viewButtonLabel || 'ONE-PAGER LOGBUCH ANSEHEN';
  const subButtonLabel = config?.subButtonLabel || 'TXT-DUMP • GRATIS HERUNTERLADEN';

  const getFallbackContent = () => {
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
    return content;
  };

  const triggerFallbackDownload = () => {
    const content = getFallbackContent();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = config?.documentFilename || 'Florian_Kusche_Instagram_Strategie_OnePager.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownload = async () => {
    setDownloaded(true);

    if (config?.documentUrl) {
      try {
        let activeUrl = config.documentUrl;
        if (activeUrl.startsWith('chunked://')) {
          try {
            activeUrl = await reconstructChunkedString(activeUrl);
          } catch (err) {
            console.error('Failed to reconstruct chunked URL during download:', err);
          }
        }

        if (activeUrl.startsWith('data:')) {
          // Parse the data URL into a Blob to bypass browser security policies and download limits
          const parts = activeUrl.split(',');
          const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
          const base64Clean = parts[1].replace(/\s/g, '');
          const bstr = atob(base64Clean);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mime });
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = config.documentFilename || 'Instagram_Formel_Handout.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else if (activeUrl && activeUrl !== '') {
          // Standard web URL download
          const link = document.createElement('a');
          link.href = activeUrl;
          link.download = config.documentFilename || 'Instagram_Formel_Handout.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          triggerFallbackDownload();
        }
      } catch (err) {
        console.error('Failed to download custom document:', err);
        triggerFallbackDownload();
      }
    } else {
      triggerFallbackDownload();
    }

    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div
      className="relative flex justify-center items-center w-full max-w-sm mx-auto p-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Decorative Aura / Glow behind One-Pager */}
      <div className="absolute inset-0 bg-[#ffcc00]/10 rounded-[30px] filter blur-2xl transform scale-95 transition-transform duration-500 group-hover:scale-105 pointer-events-none"></div>

      {/* Floating 3D card structure */}
      <motion.div
        animate={{
          y: isHovered ? -10 : 0,
          rotateY: isHovered ? -5 : 0,
          rotateX: isHovered ? 5 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-full bg-[#002d47] border border-[#ffcc00]/25 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[540px] p-6 text-left select-none group border-b-4 hover:border-b-accent/50 transition-colors"
        id="onepager-sheet-doc"
      >
        {/* Subtle watermark in top right */}
        <div className="absolute right-0 top-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-[#ffcc00]/5 rounded-full filter blur-xl"></div>

        <div>
          {/* Header Block of Document */}
          <div className="flex justify-between items-start pb-4 border-b border-[#014e7a]/40 mb-5">
            <div>
              <span className="text-[9px] font-mono text-[#d6c3a3] tracking-[0.2em] uppercase block">
                {eyebrow}
              </span>
              <h4 className="font-display font-black text-xs text-white tracking-[0.1em] uppercase">
                {ownerName}
              </h4>
            </div>
            <FileText className="w-5 h-5 text-[#ffcc00] shrink-0" />
          </div>

          {/* Doc Title */}
          <h5 className="font-display text-sm font-black text-[#ffcc00] uppercase tracking-wide mb-3 leading-tight">
            {title}
          </h5>
          <p className="text-[10px] text-[#cce9ff]/75 leading-relaxed mb-4 whitespace-pre-line">
            {description}
          </p>

          {/* Graphical points simulating strategy columns */}
          <div className="space-y-3.5">
            {steps.map((step, idx) => (
              <div className="space-y-1" key={idx}>
                <span className="text-[9px] font-mono text-[#d6c3a3] tracking-widest uppercase block truncate" title={step.label}>
                  {step.label}
                </span>
                <div className="h-1.5 bg-[#014e7a]/40 rounded-full w-full overflow-hidden">
                  <div 
                    className="h-full bg-accent rounded-full transition-all duration-500" 
                    style={{ width: `${step.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Status Label */}
          {calloutText && (
            <div className="mt-6 p-2 bg-[#004369]/60 border border-[#014e7a]/40 rounded-lg flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-accent shrink-0 animate-pulse" />
              <span className="text-[9px] text-[#cce9ff]/85 line-clamp-2">{calloutText}</span>
            </div>
          )}
        </div>

        {/* Action Bottom */}
        <div className="pt-4 border-t border-[#014e7a]/30 space-y-2">
          <button
            onClick={handleDownload}
            className={`w-full py-2.5 px-4 rounded-xl font-display text-[10px] tracking-widest font-black uppercase text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
              downloaded
                ? 'bg-emerald-500 text-white'
                : 'bg-[#ffcc00] text-black hover:bg-[#ebd500]'
            }`}
            id="download-one-pager"
          >
            {downloaded ? (
              <>
                <Check className="w-4 h-4 text-white stroke-[3]" />
                DATEI GELADEN
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-black stroke-[2.5]" />
                {buttonLabel}
              </>
            )}
          </button>

          {subButtonLabel && (
            <span className="text-[8px] font-mono text-[#cce9ff]/55 block text-center mt-1 uppercase tracking-wider">
              {subButtonLabel}
            </span>
          )}
        </div>
      </motion.div>

      {/* Inline Document Viewer Modal */}
      {isViewerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#002d47] border border-[#ffcc00]/30 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 bg-[#001d2e] border-b border-[#014e7a]/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-accent" />
                <div>
                  <h3 className="text-white font-display font-black text-xs uppercase tracking-wider">
                    {title}
                  </h3>
                  <p className="text-[10px] text-[#cce9ff]/60 uppercase font-mono tracking-widest">
                    Online-Ansicht • {config?.documentFilename || 'System-Generiert'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {viewerUrl && (
                  <a
                    href={viewerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-[#014e7a]/40 hover:bg-[#014e7a] text-[#cce9ff] rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase font-mono"
                  >
                    <span>Extern öffnen</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => setIsViewerOpen(false)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Schließen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="flex-1 bg-white p-2 md:p-4 overflow-hidden relative flex flex-col justify-center items-center">
              {viewerUrl ? (
                (() => {
                  const url = config?.documentUrl || '';
                  const isBase64 = url.startsWith('data:');
                  
                  // Extract mime type if base64
                  let mimeType = '';
                  if (isBase64) {
                    const match = url.match(/^data:([^;]+);/);
                    if (match) mimeType = match[1];
                  }

                  const docFilename = (config?.documentFilename || '').toLowerCase();
                  const isPdf = mimeType === 'application/pdf' || 
                                url.toLowerCase().includes('.pdf') || 
                                docFilename.endsWith('.pdf') || 
                                mimeType.includes('pdf');
                  const isImage = mimeType.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(url);
                  const isText = mimeType.startsWith('text/') || url.toLowerCase().endsWith('.txt') || mimeType.includes('plain');

                  if (isImage) {
                    return (
                      <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
                        <img
                          src={viewerUrl}
                          alt="Document Preview"
                          className="max-w-full max-h-full object-contain rounded-lg shadow-md border border-zinc-200"
                        />
                      </div>
                    );
                  } else if (isText) {
                    // Try to decode base64 text or display it
                    let textContent = '';
                    try {
                      if (isBase64) {
                        const base64Content = url.split(',')[1];
                        textContent = atob(base64Content);
                      } else {
                        textContent = 'Standard-Text-Dokument';
                      }
                    } catch (e) {
                      textContent = 'Text-Inhalt konnte nicht geladen werden.';
                    }
                    return (
                      <div className="w-full h-full bg-zinc-950 text-emerald-400 font-mono text-xs p-6 overflow-y-auto rounded-lg text-left relative selection:bg-emerald-500 selection:text-black">
                        <pre className="whitespace-pre-wrap leading-relaxed">{textContent || getFallbackContent()}</pre>
                      </div>
                    );
                  } else if (isPdf) {
                    if (pdfjs) {
                      return (
                        <PdfCanvasViewer
                          pdfUrl={viewerUrl}
                          pdfjsLib={pdfjs}
                          fallbackText={getFallbackContent()}
                        />
                      );
                    } else if (isPdfjsLoading) {
                      return (
                        <div className="flex flex-col items-center justify-center p-8 space-y-4 w-full h-full min-h-[300px]">
                          <div className="w-8 h-8 border-4 border-[#ffcc00] border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest">PDF-Viewer wird geladen...</p>
                        </div>
                      );
                    } else {
                      return (
                        <iframe
                          src={viewerUrl}
                          className="w-full h-full rounded-lg border border-zinc-200 shadow-sm"
                          title="PDF Document Preview"
                        />
                      );
                    }
                  } else {
                    // Fallback using Google Docs viewer for remote non-pdf / non-image docs (like word, excel)
                    if (isBase64) {
                      return (
                        <iframe
                          src={viewerUrl}
                          className="w-full h-full rounded-lg border border-zinc-200 shadow-sm"
                          title="Document Preview"
                        />
                      );
                    }
                    return (
                      <iframe
                        src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
                        className="w-full h-full rounded-lg border border-zinc-200 shadow-sm"
                        title="Google Document Preview"
                      />
                    );
                  }
                })()
              ) : (
                /* Plaintext fall-back viewer styled elegantly */
                <div className="w-full h-full bg-zinc-950 text-emerald-400 font-mono text-xs p-6 overflow-y-auto rounded-lg text-left relative selection:bg-emerald-500 selection:text-black">
                  <div className="absolute right-4 top-4 flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(getFallbackContent());
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="p-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded border border-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Kopieren"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span className="text-[9px] uppercase font-bold">{copied ? 'Kopiert' : 'Kopieren'}</span>
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap leading-relaxed">{getFallbackContent()}</pre>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#001d2e] border-t border-[#014e7a]/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-center sm:text-left">
              <span className="text-[10px] text-[#cce9ff]/50 font-mono uppercase tracking-wider">
                Möchtest du das Dokument speichern? Nutze den Download-Button.
              </span>
              <button
                onClick={() => {
                  handleDownload();
                  setIsViewerOpen(false);
                }}
                className="py-2 px-5 bg-accent hover:bg-[#ebd500] text-black font-display font-black text-[10px] tracking-widest uppercase rounded-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-1.5 self-center sm:self-auto cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-black stroke-[3]" />
                Dokument Herunterladen
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function PdfCanvasViewer({ pdfUrl, pdfjsLib, fallbackText }: { pdfUrl: string; pdfjsLib: any; fallbackText: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1.0);
  const [containerWidth, setContainerWidth] = useState(600);

  // Measure container width dynamically to handle responsiveness properly
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });

    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadPdf = async () => {
      try {
        setLoading(true);
        setError('');
        let loadingTask;

        if (pdfUrl.startsWith('data:')) {
          const parts = pdfUrl.split(',');
          const base64Str = parts[1];
          const binaryStr = atob(base64Str);
          const len = binaryStr.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          loadingTask = pdfjsLib.getDocument({ data: bytes });
        } else {
          loadingTask = pdfjsLib.getDocument(pdfUrl);
        }

        const pdf = await loadingTask.promise;
        if (!active) return;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setLoading(false);
      } catch (err: any) {
        console.error('Error loading PDF document:', err);
        if (active) {
          setError('Dieses PDF-Dokument konnte im Browser nicht direkt visualisiert werden. Bitte lade das Dokument herunter.');
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      active = false;
    };
  }, [pdfUrl, pdfjsLib]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 w-full h-full min-h-[300px]">
        <div className="w-8 h-8 border-4 border-[#ffcc00] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-[#cce9ff]/70 font-mono uppercase tracking-widest">PDF-Inhalt wird geladen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 w-full h-full text-center">
        <p className="text-sm text-red-400 font-semibold">{error}</p>
        <pre className="p-4 bg-zinc-950 text-emerald-400 font-mono text-[10px] rounded text-left overflow-auto max-w-lg border border-[#014e7a]/40 max-h-[150px]">
          {fallbackText}
        </pre>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col items-center overflow-hidden">
      {/* Controls */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 bg-[#001d2e] border-b border-[#014e7a]/40 gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#cce9ff] font-mono tracking-widest uppercase font-bold px-2 py-1 bg-[#014e7a]/20 rounded border border-[#014e7a]/30">
            Gesamt: {numPages} {numPages === 1 ? 'Seite' : 'Seiten'} (Fortlaufende Ansicht)
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.6))}
            className="w-7 h-7 flex items-center justify-center bg-[#014e7a]/40 hover:bg-[#014e7a]/80 border border-[#014e7a]/50 rounded-lg text-[#cce9ff] transition-colors cursor-pointer"
            title="Verkleinern"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-[#cce9ff] font-mono tracking-widest min-w-[40px] text-center font-bold">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.2, 2.0))}
            className="w-7 h-7 flex items-center justify-center bg-[#014e7a]/40 hover:bg-[#014e7a]/80 border border-[#014e7a]/50 rounded-lg text-[#cce9ff] transition-colors cursor-pointer"
            title="Vergrößern"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Render Canvases in Scroll Container */}
      <div className="flex-1 w-full overflow-y-auto bg-[#001421] p-4 space-y-6">
        {Array.from({ length: numPages }, (_, index) => (
          <PdfSinglePage
            key={index + 1}
            pdfDoc={pdfDoc}
            pageNumber={index + 1}
            zoom={zoom}
            containerWidth={containerWidth}
          />
        ))}
      </div>
    </div>
  );
}

function PdfSinglePage({
  pdfDoc,
  pageNumber,
  zoom,
  containerWidth,
}: {
  key?: any;
  pdfDoc: any;
  pageNumber: number;
  zoom: number;
  containerWidth: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    let active = true;
    const renderPage = async () => {
      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDoc.getPage(pageNumber);
        if (!active) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const responsiveScale = (containerWidth / unscaledViewport.width) * 0.95 * zoom;
        const viewport = page.getViewport({ scale: responsiveScale });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error(`Error rendering page ${pageNumber}:`, err);
        }
      }
    };

    renderPage();

    return () => {
      active = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, pageNumber, zoom, containerWidth]);

  return (
    <div className="flex flex-col items-center relative w-full">
      <div className="mb-2 text-[10px] text-[#cce9ff]/60 font-mono tracking-widest uppercase flex items-center gap-1 bg-[#001d2e]/60 px-2 py-0.5 rounded border border-[#014e7a]/20">
        <span>Seite {pageNumber}</span>
      </div>
      <canvas
        ref={canvasRef}
        className="shadow-2xl border border-[#014e7a]/30 bg-white max-w-full rounded-lg h-auto"
      />
    </div>
  );
}
