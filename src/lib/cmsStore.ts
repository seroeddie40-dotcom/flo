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
      const metaSnap = await withTimeout(getDoc(doc(db, 'landing_page_chunks', 'onepager')), 5000, 'offline');
      if (metaSnap.exists()) {
        const { totalChunks } = metaSnap.data();
        if (typeof totalChunks === 'number' && totalChunks > 0) {
          const chunkPromises = [];
          for (let i = 0; i < totalChunks; i++) {
            chunkPromises.push(withTimeout(getDoc(doc(db, 'landing_page_chunks', `onepager_chunk_${i}`)), 5000, 'offline'));
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
      const metaSnap = await withTimeout(getDoc(doc(db, 'landing_page_chunks', 'footerpdf')), 5000, 'offline');
      if (metaSnap.exists()) {
        const { totalChunks } = metaSnap.data();
        if (typeof totalChunks === 'number' && totalChunks > 0) {
          const chunkPromises = [];
          for (let i = 0; i < totalChunks; i++) {
            chunkPromises.push(withTimeout(getDoc(doc(db, 'landing_page_chunks', `footerpdf_chunk_${i}`)), 5000, 'offline'));
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
    privacyText: ''
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
    ]
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
    imageUrl: ''
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
    reelLink: 'https://www.instagram.com/reel/DaS9nyUMUEg/'
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

function getLocalCache(): LandingPageData | null {
  try {
    const cached = localStorage.getItem('florian_cms_cache');
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.error('Error reading florian_cms_cache from localStorage:', e);
  }
  return null;
}

function setLocalCache(data: LandingPageData) {
  try {
    localStorage.setItem('florian_cms_cache', JSON.stringify(data));
  } catch (e) {
    console.error('Error writing florian_cms_cache to localStorage:', e);
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
    const docSnap = await withTimeout(getDoc(configDocRef), 5000, 'offline');

    if (docSnap.exists()) {
      const dbData = docSnap.data() as Partial<LandingPageData>;
      
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
          ? { ...DEFAULT_PAGE_DATA.fehrmannStats, ...dbData.fehrmannStats }
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

export async function saveLandingPageData(data: LandingPageData): Promise<void> {
  const dataCopy = JSON.parse(JSON.stringify(data)) as LandingPageData;
  delete dataCopy.isFallback;

  // Always update local cache first
  setLocalCache(dataCopy);

  const configDocRef = doc(db, 'landing_pages', 'main');
  try {

    // 1. Check if the onepager is too large and needs chunking (> 600 KB characters)
    const docUrl = dataCopy.onePager?.documentUrl || '';
    if (docUrl.startsWith('data:') && docUrl.length > 600000) {
      const chunkSize = 500000;
      const chunks: string[] = [];
      for (let i = 0; i < docUrl.length; i += chunkSize) {
        chunks.push(docUrl.substring(i, i + chunkSize));
      }

      // Write chunks metadata
      await withTimeout(setDoc(doc(db, 'landing_page_chunks', 'onepager'), {
        totalChunks: chunks.length,
        filename: dataCopy.onePager?.documentFilename || 'document',
        updatedAt: new Date().toISOString()
      }), 5000, 'offline');

      // Write individual chunk documents
      const chunkWrites = chunks.map((chunk, index) => 
        withTimeout(setDoc(doc(db, 'landing_page_chunks', `onepager_chunk_${index}`), { chunk }), 5000, 'offline')
      );
      await Promise.all(chunkWrites);

      // Update main reference to point to chunks
      if (dataCopy.onePager) {
        dataCopy.onePager.documentUrl = 'chunked://onepager';
      }
    }

    // 2. Check if the footer PDF is too large and needs chunking (> 600 KB characters)
    const footerPdfUrl = dataCopy.footer?.pdfUrl || '';
    if (footerPdfUrl.startsWith('data:') && footerPdfUrl.length > 600000) {
      const chunkSize = 500000;
      const chunks: string[] = [];
      for (let i = 0; i < footerPdfUrl.length; i += chunkSize) {
        chunks.push(footerPdfUrl.substring(i, i + chunkSize));
      }

      // Write chunks metadata
      await withTimeout(setDoc(doc(db, 'landing_page_chunks', 'footerpdf'), {
        totalChunks: chunks.length,
        filename: dataCopy.footer?.pdfFilename || 'document',
        updatedAt: new Date().toISOString()
      }), 5000, 'offline');

      // Write individual chunk documents
      const chunkWrites = chunks.map((chunk, index) => 
        withTimeout(setDoc(doc(db, 'landing_page_chunks', `footerpdf_chunk_${index}`), { chunk }), 5000, 'offline')
      );
      await Promise.all(chunkWrites);

      // Update main reference to point to chunks
      if (dataCopy.footer) {
        dataCopy.footer.pdfUrl = 'chunked://footerpdf';
      }
    }

    await withTimeout(setDoc(configDocRef, dataCopy), 5000, 'offline');
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, 'landing_pages/main');
  }
}

export function subscribeLandingPageData(callback: (data: LandingPageData) => void, onError?: (err: any) => void): () => void {
  const configDocRef = doc(db, 'landing_pages', 'main');
  
  return onSnapshot(configDocRef, async (docSnap) => {
    if (docSnap.exists()) {
      const dbData = docSnap.data() as Partial<LandingPageData>;
      
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
          ? { ...DEFAULT_PAGE_DATA.fehrmannStats, ...dbData.fehrmannStats }
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
