import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, logSafeFirebaseError, isQuotaError, isOfflineError, reconstructAllChunkedFieldsInObject } from './firebase';
import { LandingPageData } from '../types';
import { SERVICES, TOOLS, REFERENCES, PROCESS_STEPS } from '../data';

const withTimeout = <T>(promise: Promise<T>, ms: number, errorMessage: string = 'Timeout'): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), ms))
  ]);
};

async function reconstructChunkedFields(pageData: LandingPageData): Promise<LandingPageData> {
  // 1. OnePager chunk loading
  if (pageData.onePager?.documentUrl === 'chunked://onepager') {
    try {
      const metaSnap = await withTimeout(getDoc(doc(db, 'landing_page_chunks', 'onepager')), 35000, 'offline');
      if (metaSnap.exists()) {
        const { totalChunks } = metaSnap.data();
        if (typeof totalChunks === 'number' && totalChunks > 0) {
          const chunkPromises = [];
          for (let i = 0; i < totalChunks; i++) {
            chunkPromises.push(withTimeout(getDoc(doc(db, 'landing_page_chunks', `onepager_chunk_${i}`)), 35000, 'offline'));
          }
          const chunkSnaps = await Promise.all(chunkPromises);
          let fullBase64 = '';
          for (const snap of chunkSnaps) {
            if (snap.exists()) {
              fullBase64 += snap.data().chunk || '';
            }
          }
          if (fullBase64) {
            pageData.onePager.documentUrl = fullBase64;
          }
        }
      }
    } catch (err) {
      logSafeFirebaseError('Error reassembling chunked onepager PDF', err);
    }
  }

  // 2. Footer pdf chunk loading
  if (pageData.footer?.pdfUrl === 'chunked://footerpdf') {
    try {
      const metaSnap = await withTimeout(getDoc(doc(db, 'landing_page_chunks', 'footerpdf')), 35000, 'offline');
      if (metaSnap.exists()) {
        const { totalChunks } = metaSnap.data();
        if (typeof totalChunks === 'number' && totalChunks > 0) {
          const chunkPromises = [];
          for (let i = 0; i < totalChunks; i++) {
            chunkPromises.push(withTimeout(getDoc(doc(db, 'landing_page_chunks', `footerpdf_chunk_${i}`)), 35000, 'offline'));
          }
          const chunkSnaps = await Promise.all(chunkPromises);
          let fullBase64 = '';
          for (const snap of chunkSnaps) {
            if (snap.exists()) {
              fullBase64 += snap.data().chunk || '';
            }
          }
          if (fullBase64) {
            pageData.footer.pdfUrl = fullBase64;
          }
        }
      }
    } catch (err) {
      logSafeFirebaseError('Error reassembling chunked footer PDF', err);
    }
  }

  // 3. Dynamically reconstruct all other generic chunked strings (images, videos, reels, etc.)
  return reconstructAllChunkedFieldsInObject(pageData);
}

