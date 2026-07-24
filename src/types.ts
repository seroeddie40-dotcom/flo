export interface Service {
  id: string;
  title: string;
  description: string;
  label: string; // CREATE, STRATEGY, MANAGE, ENGAGE, ANALYZE, PLAN
  isPrimary?: boolean;
  features?: string[];
}

export interface Tool {
  name: string;
  description: string;
  iconName: 'Canva' | 'Drive' | 'CapCut' | 'Instagram';
}

export interface PostImage {
  imageUrl: string;
  instagramLink: string;
  type?: 'post' | 'reel' | 'story';
  title?: string;
}

export interface ClientReference {
  name: string;
  status: 'freigegeben' | 'ausstehend' | 'klaerung';
  format: string;
  imageUrl?: string;
  logoUrl?: string;
  mediaType?: 'image' | 'video' | 'none';
  reelLink?: string;
  videoDisplayMode?: 'link' | 'embedded'; // 'link' = show Reel as clickable link/button, 'embedded' = embed directly as player (uploaded video or iframe)
  isSpotlight?: boolean;
  testimonial?: {
    text: string;
    author: string;
    role: string;
  };
  reelPosition?: 'left' | 'right';
  postImages?: PostImage[];
  showStats?: boolean;
  stats?: {
    aufrufe: string;
    reichweite: string;
    interaktion: string;
  };
  highlightReelTitle?: string;
  highlightReelText?: string;
  sichtbarkeitTitle?: string;
  sichtbarkeitText?: string;
}

export interface ProcessStep {
  stepNumber: number;
  title: string;
  description: string;
}

export interface HeroConfig {
  logoText: string;
  logoSubtext: string;
  eyebrow: string;
  headline: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  checklist: string[];
}

export interface BetweenSectionImageConfig {
  imageUrl: string;
  width: number;
  borderRadius: 'none' | 'md' | 'xl' | 'full';
  alignment: 'left' | 'center' | 'right';
  marginTop: number;
  marginBottom: number;
  enabled: boolean;
}

export interface FooterConfig {
  phone: string;
  email: string;
  instagram: string;
  location: string;
  pdfUrl?: string;
  pdfFilename?: string;
  imprintText?: string;
  privacyText?: string;
  contactEyebrow?: string;
  contactTitle?: string;
  contactText?: string;
  contactWaLabel?: string;
  contactWaSubtext?: string;
  contactEmailLabel?: string;
  contactEmailSubtext?: string;
  contactIgLabel?: string;
  contactIgSubtext?: string;
}

export interface OnePagerStep {
  label: string;
  percentage: number;
}

export interface OnePagerConfig {
  eyebrow: string;
  ownerName: string;
  title: string;
  description: string;
  steps: OnePagerStep[];
  calloutText: string;
  buttonLabel: string;
  viewButtonLabel?: string;
  subButtonLabel: string;
  bottomDirectionsText: string;
  documentUrl?: string;
  documentFilename?: string;
}

export interface ServiceTextSection {
  eyebrow?: string;
  title?: string;
  text: string;
}

export interface ServicesSectionConfig {
  eyebrow: string;
  title: string;
  descriptions: (string | ServiceTextSection)[];
  upgradeBannerEnabled?: boolean;
  upgradeBannerEyebrow?: string;
  upgradeBannerTitle?: string;
  upgradeBannerText?: string;
  upgradeBannerButtonText?: string;
  upgradeBannerButtonUrl?: string;
}

export interface ColorConfig {
  accent: string;
  accentBrightness: number;
  brandDark: string;
  brandDarkBrightness: number;
  brandDarker: string;
  brandDarkerBrightness: number;
  brandDarkCard: string;
  brandDarkCardBrightness: number;
}

export interface AboutFeature {
  title: string;
  text: string;
}

export interface AboutSectionConfig {
  enabled: boolean;
  eyebrow?: string;
  title?: string;
  text?: string;
  imageUrl?: string;
  imageEnabled?: boolean;
  feature1Title?: string;
  feature1Text?: string;
  feature2Title?: string;
  feature2Text?: string;
  features?: AboutFeature[];
}

export interface TrustBlockConfig {
  title?: string;
  subtitle?: string;
  paragraph1?: string;
  paragraph2?: string;
  buttonLabel?: string;
  buttonText?: string;
}

export interface ProjectSupportPackage {
  id: string;
  title: string;
  description: string;
}

export interface ProjectSupportConfig {
  enabled?: boolean;
  eyebrow?: string;
  title?: string;
  description?: string;
  packages?: ProjectSupportPackage[];
  noteText?: string;
  buttonText?: string;
}

export interface LandingPageData {
  isFallback?: boolean;
  hero: HeroConfig;
  services: Service[];
  tools: Tool[];
  references: ClientReference[];
  processes: ProcessStep[];
  footer: FooterConfig;
  betweenSectionImage?: BetweenSectionImageConfig;
  contactImage?: BetweenSectionImageConfig;
  onePager?: OnePagerConfig;
  servicesSection?: ServicesSectionConfig;
  projectSupport?: ProjectSupportConfig;
  colors?: ColorConfig;
  about?: AboutSectionConfig;
  trustBlock?: TrustBlockConfig;
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
  calendly?: {
    calendlyUrl?: string;
    calendlyToken?: string;
    isConnected?: boolean;
    connectedEmail?: string;
    syncInterval?: string;
    bookings?: {
      id: string;
      name: string;
      email: string;
      eventType: string;
      dateTime: string;
      status: 'confirmed' | 'canceled';
      notes?: string;
    }[];
  };
}
