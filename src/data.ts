import { Service, Tool, ClientReference, ProcessStep } from './types';

export const SERVICES: Service[] = [
  {
    id: 'content-creation',
    title: 'Content Creation',
    description: 'Reels, Carousels und Stories, die echtes Vertrauen aufbauen, deine Wunschkunden fesseln und kaufbereite Anfragen generieren.',
    label: 'CREATE',
    isPrimary: true,
    features: ['Konzeptstarke Reels', 'Wertvolle Carousels', 'Interaktive Stories', 'Captions on Point'],
  },
  {
    id: 'strategy',
    title: 'Social-Media-Strategie',
    description: 'Klare Positionierung, tiefes Zielgruppenverständnis und ein maßgeschneiderter, strukturierter Content-Fahrplan für dein Business.',
    label: 'STRATEGY',
    features: ['Zielgruppen-Psychologie', 'Klare Positionierung', 'Maßgeschneiderter Fahrplan'],
  },
  {
    id: 'management',
    title: 'Account-Betreuung',
    description: 'Umfassende und nahtlose Veröffentlichung aller Formate komplett aus einer Hand, damit du dich zurücklehnen kannst.',
    label: 'MANAGE',
    features: ['Stressfreie Veröffentlichung', 'Konstante Präsenz', 'Zeitnahes Scheduling'],
  },
  {
    id: 'community',
    title: 'Community Management',
    description: 'Aktive Interaktion mit deinen Followern. Kommentare und DMs werden zeitnah und hochprofessionell in deinem Ton beantwortet.',
    label: 'ENGAGE',
    features: ['Aktive Lead-Interaktion', 'Schnelle DM-Antworten', 'Markenkonformer Ton'],
  },
  {
    id: 'analytics',
    title: 'Performance & Optimierung',
    description: 'Regelmäßige datenbasierte Auswertungen, um die Formate kontinuierlich zu optimieren und die Reichweite nachhaltig zu steigern.',
    label: 'ANALYZE',
    features: ['Datenbasierte Berichte', 'Conversion-Optimierung', 'Nachhaltiges Wachstum'],
  },
  {
    id: 'storyboard',
    title: 'Storyboard & Konzeption',
    description: 'Jedes Reel startet mit einem psychologischen Hook, klarem Plan, ausgearbeitetem Skript und einer fesselnden Storyline.',
    label: 'PLAN',
    features: ['Psychologische Hooks', 'Ausgearbeitete Skripte', 'Fesselndes Storytelling'],
  },
];

export const TOOLS: Tool[] = [
  {
    name: 'Canva Pro',
    description: 'Design und präzise strukturierte Templates für optisch herausragenden, verkaufsstarken Content.',
    iconName: 'Canva',
  },
  {
    name: 'Google Drive',
    description: 'Absolut strukturierte Zusammenarbeit, Asset-Freigaben und sicherer Dateiaustausch mit meinen Kunden.',
    iconName: 'Drive',
  },
  {
    name: 'CapCut',
    description: 'Verfeinerter, moderner Videoschnitt für komplexe Reels mit hervorragenden Übergängen und Effekten.',
    iconName: 'CapCut',
  },
  {
    name: 'Instagram Edits',
    description: 'Feinschliff und nativer Reels-Schnitt direkt in der Instagram-Umgebung für optimale Plattform-Anpassung.',
    iconName: 'Instagram',
  },
];

export const REFERENCES: ClientReference[] = [
  {
    name: 'Fehrmann Glas & Design',
    status: 'freigegeben',
    format: 'Reels + Carousels (Scrollender Marquee)',
    reelLink: 'https://www.instagram.com/reel/DaS9nyUMUEg/',
    testimonial: {
      text: 'Ich habe wenig Zeit für Social Media. Und weniger Ahnung. Herr Kusche nimmt mir alles ab. Nach vier Monaten sehe ich: neue Reichweite, neue Follower, wir werden gesehen und darüber gesprochen. Hochprofessionell, mit klarem Plan, wann, wie und wo. Der Satz für sein Honorar stimmt 100%. Wärmste Empfehlung.',
      author: 'Claudia Fehrmann',
      role: 'Inhaberin Fehrmann Glas & Design',
    },
  },
  {
    name: 'Rodizio',
    status: 'freigegeben',
    format: 'Ein einzelnes Reel als eingebettetes Video',
    reelLink: 'https://www.instagram.com/reel/DZkp0a0AYJ_/',
    testimonial: {
      text: 'Frischer Grill-Spieß direkt an deinen Tisch! 🔥🥩 Unfassbare Geschmacksexplosion bei uns. Kommt vorbei! #rodizio #barbecue #foodie',
      author: 'Rodizio',
      role: 'Restaurant',
    }
  },
  {
    name: 'Deutsches Eck, Mallorca',
    status: 'klaerung',
    format: 'Klärung nächste Woche vor Ort',
  },
];

export const PROCESS_STEPS: ProcessStep[] = [
  {
    stepNumber: 1,
    title: 'Unverbindliche Anfrage',
    description: 'Nimm Kontakt über WhatsApp oder das Formular auf. Schildere kurz deine aktuelle Social-Media-Situation.',
  },
  {
    stepNumber: 2,
    title: 'Kostenloses Erstgespräch',
    description: 'Wir besprechen in 30 Minuten deine Ziele, deine Zielgruppe und analysieren deinen aktuellen Auftritt auf Potenzial.',
  },
  {
    stepNumber: 3,
    title: 'Strategie & Angebot',
    description: 'Ich erstelle dir einen maßgeschneiderten Fahrplan sowie ein klares, transparentes Angebot für deine Betreuung.',
  },
  {
    stepNumber: 4,
    title: 'Erfolgreich loslegen',
    description: 'Nach dem Onboarding übernehme ich das Steuer. Du kannst dich vollkommen entspannt auf deine Kernkompetenzen konzentrieren.',
  },
];