export const DEFAULT_PAGE_DATA: LandingPageData = {
  hero: {
    logoText: 'FLORIAN KUSCHE',
    logoSubtext: 'INSTAGRAM MANAGEMENT & CONTENT',
    eyebrow: 'Instagram Management & Content',
    headline: 'Mehr Anfragen. \nMehr Sichtbarkeit. \nKein Stress.',
    subtitle: 'Ich übernehme deinen Instagram-Auftritt komplett, damit du dich auf dein Business konzentrieren kannst.',
    primaryCta: 'Kostenloses Erstgespräch',
    secondaryCta: 'Wie ich arbeite',
    checklist: ['100% Betreut', 'Keine Vorkenntnisse Nötig', 'Transparente Monatsplanung']
  },
  services: SERVICES,
  tools: TOOLS,
  references: REFERENCES,
  processes: PROCESS_STEPS,
  footer: {
    phone: '+49 151 28897623',
    email: 'florian@floriankusche.de',
    instagram: '@floriankusche.social',
    location: 'Hannover, Deutschland',
    pdfUrl: '',
    pdfFilename: '',
    imprintText: '',
    privacyText: '',
    contactEyebrow: 'KONTAKT & DIALOG',
    contactTitle: 'LASS UNS [ETWAS GROSSES] STARTEN',
    contactText: 'Egal ob schnelles Feedback auf WhatsApp, klassische E-Mail oder ausführliche Nachricht – wähle einfach deinen bevorzugten Kanal aus. Ich melde mich innerhalb von 24 Stunden bei dir.',
    contactWaLabel: 'WhatsApp Chat',
    contactWaSubtext: 'Sende eine Frage direkt über WhatsApp',
    contactEmailLabel: 'Klassische Nachricht',
    contactEmailSubtext: 'Antwortgarantie unter 24 Stunden',
    contactIgLabel: 'Social Media',
    contactIgSubtext: 'Folge mir für nützliche Instagram-Hacks'
  },
  betweenSectionImage: {
    imageUrl: '',
    width: 250,
    borderRadius: 'xl',
    alignment: 'left',
    marginTop: 0,
    marginBottom: 20,
    enabled: false
  },
  contactImage: {
    imageUrl: '',
    width: 250,
    borderRadius: 'xl',
    alignment: 'left',
    marginTop: 0,
    marginBottom: 20,
    enabled: false
  },
  onePager: {
    eyebrow: 'STRATEGIE-AUFBAU',
    ownerName: 'FLORIAN KUSCHE',
    title: 'INSTAGRAM ERFOLGS-FAHRPLAN',
    description: 'Der exakte Blueprint, mit dem ich deinen Account aufbaue und pflege, um konstante Sichtbarkeit und planbare Direktnachrichten-Leads zu erzeugen.',
    steps: [
      { label: '1. HOOK PSYCHOLOGIE', percentage: 85 },
      { label: '2. VERKAUFSSTARKE CAROUSELS', percentage: 70 },
      { label: '3. STORY-DIRECT-CTA', percentage: 92 }
    ],
    calloutText: 'Erzielt im Schnitt +240% Engagement-Wachstum.',
    buttonLabel: 'ONE-PAGER LOGBUCH DOWNLOAD',
    viewButtonLabel: 'ONE-PAGER LOGBUCH ANSEHEN',
    subButtonLabel: 'TXT-DUMP • GRATIS HERUNTERLADEN',
    bottomDirectionsText: '▲ KLICKE AUF DAS DOKUMENT, UM DIE INSTAGRAM-ERFOLGSFORMEL ALS TEXT HERUNTERZULADEN!',
    documentUrl: '',
    documentFilename: 'Florian_Kusche_Instagram_Strategie_OnePager.txt'
  },
  servicesSection: {
    eyebrow: 'PORTFOLIO & LEISTUNGEN',
    title: 'WIE ICH DEINE MARKE [UNSCHLAGBAR SICHTBAR] MACHE',
    descriptions: [
      'Mein Versprechen: Hochwertiger, strategischer Content, der deine Markenbotschaft trägt und aus Followern messbare Leads generiert. Komplett von mir abgewickelt, ohne Stress für dich.'
    ],
    upgradeBannerEnabled: true,
    upgradeBannerEyebrow: 'EXKLUSIVES UPGRADE-ANGEBOT',
    upgradeBannerTitle: 'DEINE WEBSITE, GENAUSO STARK WIE DEIN INSTAGRAM',
    upgradeBannerText: 'Diese Seite hier ist im Team mit meinem Spezialisten für Webdesign und Hosting entstanden. Auch bei dir arbeiten wir gemeinsam: Wir hören uns deine Idee, deine Vision und dein Ziel an und gehen dann gemeinsam in Planung und Umsetzung, Screendesign und Instagram-Auftritt aus einer Hand.',
    upgradeBannerButtonText: 'Direkt anfragen',
    upgradeBannerButtonUrl: 'mailto:website@floriankusche.de?subject=Website-Anfrage'
  },
  projectSupport: {
    enabled: true,
    eyebrow: 'ERGÄNZUNG ZUR INSTAGRAM-DAUERBETREUUNG',
    title: 'Projektbezogene Betreuung',
    description: 'Nicht jeder braucht eine dauerhafte Betreuung. Manchmal reicht ein einzelner Anlass, ein Event, eine Kampagne, ein Launch. Auch dafür bin ich buchbar, ohne dass daraus automatisch ein Dauerauftrag wird.',
    packages: [
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
    ],
    noteText: 'Der Umfang und das Honorar richten sich individuell nach dem jeweiligen Projekt.',
    buttonText: 'Projekt anfragen'
  },
  colors: {
    accent: '#ffcc00',
    accentBrightness: 0,
    brandDark: '#004369',
    brandDarkBrightness: 0,
    brandDarker: '#002d47',
    brandDarkerBrightness: 0,
    brandDarkCard: '#014e7a',
    brandDarkCardBrightness: 0
  },
  about: {
    enabled: true,
    eyebrow: 'Seit 2004 im Vertrieb, seit 2017 selbstständig.',
    title: 'Wer steckt dahinter',
    text: 'Ich kenne beide Seiten: was Kunden wirklich überzeugt, und wie man das sichtbar macht. Deshalb arbeite ich ausschließlich mit Instagram, dafür richtig. Mein Tool-Stack: Canva Business, CapCut, Google Drive und Trello für die Organisation, dazu KI-gestützte Tools für Recherche und Konzeption.',
    imageEnabled: true,
    imageUrl: '',
    feature1Title: 'Vertriebs-Fokus',
    feature1Text: 'Seit 2004 im aktiven Vertrieb. Ich weiß genau, was Kunden zum Kaufen bewegt.',
    feature2Title: 'Ergebnis-Garantie',
    feature2Text: 'Keine nutzlosen Reichweiten-Tricks, sondern echte, messbare Ergebnisse.',
    features: [
      {
        title: 'Vertriebs-Fokus',
        text: 'Seit 2004 im aktiven Vertrieb. Ich weiß genau, was Kunden zum Kaufen bewegt.'
      },
      {
        title: 'Ergebnis-Garantie',
        text: 'Keine nutzlosen Reichweiten-Tricks, sondern echte, messbare Ergebnisse.'
      }
    ]
  },
  trustBlock: {
    title: 'Keine Schnupperangebote.',
    subtitle: 'Klare Verbindlichkeit.',
    paragraph1: 'Ich glaube an nachhaltiges Wachstum und erstklassigen Service. Social Media funktioniert nicht über Nacht. Der beste und fairste Einstieg ist das kostenlose Erstgespräch, bei dem wir deine langfristigen Potenziale ermitteln.',
    paragraph2: 'Ich verkaufe keine Wunder. Ich arbeite mit dem, was an deinem Business, deinem Team oder deinem Handwerk bereits überzeugt, und mache genau das sichtbar. Keine übertriebenen Reichweiten-Versprechen, sondern realistische, nachvollziehbare Ergebnisse.',
    buttonText: 'Kostenloses Erstgespräch buchen'
  },
  fehrmannStats: {
    aufrufe: '+ 270 %',
    reichweite: '+ 2.000 %',
    interaktion: '+ 9.000 %',
    reelLink: 'https://www.instagram.com/reel/DaS9nyUMUEg/',
    highlightReelTitle: 'HIGHLIGHT-REEL',
    highlightReelText: 'Dieses Reel demonstriert die faszinierende Ästhetik von handgefertigtem Glas und modernem Design. Klicke auf Play, um das Video zu starten, oder teste das Like-System!',
    sichtbarkeitTitle: 'Sichtbarkeit & Reichweite',
    sichtbarkeitText: 'Unsere datengetriebene Reels-Strategie sorgt für überproportionales Wachstum in der Zielgruppe. Die Zahlenwerte passen sich dynamisch an.',
    videoType: 'uploaded',
    uploadedVideoUrl: 'https://uchdjdmdzuvsgqhlczwk.supabase.co/storage/v1/object/public/public%20media/Glasvordach_x264%20(1).mp4'
  },
  calendly: {
    calendlyUrl: 'https://calendly.com/floriankusche',
    isConnected: false,
    bookings: [
      {
        id: 'mock-1',
        name: 'Sarah Becker',
        email: 'sarah.becker@beispiel-gmbh.de',
        eventType: '1:1 Instagram Strategie-Gespräch',
        dateTime: '2026-07-01T10:00:00Z',
        status: 'confirmed',
        notes: 'Interesse an Full-Service Betreuung für unseren neuen Gastro-Account.'
      },
      {
        id: 'mock-2',
        name: 'Markus Weber',
        email: 'm.weber@handwerk-weber.at',
        eventType: 'Kennenlern-Call (15 Min)',
        dateTime: '2026-07-02T14:30:00Z',
        status: 'confirmed',
        notes: 'Suchen jemanden für regelmäßige Reel-Produktion vor Ort.'
      }
    ]
  }
};

function stripLargeStrings(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    // Strip Base64 images/videos or any extremely large strings (>5KB) to prevent exceeding localStorage quota
    if (obj.startsWith('data:') || obj.length > 5000) {
      return '';
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => stripLargeStrings(item));
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = stripLargeStrings(obj[key]);
    }
    return cleaned;
  }
  return obj;
}

function clearNonEssentialStorage() {
  try {
    const essentialKeys = new Set(['florian_cms_cache', 'fk_cookie_consent', 'admin_logged_in_email', 'admin_logged_in_pw']);
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !essentialKeys.has(key)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch (err) {
    // Ignore storage clear errors
  }
}

export function getLocalCache(): LandingPageData | null {
  try {
    const cached = localStorage.getItem('florian_cms_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      return cleanFailedPlaceholdersRecursive(parsed);
    }
  } catch (e) {
    console.warn('Could not read florian_cms_cache from localStorage:', e);
  }
  return null;
}

export function cleanFailedPlaceholdersRecursive(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanFailedPlaceholdersRecursive);
  }
  const cleanObj = {} as any;
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === 'string' && value.startsWith('failed-upload-placeholder:')) {
      cleanObj[key] = undefined;
    } else if (value && typeof value === 'object') {
      cleanObj[key] = cleanFailedPlaceholdersRecursive(value);
    } else {
      cleanObj[key] = value;
    }
  }
  return cleanObj;
}

export function setLocalCache(data: LandingPageData) {
  try {
    const stripped = stripLargeStrings(data);
    localStorage.setItem('florian_cms_cache', JSON.stringify(stripped));
  } catch (e) {
    // Quota exceeded or storage error. Clear image chunk caches and retry once.
    try {
      clearNonEssentialStorage();
      const stripped = stripLargeStrings(data);
      localStorage.setItem('florian_cms_cache', JSON.stringify(stripped));
    } catch (retryErr) {
      console.warn('Notice: florian_cms_cache could not be saved to localStorage (storage quota full or disabled).', retryErr);
    }
  }
}

/**
 * Loads the current landing page configuration from Firestore,
 * or returns the default hardcoded configuration if none exists yet.
 * Resilient to Firestore Quota Exceeded errors via localStorage caching.
 */
export async function loadLandingPageData(): Promise<LandingPageData> {
  try {
    const configDocRef = doc(db, 'landing_pages', 'main');
    const docSnap = await withTimeout(getDoc(configDocRef), 35000, 'offline');

    if (docSnap.exists()) {
      const rawDbData = docSnap.data() as Partial<LandingPageData>;
      const dbData = cleanFailedPlaceholdersRecursive(rawDbData);
      
      const pageData: LandingPageData = {
        hero: { ...DEFAULT_PAGE_DATA.hero, ...(dbData.hero || {}) },
        services: dbData.services || DEFAULT_PAGE_DATA.services,
        tools: dbData.tools || DEFAULT_PAGE_DATA.tools,
        references: dbData.references || DEFAULT_PAGE_DATA.references,
        processes: dbData.processes || DEFAULT_PAGE_DATA.processes,
        footer: { ...DEFAULT_PAGE_DATA.footer, ...(dbData.footer || {}) },
        betweenSectionImage: dbData.betweenSectionImage 
          ? { ...DEFAULT_PAGE_DATA.betweenSectionImage, ...dbData.betweenSectionImage }
          : DEFAULT_PAGE_DATA.betweenSectionImage,
        contactImage: dbData.contactImage
          ? { ...DEFAULT_PAGE_DATA.contactImage, ...dbData.contactImage }
          : DEFAULT_PAGE_DATA.contactImage,
        onePager: dbData.onePager
          ? { ...DEFAULT_PAGE_DATA.onePager, ...dbData.onePager }
          : { ...DEFAULT_PAGE_DATA.onePager! },
        servicesSection: dbData.servicesSection
          ? { ...DEFAULT_PAGE_DATA.servicesSection, ...dbData.servicesSection, descriptions: dbData.servicesSection.descriptions || DEFAULT_PAGE_DATA.servicesSection.descriptions }
          : { ...DEFAULT_PAGE_DATA.servicesSection! },
        projectSupport: dbData.projectSupport
          ? {
              ...DEFAULT_PAGE_DATA.projectSupport,
              ...dbData.projectSupport,
              packages: dbData.projectSupport.packages || DEFAULT_PAGE_DATA.projectSupport!.packages
            }
          : DEFAULT_PAGE_DATA.projectSupport,
        colors: dbData.colors
          ? { ...DEFAULT_PAGE_DATA.colors, ...dbData.colors }
          : DEFAULT_PAGE_DATA.colors,
        calendly: dbData.calendly
          ? { ...DEFAULT_PAGE_DATA.calendly, ...dbData.calendly }
          : DEFAULT_PAGE_DATA.calendly,
        about: dbData.about
          ? { ...DEFAULT_PAGE_DATA.about, ...dbData.about }
          : DEFAULT_PAGE_DATA.about,
        trustBlock: dbData.trustBlock
          ? { ...DEFAULT_PAGE_DATA.trustBlock, ...dbData.trustBlock }
          : DEFAULT_PAGE_DATA.trustBlock,
        fehrmannStats: dbData.fehrmannStats
          ? { 
              ...DEFAULT_PAGE_DATA.fehrmannStats, 
              ...dbData.fehrmannStats,
              videoType: dbData.fehrmannStats.videoType || 'uploaded',
              uploadedVideoUrl: dbData.fehrmannStats.uploadedVideoUrl || 'https://uchdjdmdzuvsgqhlczwk.supabase.co/storage/v1/object/public/public%20media/Glasvordach_x264%20(1).mp4'
            }
          : DEFAULT_PAGE_DATA.fehrmannStats
      };

      // Reconstruct chunked fields dynamically
      const pageDataWithChunks = await reconstructChunkedFields(pageData);
      setLocalCache(pageDataWithChunks);
      return pageDataWithChunks;
    } else {
      // Document doesn't exist yet, but we are online!
      // Check cached, otherwise return defaults without setting isFallback: true
      const cached = getLocalCache();
      if (cached) {
        return { ...cached, isFallback: false };
      }
      return { ...DEFAULT_PAGE_DATA, isFallback: false };
    }
  } catch (error: any) {
    if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
      handleFirestoreError(error, OperationType.GET, 'landing_pages/main');
    }
    logSafeFirebaseError('Error fetching landing page data from Firebase, falling back to local defaults', error);
  }

  // Fallback chain: Firestore failed/quota-exceeded -> Local Cache -> hardcoded DEFAULT_PAGE_DATA
  const cached = getLocalCache();
  if (cached) {
    console.log('Successfully recovered landing page data from local storage cache.');
    return { ...cached, isFallback: true };
  }
  return { ...DEFAULT_PAGE_DATA, isFallback: true };
}

/**
 * Saves/Publishes the landing page configuration to Firestore and saves it to local cache.
 */

async function chunkAndUploadString(dataUrl: string): Promise<string> {
  const totalLength = dataUrl.length;
  // Use chunks of 800,000 characters (~800 KB) to optimize write count (fits safely in 1MB Firestore limit)
  const chunkSize = 800000;
  const chunks: string[] = [];
  for (let i = 0; i < totalLength; i += chunkSize) {
    chunks.push(dataUrl.substring(i, i + chunkSize));
  }
  
  const assetId = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  
  // Extract mimeType from data URL if possible
  let mimeType = 'application/octet-stream';
  const match = dataUrl.match(/^data:([^;]+);base64,/);
  if (match) {
    mimeType = match[1];
  }

  // Save metadata
  await withTimeout(
    setDoc(doc(db, 'landing_page_chunks', assetId), {
      totalChunks: chunks.length,
      mimeType,
      updatedAt: new Date().toISOString()
    }),
    15000,
    'offline'
  );

  // Save individual chunks in parallel for maximum performance and to avoid sequential timeouts
  const chunkPromises = chunks.map((chunk, index) =>
    withTimeout(
      setDoc(doc(db, 'landing_page_chunks', `${assetId}_chunk_${index}`), { chunk }),
      30000,
      'offline'
    )
  );
  await Promise.all(chunkPromises);

  return `chunked://${assetId}`;
}

async function chunkAllLargeFieldsInObject(obj: any): Promise<any> {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    const newArr = [];
    for (const item of obj) {
      newArr.push(await chunkAllLargeFieldsInObject(item));
    }
    return newArr;
  }

  const newObj = {} as any;
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === 'string' && value.startsWith('data:') && value.length > 30000) {
      try {
        newObj[key] = await chunkAndUploadString(value);
      } catch (err) {
        console.warn(`Failed to chunk and upload large field at key: ${key}. Falling back to inline representation.`, err);
        // Fail-safe: if the base64 string is too large (> 600,000 characters) and chunking failed,
        // we must not write it inline to the main Firestore document or it will exceed 1MB and crash the save.
        if (value.length > 600000) {
          console.warn(`Field ${key} is too large (${value.length} chars) to save inline in Firestore without chunking. Saving with placeholder to avoid Firestore crash.`);
          newObj[key] = `failed-upload-placeholder:${value.substring(0, 100)}`;
        } else {
          newObj[key] = value;
        }
      }
    } else if (value && typeof value === 'object') {
      newObj[key] = await chunkAllLargeFieldsInObject(value);
    } else {
      newObj[key] = value;
    }
  }

  return newObj;
}

export async function saveLandingPageData(data: LandingPageData): Promise<void> {
  const dataCopy = JSON.parse(JSON.stringify(data)) as LandingPageData;
  delete dataCopy.isFallback;

  // Always update local cache first with the complete un-chunked data
  setLocalCache(data);

  // Backup special fields so they aren't processed by the generic recursive chunker
  const backupOnePagerUrl = dataCopy.onePager?.documentUrl;
  const backupFooterPdfUrl = dataCopy.footer?.pdfUrl;
  
  if (dataCopy.onePager) dataCopy.onePager.documentUrl = '';
  if (dataCopy.footer) dataCopy.footer.pdfUrl = '';

  // Chunk all other large base64 data strings recursively (videos, references images, reels, etc.)
  let processedData = await chunkAllLargeFieldsInObject(dataCopy);

  // Restore backed up special fields
  if (processedData.onePager) processedData.onePager.documentUrl = backupOnePagerUrl || '';
  if (processedData.footer) processedData.footer.pdfUrl = backupFooterPdfUrl || '';

  const configDocRef = doc(db, 'landing_pages', 'main');
  try {

    // 1. Check if the onepager is too large and needs chunking (> 600 KB characters)
    const docUrl = processedData.onePager?.documentUrl || '';
    if (docUrl.startsWith('data:') && docUrl.length > 600000) {
      const chunkSize = 500000;
      const chunks: string[] = [];
      for (let i = 0; i < docUrl.length; i += chunkSize) {
        chunks.push(docUrl.substring(i, i + chunkSize));
      }

      // Write chunks metadata
      await withTimeout(setDoc(doc(db, 'landing_page_chunks', 'onepager'), {
        totalChunks: chunks.length,
        filename: processedData.onePager?.documentFilename || 'document',
        updatedAt: new Date().toISOString()
      }), 45000, 'offline');

      // Write individual chunk documents sequentially
      for (let index = 0; index < chunks.length; index++) {
        await withTimeout(
          setDoc(doc(db, 'landing_page_chunks', `onepager_chunk_${index}`), { chunk: chunks[index] }),
          45000,
          'offline'
        );
      }

      // Update main reference to point to chunks
      if (processedData.onePager) {
        processedData.onePager.documentUrl = 'chunked://onepager';
      }
    }

    // 2. Check if the footer PDF is too large and needs chunking (> 600 KB characters)
    const footerPdfUrl = processedData.footer?.pdfUrl || '';
    if (footerPdfUrl.startsWith('data:') && footerPdfUrl.length > 600000) {
      const chunkSize = 500000;
      const chunks: string[] = [];
      for (let i = 0; i < footerPdfUrl.length; i += chunkSize) {
        chunks.push(footerPdfUrl.substring(i, i + chunkSize));
      }

      // Write chunks metadata
      await withTimeout(setDoc(doc(db, 'landing_page_chunks', 'footerpdf'), {
        totalChunks: chunks.length,
        filename: processedData.footer?.pdfFilename || 'document',
        updatedAt: new Date().toISOString()
      }), 45000, 'offline');

      // Write individual chunk documents sequentially
      for (let index = 0; index < chunks.length; index++) {
        await withTimeout(
          setDoc(doc(db, 'landing_page_chunks', `footerpdf_chunk_${index}`), { chunk: chunks[index] }),
          45000,
          'offline'
        );
      }

      // Update main reference to point to chunks
      if (processedData.footer) {
        processedData.footer.pdfUrl = 'chunked://footerpdf';
      }
    }

    await withTimeout(setDoc(configDocRef, processedData), 40000, 'offline');
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, 'landing_pages/main');
  }
}

export function subscribeLandingPageData(callback: (data: LandingPageData) => void, onError?: (err: any) => void): () => void {
  const configDocRef = doc(db, 'landing_pages', 'main');
  
  return onSnapshot(configDocRef, async (docSnap) => {
    if (docSnap.exists()) {
      const rawDbData = docSnap.data() as Partial<LandingPageData>;
      const dbData = cleanFailedPlaceholdersRecursive(rawDbData);
      
      const pageData: LandingPageData = {
        hero: { ...DEFAULT_PAGE_DATA.hero, ...(dbData.hero || {}) },
        services: dbData.services || DEFAULT_PAGE_DATA.services,
        tools: dbData.tools || DEFAULT_PAGE_DATA.tools,
        references: dbData.references || DEFAULT_PAGE_DATA.references,
        processes: dbData.processes || DEFAULT_PAGE_DATA.processes,
        footer: { ...DEFAULT_PAGE_DATA.footer, ...(dbData.footer || {}) },
        betweenSectionImage: dbData.betweenSectionImage 
          ? { ...DEFAULT_PAGE_DATA.betweenSectionImage, ...dbData.betweenSectionImage }
          : DEFAULT_PAGE_DATA.betweenSectionImage,
        contactImage: dbData.contactImage
          ? { ...DEFAULT_PAGE_DATA.contactImage, ...dbData.contactImage }
          : DEFAULT_PAGE_DATA.contactImage,
        onePager: dbData.onePager
          ? { ...DEFAULT_PAGE_DATA.onePager, ...dbData.onePager }
          : { ...DEFAULT_PAGE_DATA.onePager! },
        servicesSection: dbData.servicesSection
          ? { ...DEFAULT_PAGE_DATA.servicesSection, ...dbData.servicesSection, descriptions: dbData.servicesSection.descriptions || DEFAULT_PAGE_DATA.servicesSection.descriptions }
          : { ...DEFAULT_PAGE_DATA.servicesSection! },
        projectSupport: dbData.projectSupport
          ? {
              ...DEFAULT_PAGE_DATA.projectSupport,
              ...dbData.projectSupport,
              packages: dbData.projectSupport.packages || DEFAULT_PAGE_DATA.projectSupport!.packages
            }
          : DEFAULT_PAGE_DATA.projectSupport,
        colors: dbData.colors
          ? { ...DEFAULT_PAGE_DATA.colors, ...dbData.colors }
          : DEFAULT_PAGE_DATA.colors,
        calendly: dbData.calendly
          ? { ...DEFAULT_PAGE_DATA.calendly, ...dbData.calendly }
          : DEFAULT_PAGE_DATA.calendly,
        about: dbData.about
          ? { ...DEFAULT_PAGE_DATA.about, ...dbData.about }
          : DEFAULT_PAGE_DATA.about,
        trustBlock: dbData.trustBlock
          ? { ...DEFAULT_PAGE_DATA.trustBlock, ...dbData.trustBlock }
          : DEFAULT_PAGE_DATA.trustBlock,
        fehrmannStats: dbData.fehrmannStats
          ? { 
              ...DEFAULT_PAGE_DATA.fehrmannStats, 
              ...dbData.fehrmannStats,
              videoType: dbData.fehrmannStats.videoType || 'uploaded',
              uploadedVideoUrl: dbData.fehrmannStats.uploadedVideoUrl || 'https://uchdjdmdzuvsgqhlczwk.supabase.co/storage/v1/object/public/public%20media/Glasvordach_x264%20(1).mp4'
            }
          : DEFAULT_PAGE_DATA.fehrmannStats
      };

      const pageDataWithChunks = await reconstructChunkedFields(pageData);
      setLocalCache(pageDataWithChunks);
      callback(pageDataWithChunks);
    } else {
       const cached = getLocalCache();
       if (cached) callback({ ...cached, isFallback: false });
       else callback({ ...DEFAULT_PAGE_DATA, isFallback: false });
    }
  }, (err) => {
    logSafeFirebaseError('Error listening to landing page data', err);
    const cached = getLocalCache();
    if (cached) callback({ ...cached, isFallback: true });
    else callback({ ...DEFAULT_PAGE_DATA, isFallback: true });
    
    // Only propagate non-quota errors to avoid console spam and false alarms
    if (onError && !isQuotaError(err) && !isOfflineError(err)) onError(err);
  });
}
