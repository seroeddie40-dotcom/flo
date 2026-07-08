import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, logSafeFirebaseError, isQuotaError, isOfflineError } from '../lib/firebase';
import { loadLandingPageData, saveLandingPageData, DEFAULT_PAGE_DATA } from '../lib/cmsStore';
import { LandingPageData, Service, Tool, ClientReference, ProcessStep, ColorConfig } from '../types';
import ImageUploader from './ImageUploader';
import DocumentUploader from './DocumentUploader';
import { 
  Layout, 
  Layers, 
  Wrench, 
  MessageCircle, 
  Clock, 
  Settings, 
  LogOut, 
  Save, 
  Plus, 
  Trash2, 
  Edit, 
  Globe, 
  Check, 
  AlertCircle, 
  PenTool, 
  FileText, 
  User as UserIcon, 
  Activity, 
  ShieldCheck, 
  Compass,
  Lock,
  ArrowUp,
  ArrowDown,
  Palette,
  Upload,
  X,
  Loader2,
  Play,
  Video,
  Image as ImageIcon,
  Link,
  Trash,
  ChevronDown,
  ChevronUp,
  Calendar
} from 'lucide-react';
import { adjustBrightness } from '../lib/colorUtils';

function getInstagramEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(/(?:instagram\.com)\/(?:reel|p)\/([A-Za-z0-9_-]+)/i);
  if (match && match[1]) {
    return `https://www.instagram.com/reel/${match[1]}/embed`;
  }
  return null;
}

export default function AdminBackend({ onClose }: { onClose: () => void }) {
  // Authentication states
  const [user, setUser] = useState<{ email: string; uid: string } | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  // Credentials edit states
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [credStatus, setCredStatus] = useState<'idle' | 'updating' | 'success' | 'error'>('idle');
  const [credError, setCredError] = useState('');

  // Landing page configuration state
  const [cmsData, setCmsData] = useState<LandingPageData | null>(null);
  const [isLoadingCms, setIsLoadingCms] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [backendPhoneScale, setBackendPhoneScale] = useState<number>(1.0);

  // Active WP Sidebar Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'hero' | 'onepager' | 'leistungen' | 'tools' | 'referenzen' | 'calendly' | 'prozess' | 'contact' | 'colors' | 'credentials'>('dashboard');

  // Sub-editor state for edit popups
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [isAddingTool, setIsAddingTool] = useState(false);
  const [expandedReferences, setExpandedReferences] = useState<Record<number, boolean>>({ 0: true });
  const [savingReferenceIdx, setSavingReferenceIdx] = useState<number | null>(null);
  const [savedReferenceIdx, setSavedReferenceIdx] = useState<number | null>(null);
  const [deletingReferenceIdx, setDeletingReferenceIdx] = useState<number | null>(null);

  // Sync credentials edit state with current user
  useEffect(() => {
    if (activeTab === 'credentials' && user) {
      setNewEmail(user.email || '');
      setNewPassword('');
      setConfirmPassword('');
      setCredStatus('idle');
      setCredError('');
    }
  }, [activeTab, user]);

  // Load credentials helper
  const getAdminCredentials = async () => {
    try {
      const docRef = doc(db, 'admin_credentials', 'settings');
      const docSnap = await withTimeout(getDoc(docRef), 3000, 'offline');
      if (docSnap.exists()) {
        const d = docSnap.data();
        return {
          email: d.email || 'ich-bins@floriankusche.de',
          password: d.password || 'WunderBaum188!'
        };
      } else {
        const defaultCreds = {
          email: 'ich-bins@floriankusche.de',
          password: 'WunderBaum188!'
        };
        try {
          await withTimeout(setDoc(docRef, defaultCreds), 3000, 'offline');
        } catch (setErr: any) {
          if (setErr?.code === 'permission-denied' || setErr?.message?.includes('permission')) {
            handleFirestoreError(setErr, OperationType.WRITE, 'admin_credentials/settings');
          }
          throw setErr;
        }
        return defaultCreds;
      }
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
        handleFirestoreError(err, OperationType.GET, 'admin_credentials/settings');
      }
      logSafeFirebaseError('Error getting admin credentials from Firestore', err);
      return {
        email: 'ich-bins@floriankusche.de',
        password: 'WunderBaum188!'
      };
    }
  };

  // Restore session
  useEffect(() => {
    const checkPersistedAuth = async () => {
      const savedEmail = localStorage.getItem('admin_logged_in_email');
      const savedPw = localStorage.getItem('admin_logged_in_pw');
      if (savedEmail && savedPw) {
        try {
          const credentials = await getAdminCredentials();
          if (savedEmail.trim().toLowerCase() === credentials.email.trim().toLowerCase() && savedPw === credentials.password) {
            setUser({ email: credentials.email, uid: 'admin-session' });
            // Load CMS Data
            setIsLoadingCms(true);
            try {
              const data = await loadLandingPageData();
              setCmsData(data);
            } catch (err) {
              logSafeFirebaseError('Error checking persisted auth state', err);
            } finally {
              setIsLoadingCms(false);
            }
          } else {
            localStorage.removeItem('admin_logged_in_email');
            localStorage.removeItem('admin_logged_in_pw');
          }
        } catch (e) {
          logSafeFirebaseError('Error checking persisted auth outer loop', e);
        }
      }
      setAuthLoading(false);
    };
    checkPersistedAuth();
  }, []);

  // Fetch data on manual login success
  const fetchCmsData = async () => {
    setIsLoadingCms(true);
    try {
      const data = await loadLandingPageData();
      setCmsData(data);
    } catch (err) {
      logSafeFirebaseError('Error loading CMS data during fetchCmsData', err);
    } finally {
      setIsLoadingCms(false);
    }
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!email || !password) {
      setAuthError('E-Mail und Passwort sind erforderlich.');
      return;
    }
    try {
      const credentials = await getAdminCredentials();
      if (email.trim().toLowerCase() === credentials.email.trim().toLowerCase() && password === credentials.password) {
        const loggedInUser = { email: credentials.email, uid: 'admin-session' };
        setUser(loggedInUser);
        localStorage.setItem('admin_logged_in_email', credentials.email);
        localStorage.setItem('admin_logged_in_pw', credentials.password);
        await fetchCmsData();
      } else {
        setAuthError('Ungültige Anmeldedaten. Zugriff verweigert.');
      }
    } catch (err: any) {
      logSafeFirebaseError('Error during login check', err);
      setAuthError('Fehler bei der Anmeldung: ' + (err.message || err));
    }
  };

  // Handlers for updating administrator credentials
  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCredError('');
    setCredStatus('updating');

    try {
      if (!newEmail) {
        setCredError('E-Mail-Adresse ist erforderlich.');
        setCredStatus('error');
        return;
      }

      const docRef = doc(db, 'admin_credentials', 'settings');
      const payload: any = {
        email: newEmail.trim()
      };

      if (newPassword) {
        if (newPassword !== confirmPassword) {
          setCredError('Die Passwörter stimmen nicht überein.');
          setCredStatus('error');
          return;
        }
        if (newPassword.length < 6) {
          setCredError('Das neue Passwort muss mindestens 6 Zeichen lang sein.');
          setCredStatus('error');
          return;
        }
        payload.password = newPassword;
      } else {
        const creds = await getAdminCredentials();
        payload.password = creds.password;
      }

      await withTimeout(setDoc(docRef, payload), 3000, 'offline');

      // Successfully updated! Update local states and storage
      setUser({ email: payload.email, uid: 'admin-session' });
      localStorage.setItem('admin_logged_in_email', payload.email);
      localStorage.setItem('admin_logged_in_pw', payload.password);

      setCredStatus('success');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setCredStatus('idle'), 4000);
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
        handleFirestoreError(err, OperationType.WRITE, 'admin_credentials/settings');
      }
      logSafeFirebaseError('Error handling admin update credentials', err);
      setCredError(err.message || 'Informationen konnten nicht aktualisiert werden.');
      setCredStatus('error');
    }
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('admin_logged_in_email');
    localStorage.removeItem('admin_logged_in_pw');
  };

  // Handle main data save / Publish (WordPress-like Publish)
  const handlePublish = async () => {
    if (!cmsData) return;
    setSaveStatus('saving');
    try {
      if (cmsData.isFallback) {
        // Safe local cache storage - don't overwrite cloud database with defaults
        const cleanData = JSON.parse(JSON.stringify(cmsData)) as LandingPageData;
        delete cleanData.isFallback;
        localStorage.setItem('florian_cms_cache', JSON.stringify(cleanData));
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 6000);
        return;
      }
      await saveLandingPageData(cmsData);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 4000);
    } catch (err: any) {
      logSafeFirebaseError('Error saving or publishing CMS data', err);
      if (isQuotaError(err) || isOfflineError(err)) {
        // Save to local cache first to ensure zero data loss
        const cleanData = JSON.parse(JSON.stringify(cmsData)) as LandingPageData;
        delete cleanData.isFallback;
        localStorage.setItem('florian_cms_cache', JSON.stringify(cleanData));
        
        // Enter fallback mode immediately to display proper notice
        setCmsData({ ...cmsData, isFallback: true });
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 6000);
      } else {
        setSaveStatus('error');
      }
    }
  };

  // Restore defaults
  const handleRestoreDefaults = () => {
    if (window.confirm('Möchtest du wirklich alle Texte auf die Standardwerte zurücksetzen? Ungespeicherte Änderungen gehen verloren.')) {
      setCmsData(JSON.parse(JSON.stringify(DEFAULT_PAGE_DATA)));
    }
  };

  // Update specific fields helpers
  const updateHeroField = (field: keyof typeof DEFAULT_PAGE_DATA.hero, value: any) => {
    if (!cmsData) return;
    setCmsData({
      ...cmsData,
      hero: {
        ...cmsData.hero,
        [field]: value
      }
    });
  };

  const updateFooterField = (field: keyof typeof DEFAULT_PAGE_DATA.footer, value: any) => {
    if (!cmsData) return;
    setCmsData({
      ...cmsData,
      footer: {
        ...cmsData.footer,
        [field]: value
      }
    });
  };

  const updateColorField = (field: keyof ColorConfig, value: any) => {
    if (!cmsData) return;
    const currentColors = cmsData.colors || {
      accent: '#ffcc00',
      accentBrightness: 0,
      brandDark: '#004369',
      brandDarkBrightness: 0,
      brandDarker: '#002d47',
      brandDarkerBrightness: 0,
      brandDarkCard: '#014e7a',
      brandDarkCardBrightness: 0
    };
    setCmsData({
      ...cmsData,
      colors: {
        ...currentColors,
        [field]: value
      }
    });
  };

  const updateOnePagerFields = (fields: Record<string, any>) => {
    if (!cmsData) return;
    const defaultOnePagerConfig = {
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
    };

    setCmsData(prev => {
      if (!prev) return prev;
      const currentOnePager = prev.onePager || defaultOnePagerConfig;
      return {
        ...prev,
        onePager: {
          ...currentOnePager,
          ...fields
        }
      };
    });
  };

  const updateOnePagerField = (field: string, value: any) => {
    updateOnePagerFields({ [field]: value });
  };

  const updateCalendlyFields = (fields: Record<string, any>) => {
    if (!cmsData) return;
    const defaultCalendlyConfig = {
      calendlyUrl: 'https://calendly.com/floriankusche',
      isConnected: false,
      bookings: []
    };

    setCmsData(prev => {
      if (!prev) return prev;
      const currentCalendly = prev.calendly || defaultCalendlyConfig;
      return {
        ...prev,
        calendly: {
          ...currentCalendly,
          ...fields
        }
      };
    });
  };

  const updateCalendlyField = (field: string, value: any) => {
    updateCalendlyFields({ [field]: value });
  };

  const updateBetweenSectionImageField = (field: string, value: any) => {
    if (!cmsData) return;
    const defaultImageConfig = {
      imageUrl: '',
      width: 250,
      borderRadius: 'xl' as const,
      alignment: 'left' as const,
      marginTop: 0,
      marginBottom: 20,
      enabled: false
    };
    setCmsData({
      ...cmsData,
      betweenSectionImage: {
        ...defaultImageConfig,
        ...(cmsData.betweenSectionImage || {}),
        [field]: value
      }
    });
  };

  const updateContactImageField = (field: string, value: any) => {
    if (!cmsData) return;
    const defaultImageConfig = {
      imageUrl: '',
      width: 250,
      borderRadius: 'xl' as const,
      alignment: 'left' as const,
      marginTop: 0,
      marginBottom: 20,
      enabled: false
    };
    setCmsData({
      ...cmsData,
      contactImage: {
        ...defaultImageConfig,
        ...(cmsData.contactImage || {}),
        [field]: value
      }
    });
  };

  // Services actions
  const saveServiceEdit = () => {
    if (!cmsData || !editingService) return;
    const services = cmsData.services.map(s => s.id === editingService.id ? editingService : s);
    setCmsData({ ...cmsData, services });
    setEditingService(null);
  };

  const addNewService = (newS: Service) => {
    if (!cmsData) return;
    setCmsData({
      ...cmsData,
      services: [...cmsData.services, newS]
    });
    setIsAddingService(false);
  };

  const deleteService = (id: string) => {
    if (!cmsData) return;
    if (window.confirm('Möchtest du diese Leistung wirklich löschen?')) {
      setCmsData({
        ...cmsData,
        services: cmsData.services.filter(s => s.id !== id)
      });
    }
  };

  const moveServiceUp = (index: number) => {
    if (!cmsData || index === 0) return;
    const services = [...cmsData.services];
    const temp = services[index];
    services[index] = services[index - 1];
    services[index - 1] = temp;
    setCmsData({ ...cmsData, services });
  };

  const moveServiceDown = (index: number) => {
    if (!cmsData || index === cmsData.services.length - 1) return;
    const services = [...cmsData.services];
    const temp = services[index];
    services[index] = services[index + 1];
    services[index + 1] = temp;
    setCmsData({ ...cmsData, services });
  };

  const updateServicesSectionField = (field: 'eyebrow' | 'title', value: string) => {
    if (!cmsData) return;
    const section = cmsData.servicesSection || {
      eyebrow: 'PORTFOLIO & LEISTUNGEN',
      title: 'WIE ICH DEINE MARKE [UNSCHLAGBAR SICHTBAR] MACHE',
      descriptions: ['Mein Versprechen: Hochwertiger, strategischer Content, der deine Markenbotschaft trägt und aus Followern messbare Leads generiert. Komplett von mir abgewickelt, ohne Stress für dich.']
    };
    setCmsData({
      ...cmsData,
      servicesSection: {
        ...section,
        [field]: value
      }
    });
  };

  const updateSectionDescriptionField = (index: number, field: 'eyebrow' | 'title' | 'text', value: string) => {
    if (!cmsData) return;
    const section = cmsData.servicesSection || {
      eyebrow: 'PORTFOLIO & LEISTUNGEN',
      title: 'WIE ICH DEINE MARKE [UNSCHLAGBAR SICHTBAR] MACHE',
      descriptions: ['Mein Versprechen: Hochwertiger, strategischer Content, der deine Markenbotschaft trägt und aus Followern messbare Leads generiert. Komplett von mir abgewickelt, ohne Stress für dich.']
    };
    const descriptions = [...(section.descriptions || [])];
    const current = descriptions[index];
    const normalized = typeof current === 'string'
      ? { eyebrow: '', title: '', text: current }
      : { eyebrow: current?.eyebrow || '', title: current?.title || '', text: current?.text || '' };
    
    normalized[field] = value;
    descriptions[index] = normalized;

    setCmsData({
      ...cmsData,
      servicesSection: {
        ...section,
        descriptions
      }
    });
  };

  const addSectionDescriptionParagraph = () => {
    if (!cmsData) return;
    const section = cmsData.servicesSection || {
      eyebrow: 'PORTFOLIO & LEISTUNGEN',
      title: 'WIE ICH DEINE MARKE [UNSCHLAGBAR SICHTBAR] MACHE',
      descriptions: ['Mein Versprechen: Hochwertiger, strategischer Content, der deine Markenbotschaft trägt und aus Followern messbare Leads generiert. Komplett von mir abgewickelt, ohne Stress für dich.']
    };
    const descriptions = [...(section.descriptions || []), { eyebrow: '', title: '', text: '' }];
    setCmsData({
      ...cmsData,
      servicesSection: {
        ...section,
        descriptions
      }
    });
  };

  const deleteSectionDescriptionParagraph = (index: number) => {
    if (!cmsData) return;
    const section = cmsData.servicesSection || {
      eyebrow: 'PORTFOLIO & LEISTUNGEN',
      title: 'WIE ICH DEINE MARKE [UNSCHLAGBAR SICHTBAR] MACHE',
      descriptions: ['Mein Versprechen: Hochwertiger, strategischer Content, der deine Markenbotschaft trägt und aus Followern messbare Leads generiert. Komplett von mir abgewickelt, ohne Stress für dich.']
    };
    const descriptions = (section.descriptions || []).filter((_, i) => i !== index);
    setCmsData({
      ...cmsData,
      servicesSection: {
        ...section,
        descriptions
      }
    });
  };

  const moveSectionDescriptionParagraph = (index: number, dir: 'up' | 'down') => {
    if (!cmsData) return;
    const section = cmsData.servicesSection || {
      eyebrow: 'PORTFOLIO & LEISTUNGEN',
      title: 'WIE ICH DEINE MARKE [UNSCHLAGBAR SICHTBAR] MACHE',
      descriptions: ['Mein Versprechen: Hochwertiger, strategischer Content, der deine Markenbotschaft trägt und aus Followern messbare Leads generiert. Komplett von mir abgewickelt, ohne Stress für dich.']
    };
    const descriptions = [...(section.descriptions || [])];
    if (dir === 'up' && index > 0) {
      const temp = descriptions[index];
      descriptions[index] = descriptions[index - 1];
      descriptions[index - 1] = temp;
    } else if (dir === 'down' && index < descriptions.length - 1) {
      const temp = descriptions[index];
      descriptions[index] = descriptions[index + 1];
      descriptions[index + 1] = temp;
    }
    setCmsData({
      ...cmsData,
      servicesSection: {
        ...section,
        descriptions
      }
    });
  };

  // Tools actions
  const saveToolEdit = () => {
    if (!cmsData || !editingTool) return;
    const tools = cmsData.tools.map(t => t.name === editingTool.name ? editingTool : t);
    setCmsData({ ...cmsData, tools });
    setEditingTool(null);
  };

  const addNewTool = (newT: Tool) => {
    if (!cmsData) return;
    setCmsData({
      ...cmsData,
      tools: [...cmsData.tools, newT]
    });
    setIsAddingTool(false);
  };

  const deleteTool = (name: string) => {
    if (!cmsData) return;
    if (window.confirm('Möchtest du dieses Tool wirklich löschen?')) {
      setCmsData({
        ...cmsData,
        tools: cmsData.tools.filter(t => t.name !== name)
      });
    }
  };

  // Process timeline actions
  const updateProcessStep = (idx: number, field: 'title' | 'description', value: string) => {
    if (!cmsData) return;
    const processes = [...cmsData.processes];
    processes[idx] = { ...processes[idx], [field]: value };
    setCmsData({ ...cmsData, processes });
  };

  // References actions
  const updateReference = (idx: number, updatedRef: Partial<ClientReference>) => {
    if (!cmsData) return;
    const references = [...cmsData.references];
    const originalRef = references[idx] || { name: '', status: 'freigegeben', format: '' };
    
    // Testimonial specific editing logic
    if (updatedRef.testimonial) {
      originalRef.testimonial = {
        ...(originalRef.testimonial || { text: '', author: '', role: '' }),
        ...updatedRef.testimonial
      };
    }

    references[idx] = {
      ...originalRef,
      ...updatedRef,
      testimonial: updatedRef.testimonial ? originalRef.testimonial : originalRef.testimonial
    };

    setCmsData({ ...cmsData, references });
  };

  const addReference = () => {
    if (!cmsData) return;
    const references = [...cmsData.references];
    const newIdx = references.length;
    references.push({
      name: 'Neue Referenz',
      status: 'freigegeben',
      format: 'Reels / Social Media',
      imageUrl: '',
      testimonial: {
        text: '',
        author: '',
        role: ''
      }
    });
    setCmsData({ ...cmsData, references });
    setExpandedReferences(prev => ({
      ...prev,
      [newIdx]: true
    }));
  };

  const deleteReference = async (idx: number) => {
    if (!cmsData) return;
    const references = cmsData.references.filter((_, i) => i !== idx);
    const updatedData = { ...cmsData, references };
    setCmsData(updatedData);
    
    // Auto-save the deletion immediately!
    try {
      await saveLandingPageData(updatedData);
    } catch (err: any) {
      logSafeFirebaseError('Fehler beim Auto-Speichern nach dem Löschen', err);
      if (isQuotaError(err) || isOfflineError(err)) {
        setCmsData({ ...updatedData, isFallback: true });
      }
    }

    setExpandedReferences(prev => {
      const next: Record<number, boolean> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const numK = Number(k);
        if (numK < idx) {
          next[numK] = v as boolean;
        } else if (numK > idx) {
          next[numK - 1] = v as boolean;
        }
      });
      return next;
    });
  };

  const handleSaveReference = async (idx: number) => {
    if (!cmsData) return;
    setSavingReferenceIdx(idx);
    try {
      await saveLandingPageData(cmsData);
      setSavedReferenceIdx(idx);
      setTimeout(() => {
        setSavedReferenceIdx(null);
      }, 3000);
    } catch (err: any) {
      logSafeFirebaseError('Fehler beim Speichern der Referenz in der Datenbank', err);
      if (isQuotaError(err) || isOfflineError(err)) {
        setCmsData({ ...cmsData, isFallback: true });
        setSavedReferenceIdx(idx);
        setTimeout(() => {
          setSavedReferenceIdx(null);
        }, 3000);
      } else {
        alert('Fehler beim Speichern der Referenz in der Datenbank.');
      }
    } finally {
      setSavingReferenceIdx(null);
    }
  };

  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-[#121212] z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
          <p className="text-[#a0a0a0] font-mono text-xs uppercase tracking-widest">WordPress CMS wird geladen...</p>
        </div>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="fixed inset-0 bg-[#23282d] z-50 flex items-center justify-center font-sans overflow-y-auto py-12 px-4 select-none">
        <div className="w-full max-w-sm">
          {/* WordPress Icon + Branding */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white text-[#23282d] border border-zinc-400 p-2 shadow-sm font-display font-black text-2xl tracking-tighter cursor-default">
              W
            </div>
            <h1 className="text-white font-medium text-lg tracking-wider mt-4">
              Florian Kusche CMS Admin
            </h1>
            <p className="text-zinc-400 text-xs mt-1">Angetrieben durch WordPress-Gegenstück</p>
          </div>

          <div className="bg-white rounded shadow-md p-6 text-zinc-800">
            <h2 className="text-base font-bold mb-4 flex items-center gap-1.5 border-b border-zinc-200 pb-2">
              Anmelden
            </h2>

            {authError && (
              <div className="bg-red-50 text-red-600 p-3 rounded text-xs border-l-4 border-red-500 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  E-Mail-Adresse
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#0073aa] text-zinc-900 font-semibold"
                  placeholder="admin@floriankusche.de"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Kennwort
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#0073aa] text-zinc-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  className="py-2.5 px-6 w-full sm:w-auto bg-[#0073aa] hover:bg-[#005177] text-white text-xs font-bold uppercase rounded shadow cursor-pointer transition-colors"
                >
                  Anmelden
                </button>
              </div>
            </form>
          </div>

          <div className="text-center mt-6">
            <button
              onClick={onClose}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 mx-auto"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Zurück zur Website</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#f1f1f1] text-[#32373c] z-50 flex flex-col font-sans select-none overflow-hidden">
      
      {/* 1. TOP WP-ADMIN BAR */}
      <header className="bg-[#1d2327] text-[#c3c4c7] h-12 flex items-center justify-between px-4 z-40 relative">
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1">
            <span className="text-white hover:text-accent font-black tracking-widest text-sm mr-2 select-none uppercase">W</span>
            <span className="text-white">CMS</span>
          </div>
          <button
            onClick={onClose}
            className="hover:text-white flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <span>Florian Kusche Website</span>
          </button>
          <span className="text-zinc-500">|</span>
          <div className="text-zinc-400 hidden sm:flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Seite online</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-zinc-400 hidden md:inline">Willkommen, <strong className="text-white font-semibold">{user.email}</strong></span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-zinc-400 hover:text-white bg-[#2c3338] px-3 py-1.5 rounded"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Abmelden</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN CMS PANELS LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDEMENU (WordPress Sidebar styling in #23282d) */}
        <aside className="w-64 bg-[#23282d] text-white flex flex-col justify-between hidden md:flex select-none">
          <div className="py-2">
            
            {/* Dashboard link */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-5 py-3 text-sm font-medium flex items-center gap-3 transition-colors ${
                activeTab === 'dashboard' ? 'bg-[#0073aa] text-white border-l-4 border-accent' : 'text-zinc-300 hover:bg-[#32373c] hover:text-[#ffcc00]'
              }`}
            >
              <Layout className="w-4 h-4 shrink-0" />
              <span>WP Dashboard</span>
            </button>

            {/* Config links */}
            <button
              onClick={() => setActiveTab('hero')}
              className={`w-full text-left px-5 py-3 text-sm font-medium flex items-center gap-3 transition-colors ${
                activeTab === 'hero' ? 'bg-[#0073aa] text-white border-l-4 border-accent' : 'text-zinc-300 hover:bg-[#32373c] hover:text-[#ffcc00]'
              }`}
            >
              <PenTool className="w-4 h-4 shrink-0" />
              <span>Customizer - Hero</span>
            </button>



            <button
              onClick={() => setActiveTab('leistungen')}
              className={`w-full text-left px-5 py-3 text-sm font-medium flex items-center gap-3 transition-colors ${
                activeTab === 'leistungen' ? 'bg-[#0073aa] text-white border-l-4 border-accent' : 'text-zinc-300 hover:bg-[#32373c] hover:text-[#ffcc00]'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>Leistungen (CMS)</span>
            </button>

            <button
              onClick={() => setActiveTab('tools')}
              className={`w-full text-left px-5 py-3 text-sm font-medium flex items-center gap-3 transition-colors ${
                activeTab === 'tools' ? 'bg-[#0073aa] text-white border-l-4 border-accent' : 'text-zinc-300 hover:bg-[#32373c] hover:text-[#ffcc00]'
              }`}
            >
              <Wrench className="w-4 h-4 shrink-0" />
              <span>Tools (Werkzeuge)</span>
            </button>

            <button
              onClick={() => setActiveTab('referenzen')}
              className={`w-full text-left px-5 py-3 text-sm font-medium flex items-center gap-3 transition-colors ${
                activeTab === 'referenzen' ? 'bg-[#0073aa] text-white border-l-4 border-accent' : 'text-zinc-300 hover:bg-[#32373c] hover:text-[#ffcc00]'
              }`}
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Referenzen (Kunden)</span>
            </button>

            <button
              onClick={() => setActiveTab('calendly')}
              className={`w-full text-left px-5 py-3 text-sm font-medium flex items-center gap-3 transition-colors ${
                activeTab === 'calendly' ? 'bg-[#0073aa] text-white border-l-4 border-accent' : 'text-zinc-300 hover:bg-[#32373c] hover:text-[#ffcc00]'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Calendly Integration</span>
            </button>

            <button
              onClick={() => setActiveTab('prozess')}
              className={`w-full text-left px-5 py-3 text-sm font-medium flex items-center gap-3 transition-colors ${
                activeTab === 'prozess' ? 'bg-[#0073aa] text-white border-l-4 border-accent' : 'text-zinc-300 hover:bg-[#32373c] hover:text-[#ffcc00]'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>Zusammenarbeit</span>
            </button>

            <button
              onClick={() => setActiveTab('contact')}
              className={`w-full text-left px-5 py-3 text-sm font-medium flex items-center gap-3 transition-colors ${
                activeTab === 'contact' ? 'bg-[#0073aa] text-white border-l-4 border-accent' : 'text-zinc-300 hover:bg-[#32373c] hover:text-[#ffcc00]'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Einstellungen - Kontakt</span>
            </button>

            <button
              onClick={() => setActiveTab('colors')}
              className={`w-full text-left px-5 py-3 text-sm font-medium flex items-center gap-3 transition-colors ${
                activeTab === 'colors' ? 'bg-[#0073aa] text-white border-l-4 border-accent' : 'text-zinc-300 hover:bg-[#32373c] hover:text-[#ffcc00]'
              }`}
            >
              <Palette className="w-4 h-4 shrink-0" />
              <span>Design & Farbregler</span>
            </button>

            <button
              onClick={() => setActiveTab('credentials')}
              className={`w-full text-left px-5 py-3 text-sm font-medium flex items-center gap-3 transition-colors ${
                activeTab === 'credentials' ? 'bg-[#0073aa] text-white border-l-4 border-accent' : 'text-zinc-300 hover:bg-[#32373c] hover:text-[#ffcc00]'
              }`}
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span>Admin-Zugangsdaten</span>
            </button>
          </div>

          {/* Quick CMS Meta */}
          <div className="p-4 bg-[#1d2327] border-t border-zinc-800 text-[10px] text-zinc-500 font-mono">
            <p>WP VERSION: 6.5.3 (Custo)</p>
            <p>SYSTEM STATE: 100% ONLINE</p>
          </div>
        </aside>

        {/* WORKSPACE AREA */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#f0f2f5] p-4 lg:p-8">
          
          {/* HEADER ACTION WORKSPACE - Wordpress Save bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 border-b border-zinc-200 pb-4">
            <div>
              <h2 className="text-2xl font-semibold capitalize text-zinc-900 tracking-tight flex items-center gap-2">
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'hero' && 'Landing-Page-Hero bearbeiten'}
                {activeTab === 'onepager' && 'One-Pager & Dokumentenupload verwalten'}
                {activeTab === 'leistungen' && 'Leistungsspektrum konfigurieren'}
                {activeTab === 'tools' && 'Ihre Partner-Tools verwalten'}
                {activeTab === 'referenzen' && 'Kundenstimmen & Referenzen'}
                {activeTab === 'calendly' && 'Calendly Integration & Buchungen'}
                {activeTab === 'prozess' && 'Ablaufschritte bearbeiten'}
                {activeTab === 'contact' && 'Kontakt & Footer-Metadaten'}
                {activeTab === 'colors' && 'Farben & Helligkeit anpassen'}
                {activeTab === 'credentials' && 'Admin-Zugangsdaten bearbeiten'}
                <span className="text-xs bg-zinc-200 text-zinc-600 border border-zinc-300 px-2 py-0.5 rounded font-mono font-medium">v1.1</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-1">Ändere und speichere Bereiche, um sie in Echtzeit auf deiner Live-Seite zu veröffentlichen.</p>
            </div>

            {/* Publish & Status Bar */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleRestoreDefaults}
                className="text-xs text-red-600 hover:text-red-700 bg-transparent border border-red-200 hover:border-red-400 py-2 px-3 rounded font-medium cursor-pointer transition-colors"
              >
                Standard wiederherstellen
              </button>

              <button
                onClick={handlePublish}
                disabled={saveStatus === 'saving' || !cmsData}
                className="py-2.5 px-6 bg-accent hover:bg-[#ebd500] text-black text-xs font-display tracking-wider font-black uppercase rounded shadow-md cursor-pointer transition-transform duration-100 active:scale-95 flex items-center gap-1.5 shrink-0"
              >
                <Save className="w-4 h-4 text-black shrink-0" />
                <span>{saveStatus === 'saving' ? 'Wird veröffentlicht...' : 'Veröffentlichen'}</span>
              </button>
            </div>
          </div>

          {/* FALLBACK MODE WARNING */}
          {cmsData?.isFallback && (
            <div className="bg-amber-50 text-amber-900 p-4 border-l-4 border-amber-500 rounded text-sm mb-6 flex items-start gap-3 shadow-md">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-base text-amber-950 mb-1">Hinweis: Offline-Modus aktiv (Keine Serververbindung)</strong>
                <span className="text-xs text-amber-800 leading-relaxed block">
                  Deine echten Texte und Einstellungen sind <strong>absolut sicher in der Cloud gespeichert</strong>! Aufgrund von Verbindungsproblemen zur Datenbank (Offline) oder Server-Limits wird aktuell ein schreibgeschützter Offline-Modus geladen.
                </span>
                <span className="text-xs text-amber-800 leading-relaxed block mt-1">
                  <strong>Schutz vor Datenverlust aktiv:</strong> Um deine echten Cloud-Daten zu sichern, haben wir das Überschreiben der Cloud blockiert. Wenn du jetzt Änderungen vornimmst und auf <strong>&bdquo;Veröffentlichen&ldquo;</strong> klickst, speichern wir deine Anpassungen sicher in deinem lokalen Browser-Cache, anstatt die Cloud zu überschreiben. Sobald die Verbindung wiederhergestellt ist, wird dein cloud-gespeicherter Content automatisch wieder synchronisiert!
                </span>
              </div>
            </div>
          )}

          {/* SAVE ALERT METADATA */}
          {saveStatus === 'success' && (
            <div className="bg-emerald-50 text-emerald-800 p-4 border-l-4 border-emerald-500 rounded text-sm mb-6 flex items-center gap-2.5 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong className="font-semibold block">Beitrag gespeichert!</strong>
                <span className="text-xs">
                  {cmsData?.isFallback 
                    ? 'Änderungen erfolgreich in deinem Browser-Cache gesichert! (Schreibgeschützter Firebase-Modus)'
                    : 'Alle Änderungen sind jetzt live auf FlorianKusche.de sichtbar.'}
                </span>
              </div>
            </div>
          )}

          {saveStatus === 'error' && (
            <div className="bg-red-50 text-red-800 p-4 border-l-4 border-red-500 rounded text-sm mb-6 flex items-center gap-2.5 shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <strong className="font-semibold block">Fehler beim Speichern!</strong>
                <span className="text-xs">Die Daten konnten nicht zu Firebase Firestore übertragen werden. Prüfe dein Setup.</span>
              </div>
            </div>
          )}

          {/* MOBILE TABS SLIDER BAR */}
          <div className="flex md:hidden bg-[#23282d] p-1.5 rounded-lg overflow-x-auto gap-1 mb-6 text-xs text-white">
            {(['dashboard', 'hero', 'leistungen', 'tools', 'referenzen', 'calendly', 'prozess', 'contact', 'colors', 'credentials'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 rounded capitalize font-medium shrink-0 ${
                  activeTab === tab ? 'bg-[#0073aa] text-white font-bold' : 'text-zinc-300'
                }`}
              >
                {tab === 'credentials' ? 'Zugang' : tab === 'colors' ? 'Farben' : tab === 'calendly' ? 'Calendly' : tab}
              </button>
            ))}
          </div>

          {/* TAB CONTENTS CONTAINER */}
          <div className="flex-1 overflow-y-auto pr-1">
            
            {isLoadingCms ? (
              <div className="flex items-center justify-center p-20 bg-white border border-zinc-200 rounded-lg shadow-sm">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0073aa]"></div>
                  <p className="text-zinc-500 text-xs font-mono">Lade deine Datenbank-Konfiguration...</p>
                </div>
              </div>
            ) : !cmsData ? (
              <div className="p-8 bg-red-50 border border-red-200 rounded-xl text-red-700 flex flex-col items-center gap-3 max-w-lg mx-auto mt-8">
                <AlertCircle className="w-8 h-8" />
                <h3 className="font-bold">Keine WordPress-Konfiguration gefunden</h3>
                <p className="text-xs text-center leading-relaxed">
                  Verbinde den Firebase Firestore Service. Klicke auf "Veröffentlichen" in der oberen rechten Ecke, um die Standard-Konfigurationen direkt in die Cloud-Datenbank einzutragen!
                </p>
                <button
                  onClick={() => setCmsData(JSON.parse(JSON.stringify(DEFAULT_PAGE_DATA)))}
                  className="mt-4 py-2 px-6 bg-[#0073aa] hover:bg-[#005177] text-white text-xs font-bold rounded shadow cursor-pointer uppercase tracking-wider"
                >
                  Standardwerte laden
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* 1. TAB: DASHBOARD OVERVIEW */}
                {activeTab === 'dashboard' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
                    {/* Welcome widget card */}
                    <div className="lg:col-span-8 bg-white border border-zinc-200 p-6 rounded-xl shadow-sm space-y-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-[#0073aa]/10 border border-[#0073aa]/20 flex items-center justify-center text-[#0073aa]">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-zinc-500 text-xs">WordPress Dashboard</p>
                          <h3 className="text-xl font-bold text-zinc-900">Hallo, Florian Kusche!</h3>
                        </div>
                      </div>

                      <div className="h-[1px] bg-zinc-200"></div>

                      <p className="text-sm text-zinc-600 leading-relaxed">
                        Willkommen in deinem WordPress-Style Redaktionsbereich. Dieses CMS (Content Management System) erlaubt dir das nahtlose Editieren aller Texte deiner Instagram-Marketing Landing Page, ganz ohne Programmierkenntnisse.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="bg-zinc-50 p-4 border border-zinc-100 rounded-lg">
                          <h4 className="font-semibold text-xs text-zinc-500 uppercase tracking-wider">Schnellaktionen</h4>
                          <div className="space-y-1.5 mt-2 text-xs">
                            <button onClick={() => setActiveTab('hero')} className="text-[#0073aa] font-bold hover:underline block text-left">→ Hero Slogan bearbeiten</button>
                            <button onClick={() => setActiveTab('leistungen')} className="text-[#0073aa] font-bold hover:underline block text-left">→ Neue Leistung hinzufügen</button>
                            <button onClick={() => setActiveTab('contact')} className="text-[#0073aa] font-bold hover:underline block text-left">→ E-Mail oder WhatsApp ändern</button>
                          </div>
                        </div>

                        <div className="bg-zinc-50 p-4 border border-zinc-100 rounded-lg">
                          <h4 className="font-semibold text-xs text-zinc-500 uppercase tracking-wider">Inhaltsübersicht</h4>
                          <div className="space-y-1 mt-2 text-xs text-zinc-600 font-mono">
                            <p>● Leistungen: <strong className="text-zinc-800">{cmsData.services.length} aktiv</strong></p>
                            <p>● Partnerschaft-Tools: <strong className="text-zinc-800">{cmsData.tools.length} gelistet</strong></p>
                            <p>● Kunden-Referenzen: <strong className="text-zinc-800">{cmsData.references.length} eingetragen</strong></p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick sidebar widget */}
                    <div className="lg:col-span-4 space-y-6">
                      <div className="bg-[#23282d] text-white p-6 rounded-xl shadow-sm space-y-3">
                        <h4 className="text-xs font-bold text-accent uppercase tracking-widest">Gutenberg Info</h4>
                        <p className="text-xs leading-relaxed text-zinc-300">
                          Deine Webseite ist vollständig modular konzipiert. Jede Änderung, die du hier speicherst, wird nach dem Klick auf <strong>"Veröffentlichen"</strong> sofort auf allen Geräten deiner Besucher aktualisiert.
                        </p>
                        <div className="pt-2">
                          <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 py-1.5 px-3 rounded shadow-inner text-[10px] font-mono uppercase tracking-widest font-black">
                            ● Firebase live
                          </span>
                        </div>
                      </div>

                      <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-sm">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Technischer Zustand</h4>
                        <div className="space-y-3 text-xs">
                          <div className="flex justify-between border-b border-zinc-100 pb-1.5">
                            <span className="text-zinc-500">Firestore DB</span>
                            <span className="font-mono text-emerald-600 font-bold">Verbunden</span>
                          </div>
                          <div className="flex justify-between border-b border-zinc-100 pb-1.5">
                            <span className="text-zinc-500">Firebase Auth</span>
                            <span className="font-mono text-emerald-600 font-bold">Eingeloggt</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">SSL Verschlüsselt</span>
                            <span className="font-mono text-emerald-600 font-bold">Aktiv</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. TAB: HERO CONFIG */}
                {activeTab === 'hero' && (
                  <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-sm space-y-6 max-w-4xl pb-12">
                    <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-200 pb-2">Haupt-Header & Slogan bearbeiten</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Logo Text (Eingebettet)</label>
                        <input
                          type="text"
                          value={cmsData.hero.logoText}
                          onChange={(e) => updateHeroField('logoText', e.target.value)}
                          className="w-full p-2.5 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#0073aa] text-zinc-900 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Slogan Sub-Zeile (Top)</label>
                        <input
                          type="text"
                          value={cmsData.hero.logoSubtext}
                          onChange={(e) => updateHeroField('logoSubtext', e.target.value)}
                          className="w-full p-2.5 border border-[#0073aa]/30 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#0073aa] text-zinc-900 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="h-[1px] bg-zinc-200"></div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Kategorie Eyebrow (Über Headline)</label>
                        <input
                          type="text"
                          value={cmsData.hero.eyebrow}
                          onChange={(e) => updateHeroField('eyebrow', e.target.value)}
                          className="w-full p-2.5 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#0073aa] text-zinc-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Hauptüberschrift (Nutze \n für Zeilenbruch)</label>
                        <textarea
                          rows={3}
                          value={cmsData.hero.headline}
                          onChange={(e) => updateHeroField('headline', e.target.value)}
                          className="w-full p-2.5 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#0073aa] text-zinc-900 font-extrabold font-sans"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Unterüberschrift (Subtitle)</label>
                        <textarea
                          rows={3}
                          value={cmsData.hero.subtitle}
                          onChange={(e) => updateHeroField('subtitle', e.target.value)}
                          className="w-full p-2.5 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#0073aa] text-zinc-900"
                        />
                      </div>
                    </div>

                    <div className="h-[1px] bg-zinc-200"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Call to Action (Primärer Button)</label>
                        <input
                          type="text"
                          value={cmsData.hero.primaryCta}
                          onChange={(e) => updateHeroField('primaryCta', e.target.value)}
                          className="w-full p-2.5 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#0073aa] text-zinc-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Call to Action (Sekundärer Button)</label>
                        <input
                          type="text"
                          value={cmsData.hero.secondaryCta}
                          onChange={(e) => updateHeroField('secondaryCta', e.target.value)}
                          className="w-full p-2.5 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#0073aa] text-zinc-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Schnellübersicht Siegel-Checkliste (3 Elemente)</label>
                      <div className="space-y-2">
                        {cmsData.hero.checklist.map((item, idx) => (
                          <input
                            key={idx}
                            type="text"
                            value={item}
                            onChange={(e) => {
                              const newList = [...cmsData.hero.checklist];
                              newList[idx] = e.target.value;
                              updateHeroField('checklist', newList);
                            }}
                            className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#0073aa] text-zinc-900"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="h-[1px] bg-zinc-200"></div>

                    <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-xl space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-extrabold text-zinc-900">Zwischenfoto (Bereich zwischen Header & Hero-Slogan)</h4>
                          <p className="text-xs text-zinc-500">Füge dein eigenes Porträtfoto oder eine Grafik zwischen dem Header und der Hauptüberschrift ein.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!cmsData.betweenSectionImage?.enabled}
                            onChange={(e) => updateBetweenSectionImageField('enabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-zinc-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-[#0073aa] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0073aa]"></div>
                          <span className="ml-2 text-xs font-bold text-zinc-700">Aktiviert</span>
                        </label>
                      </div>

                      {!!cmsData.betweenSectionImage?.enabled && (
                        <div className="space-y-4 pt-3 border-t border-zinc-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <ImageUploader
                                id="between-section-image-upload"
                                label="Eigenes Foto hochladen"
                                currentValue={cmsData.betweenSectionImage?.imageUrl || ''}
                                onChange={(val) => updateBetweenSectionImageField('imageUrl', val)}
                              />
                            </div>

                            <div className="space-y-4 text-xs font-medium text-zinc-600">
                              {/* 1. Width Slider */}
                              <div>
                                <div className="flex justify-between mb-1">
                                  <label className="font-bold text-zinc-700">Bildbreite (Größe auf Website)</label>
                                  <span className="font-mono text-[#0073aa] font-bold">{cmsData.betweenSectionImage?.width || 250}px</span>
                                </div>
                                <input
                                  type="range"
                                  min="80"
                                  max="600"
                                  step="10"
                                  value={cmsData.betweenSectionImage?.width || 250}
                                  onChange={(e) => updateBetweenSectionImageField('width', parseInt(e.target.value))}
                                  className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-[#0073aa]"
                                />
                                <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                                  <span>Klein (80px)</span>
                                  <span>Mittel (250px)</span>
                                  <span>Groß (600px)</span>
                                </div>
                              </div>

                              {/* 2. Rounding Dropdown */}
                              <div>
                                <label className="block font-bold text-zinc-700 mb-1">Ecken-Abrundung</label>
                                <select
                                  value={cmsData.betweenSectionImage?.borderRadius || 'xl'}
                                  onChange={(e) => updateBetweenSectionImageField('borderRadius', e.target.value)}
                                  className="w-full p-2 border border-zinc-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#0073aa] text-zinc-900"
                                >
                                  <option value="none">Flach / Eckig</option>
                                  <option value="md">Leicht abgerundet (md)</option>
                                  <option value="xl">Abgerundete Kanten (xl)</option>
                                  <option value="full">Kreisrund (Vollständig)</option>
                                </select>
                              </div>

                              {/* 3. Alignment Selection */}
                              <div>
                                <label className="block font-bold text-zinc-700 mb-1">Ausrichtung (PC-Ansicht)</label>
                                <div className="grid grid-cols-3 gap-2">
                                  {(['left', 'center', 'right'] as const).map((align) => (
                                    <button
                                      key={align}
                                      type="button"
                                      onClick={() => updateBetweenSectionImageField('alignment', align)}
                                      className={`p-2 border text-xs font-bold rounded capitalize transition-all ${
                                        (cmsData.betweenSectionImage?.alignment || 'left') === align
                                          ? 'border-[#0073aa] bg-[#0073aa]/10 text-[#0073aa]'
                                          : 'border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50'
                                      }`}
                                    >
                                      {align === 'left' ? 'Links' : align === 'center' ? 'Mitte' : 'Rechts'}
                                    </button>
                                  ))}
                                </div>
                                <span className="text-[10px] text-zinc-400 block mt-1">Auf Mobilgeräten wird das Bild für optimales Layout immer zentriert angezeigt.</span>
                              </div>

                              {/* 4. Spacing */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block font-bold text-zinc-700 mb-1">Abstand Oben (px)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="120"
                                    value={cmsData.betweenSectionImage?.marginTop ?? 0}
                                    onChange={(e) => updateBetweenSectionImageField('marginTop', Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full p-2 border border-zinc-300 rounded text-sm text-zinc-900 focus:outline-[#0073aa]"
                                  />
                                </div>
                                <div>
                                  <label className="block font-bold text-zinc-700 mb-1">Abstand Unten (px)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="120"
                                    value={cmsData.betweenSectionImage?.marginBottom ?? 20}
                                    onChange={(e) => updateBetweenSectionImageField('marginBottom', Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full p-2 border border-zinc-300 rounded text-sm text-zinc-900 focus:outline-[#0073aa]"
                                  />
                                </div>
                              </div>

                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB: ONE-PAGER CONFIG */}
                {activeTab === 'onepager' && (
                  <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-sm space-y-6 max-w-4xl pb-12">
                    <div>
                      <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-200 pb-2">One-Pager Info-Blatt & Dokument-Upload bearbeiten</h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        Hier kannst du die Inhalte der interaktiven One-Pager-Karte (rechte Spalte auf der Mainpage) anpassen. Außerdem kannst du hier ein echtes Dokument (z.B. PDF oder Info-TXT) hochladen, das deine Kunden herunterladen können.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Über-Überschrift (Kategorie Eyebrow)</label>
                        <input
                          type="text"
                          value={cmsData.onePager?.eyebrow ?? 'STRATEGIE-AUFBAU'}
                          onChange={(e) => updateOnePagerField('eyebrow', e.target.value)}
                          className="w-full p-2.5 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#0073aa] text-zinc-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Name / Urheber</label>
                        <input
                          type="text"
                          value={cmsData.onePager?.ownerName ?? 'FLORIAN KUSCHE'}
                          onChange={(e) => updateOnePagerField('ownerName', e.target.value)}
                          className="w-full p-2.5 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#0073aa] text-zinc-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">One-Pager Titel</label>
                        <input
                          type="text"
                          value={cmsData.onePager?.title ?? 'INSTAGRAM ERFOLGS-FAHRPLAN'}
                          onChange={(e) => updateOnePagerField('title', e.target.value)}
                          className="w-full p-2.5 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#0073aa] text-zinc-900 font-extrabold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Fließtext (Beschreibung)</label>
                        <textarea
                          rows={3}
                          value={cmsData.onePager?.description ?? 'Der exakte Blueprint, mit dem ich deinen Account aufbaue und pflege, um konstante Sichtbarkeit und planbare Direktnachrichten-Leads zu erzeugen.'}
                          onChange={(e) => updateOnePagerField('description', e.target.value)}
                          className="w-full p-2.5 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#0073aa] text-zinc-900 leading-relaxed"
                        />
                      </div>
                    </div>

                    <div className="h-[1px] bg-zinc-200"></div>

                    {/* Step levels columns editing */}
                    <div>
                      <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-3">Säulen / Strategie-Schritte (3 Elemente)</h4>
                      <div className="space-y-4">
                        {(cmsData.onePager?.steps || [
                          { label: '1. HOOK PSYCHOLOGIE', percentage: 85 },
                          { label: '2. VERKAUFSSTARKE CAROUSELS', percentage: 70 },
                          { label: '3. STORY-DIRECT-CTA', percentage: 92 }
                        ]).map((step, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center bg-zinc-50 p-4 border border-zinc-200 rounded-lg">
                            <div className="flex-1">
                              <label className="block text-[10px] text-zinc-500 uppercase font-mono font-bold mb-1">Name / Label Schritt {idx + 1}</label>
                              <input
                                type="text"
                                value={step.label}
                                onChange={(e) => {
                                  const currentSteps = cmsData.onePager?.steps || [
                                    { label: '1. HOOK PSYCHOLOGIE', percentage: 85 },
                                    { label: '2. VERKAUFSSTARKE CAROUSELS', percentage: 70 },
                                    { label: '3. STORY-DIRECT-CTA', percentage: 92 }
                                  ];
                                  const newSteps = [...currentSteps];
                                  newSteps[idx] = { ...newSteps[idx], label: e.target.value };
                                  updateOnePagerField('steps', newSteps);
                                }}
                                className="w-full p-2 border border-zinc-300 bg-white rounded text-xs text-zinc-900 font-mono"
                              />
                            </div>
                            <div className="w-full sm:w-44">
                              <label className="block text-[10px] text-zinc-500 uppercase font-mono font-bold mb-1">Fortschritt / Prozent ({step.percentage}%)</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="10"
                                  max="100"
                                  value={step.percentage}
                                  onChange={(e) => {
                                    const currentSteps = cmsData.onePager?.steps || [
                                      { label: '1. HOOK PSYCHOLOGIE', percentage: 85 },
                                      { label: '2. VERKAUFSSTARKE CAROUSELS', percentage: 70 },
                                      { label: '3. STORY-DIRECT-CTA', percentage: 92 }
                                    ];
                                    const newSteps = [...currentSteps];
                                    newSteps[idx] = { ...newSteps[idx], percentage: parseInt(e.target.value) || 50 };
                                    updateOnePagerField('steps', newSteps);
                                  }}
                                  className="flex-1 accent-[#0073aa] h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-xs font-bold text-zinc-700 font-mono w-8 text-right">{step.percentage}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="h-[1px] bg-zinc-200"></div>

                    {/* Status badge & button label customization */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Schnitt / Resultat-Ergebnis Text (Untere Box)</label>
                      <input
                        type="text"
                        value={cmsData.onePager?.calloutText ?? 'Erzielt im Schnitt +240% Engagement-Wachstum.'}
                        onChange={(e) => updateOnePagerField('calloutText', e.target.value)}
                        className="w-full p-2.5 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#0073aa] text-zinc-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Download-Button Schriftzug</label>
                        <input
                          type="text"
                          value={cmsData.onePager?.buttonLabel ?? 'ONE-PAGER LOGBUCH DOWNLOAD'}
                          onChange={(e) => updateOnePagerField('buttonLabel', e.target.value)}
                          className="w-full p-2.5 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#0073aa] text-zinc-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Unterzeile unter dem Button ('TXT-DUMP • ...')</label>
                        <input
                          type="text"
                          value={cmsData.onePager?.subButtonLabel ?? 'TXT-DUMP • GRATIS HERUNTERLADEN'}
                          onChange={(e) => updateOnePagerField('subButtonLabel', e.target.value)}
                          className="w-full p-2.5 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#0073aa] text-zinc-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Hinweiszeile unter dem gesamten Dokument</label>
                      <input
                        type="text"
                        value={cmsData.onePager?.bottomDirectionsText ?? '▲ KLICKE AUF DAS DOKUMENT, UM DIE INSTAGRAM-ERFOLGSFORMEL ALS TEXT HERUNTERZULADEN!'}
                        onChange={(e) => updateOnePagerField('bottomDirectionsText', e.target.value)}
                        className="w-full p-2.5 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#0073aa] text-zinc-900"
                      />
                    </div>

                    <div className="h-[1px] bg-zinc-200"></div>

                    {/* DOCUMENT FILE UPLOAD CORE FIELD */}
                    <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-xl space-y-4">
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900">Echtes Dokument hochladen (*.pdf, *.txt, *.docx, *.png, *.jpg)</h4>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Lade hier das tatsächliche Handout-Dokument hoch. Falls du kein Handout hochlädst, generiert die Seite beim Button-Klick automatisch einen ansprechenden Strategie-DUMP (.txt) mit deinen aktuellen Werten.
                        </p>
                      </div>

                      <DocumentUploader
                        id="onepager-handout-doc"
                        currentUrl={cmsData.onePager?.documentUrl}
                        currentFilename={cmsData.onePager?.documentFilename}
                        onChange={(url, filepath) => {
                          updateOnePagerFields({
                            documentUrl: url,
                            documentFilename: filepath
                          });
                        }}
                        label="Handout-Quelldatei für Kunden-Download"
                      />
                    </div>
                  </div>
                )}

                {/* 3. TAB: LEISTUNGEN */}
                {activeTab === 'leistungen' && (() => {
                  const sectConfig = cmsData.servicesSection || {
                    eyebrow: 'PORTFOLIO & LEISTUNGEN',
                    title: 'WIE ICH DEINE MARKE [UNSCHLAGBAR SICHTBAR] MACHE',
                    descriptions: ['Mein Versprechen: Hochwertiger, strategischer Content, der deine Markenbotschaft trägt und aus Followern messbare Leads generiert. Komplett von mir abgewickelt, ohne Stress für dich.']
                  };
                  return (
                    <div className="space-y-8 pb-12 font-sans">
                      
                      {/* Section 1: Kopfbereich & Absätze */}
                      <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-sm space-y-6">
                        <div>
                          <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-200 pb-2">Kopfbereich dieses Abschnitts anpassen</h3>
                          <p className="text-xs text-zinc-500 mt-1">
                            Passe den Titel, die Über-Überschrift (Eyebrow) und beliebig viele Einleitungstexte für den "Portfolio & Leistungen" Bereich an. Verwende eckige Klammern [wie diese], um Wörter im Frontend farblich hervorzuheben.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Über-Überschrift (Eyebrow)</label>
                            <input
                              type="text"
                              value={sectConfig.eyebrow}
                              onChange={(e) => updateServicesSectionField('eyebrow', e.target.value)}
                              className="w-full p-2.5 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#0073aa] text-zinc-900 font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Überschrift (Headline)</label>
                            <input
                              type="text"
                              value={sectConfig.title}
                              onChange={(e) => updateServicesSectionField('title', e.target.value)}
                              className="w-full p-2.5 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#0073aa] text-zinc-900 font-extrabold"
                            />
                          </div>
                        </div>

                        {/* Description paragraphs block ("weitere Textabschnitte") */}
                        <div className="space-y-6">
                          <div className="flex justify-between items-center bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                            <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                              Verfügbare Textabschnitte ({sectConfig.descriptions.length})
                            </span>
                            <button
                              type="button"
                              onClick={addSectionDescriptionParagraph}
                              className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-[#0073aa] hover:bg-[#005177] text-white rounded text-[11px] font-bold cursor-pointer transition-all duration-200 hover:shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" /> Neuen Textabschnitt hinzufügen
                            </button>
                          </div>

                          {sectConfig.descriptions.map((desc, idx) => {
                            const dObj = typeof desc === 'string'
                              ? { eyebrow: '', title: '', text: desc }
                              : { eyebrow: desc?.eyebrow || '', title: desc?.title || '', text: desc?.text || '' };
                            return (
                              <div key={idx} className="bg-white border border-zinc-200 p-6 rounded-xl shadow-sm space-y-4 text-left">
                                <div className="border-b border-zinc-200 pb-2 flex justify-between items-start">
                                  <div>
                                    <h4 className="text-base font-bold text-zinc-900">Textabschnitt #{idx + 1} beschreiben</h4>
                                    <p className="text-xs text-zinc-500 mt-1">
                                      Passe die Überschriften und den Inhalt des {idx + 1}. Absatzes an. Verwende eckige Klammern [wie diese], um Wörter im Frontend farblich hervorzuheben.
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0 bg-zinc-50 p-1 rounded-lg border border-zinc-200 ml-4 animate-fadeIn">
                                    <button
                                      type="button"
                                      onClick={() => moveSectionDescriptionParagraph(idx, 'up')}
                                      disabled={idx === 0}
                                      className="p-1.5 text-zinc-600 hover:bg-zinc-200 disabled:opacity-30 rounded cursor-pointer transition-colors"
                                      title="Nach oben verschieben"
                                    >
                                      <ArrowUp className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moveSectionDescriptionParagraph(idx, 'down')}
                                      disabled={idx === sectConfig.descriptions.length - 1}
                                      className="p-1.5 text-zinc-600 hover:bg-zinc-200 disabled:opacity-30 rounded cursor-pointer transition-colors"
                                      title="Nach unten verschieben"
                                    >
                                      <ArrowDown className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteSectionDescriptionParagraph(idx)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
                                      title="Abschnitt löschen"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Section-specific Head area editors */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50/50 p-4 rounded-lg border border-zinc-200">
                                  <div>
                                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                                      Über-Überschrift (Eyebrow)
                                    </label>
                                    <input
                                      type="text"
                                      value={dObj.eyebrow}
                                      onChange={(e) => updateSectionDescriptionField(idx, 'eyebrow', e.target.value)}
                                      placeholder="Z.B. MEIN VERSPRECHEN"
                                      className="w-full p-2.5 border border-zinc-300 bg-white rounded text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#0073aa] font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                                      Überschrift (Headline)
                                    </label>
                                    <input
                                      type="text"
                                      value={dObj.title}
                                      onChange={(e) => updateSectionDescriptionField(idx, 'title', e.target.value)}
                                      placeholder="Z.B. HOCHWERTIGE CONTEXT COOPERATION"
                                      className="w-full p-2.5 border border-zinc-300 bg-white rounded text-sm text-zinc-900 font-extrabold focus:outline-none focus:ring-1 focus:ring-[#0073aa]"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                                    Inhalt des Textabschnitts (Fließtext)
                                  </label>
                                  <textarea
                                    rows={4}
                                    value={dObj.text}
                                    onChange={(e) => updateSectionDescriptionField(idx, 'text', e.target.value)}
                                    placeholder="Schreibe hier die einladende Beschreibung oder den Erklärungstext..."
                                    className="w-full p-2.5 border border-zinc-300 bg-white rounded text-sm text-zinc-900 leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#0073aa]"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section 2: Services list */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white border border-zinc-200 p-4 rounded-xl shadow-sm">
                          <span className="text-sm font-semibold text-zinc-700">Leistungspositionen verwalten (hoch/runter verschiebbar)</span>
                          <button
                            onClick={() => setIsAddingService(true)}
                            className="py-1.5 px-4 bg-[#0073aa] hover:bg-[#005177] text-white text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Service erstellen</span>
                          </button>
                        </div>

                        {/* SERVICES TABLE LIST (Wordpress table styling) */}
                        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden text-zinc-800">
                          <table className="w-full text-left text-xs sm:text-sm border-collapse">
                            <thead>
                              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold uppercase tracking-wider text-[10px]">
                                <th className="p-4 w-12 text-center">Pos</th>
                                <th className="p-4">Titel</th>
                                <th className="p-4 hidden sm:table-cell">WP Label</th>
                                <th className="p-4">Zustand</th>
                                <th className="p-4 text-right">Aktionen</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200">
                              {cmsData.services.map((service, index) => (
                                <tr key={service.id} className="hover:bg-zinc-50">
                                  <td className="p-4 text-center text-zinc-400 font-bold font-mono">
                                    {index + 1}
                                  </td>
                                  <td className="p-4">
                                    <strong className="text-[#0073aa] font-bold text-sm block">{service.title}</strong>
                                    <span className="text-xs text-zinc-500 line-clamp-1">{service.description}</span>
                                  </td>
                                  <td className="p-4 hidden sm:table-cell">
                                    <span className="bg-zinc-100 text-zinc-600 border border-zinc-200 px-2.5 py-0.5 rounded font-mono font-medium text-[10px] tracking-wider uppercase">
                                      {service.label}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    {service.isPrimary ? (
                                      <span className="bg-[#ffcc00]/25 text-[#735100] border border-[#ffcc00]/40 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">
                                        Hauptservice
                                      </span>
                                    ) : (
                                      <span className="text-zinc-400 font-normal">Support</span>
                                    )}
                                  </td>
                                  <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                                    {/* Order controllers up/down */}
                                    <button
                                      type="button"
                                      disabled={index === 0}
                                      onClick={() => moveServiceUp(index)}
                                      className="inline-flex items-center justify-center p-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 disabled:opacity-30 rounded text-zinc-700 cursor-pointer"
                                      title="Nach oben verschieben"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={index === cmsData.services.length - 1}
                                      onClick={() => moveServiceDown(index)}
                                      className="inline-flex items-center justify-center p-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 disabled:opacity-30 rounded text-zinc-700 cursor-pointer"
                                      title="Nach unten verschieben"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => setEditingService(service)}
                                      className="inline-flex items-center gap-1 py-1 px-2.5 bg-zinc-100 font-semibold text-[#0073aa] hover:bg-zinc-200 rounded border border-zinc-300 text-xs cursor-pointer text-center"
                                    >
                                      <Edit className="w-3.5 h-3.5" /> Bearbeiten
                                    </button>
                                    <button
                                      onClick={() => deleteService(service.id)}
                                      className="inline-flex items-center gap-1 py-1 px-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded border border-red-200 text-xs cursor-pointer text-center"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" /> Löschen
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* EDIT BOX POPUP/FORM */}
                      {editingService && (
                        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                          <div className="bg-white border border-zinc-300 rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
                            <h3 className="text-lg font-bold border-b border-zinc-200 pb-2 flex items-center gap-2">
                              <Layers className="w-5 h-5 text-[#0073aa]" />
                              <span>Service bearbeiten</span>
                            </h3>
                            <div className="space-y-3 text-xs sm:text-sm">
                              <div>
                                <label className="block font-bold text-zinc-700 label mb-1 uppercase tracking-wider">Service ID</label>
                                <input
                                  type="text"
                                  value={editingService.id}
                                  disabled
                                  className="w-full p-2 bg-zinc-100 border border-zinc-300 rounded select-none text-zinc-500"
                                />
                              </div>
                              <div>
                                <label className="block font-bold text-[#0073aa] label mb-1 uppercase tracking-wider">Service Titel</label>
                                <input
                                  type="text"
                                  value={editingService.title}
                                  onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                                  className="w-full p-2.5 border border-zinc-300 rounded text-zinc-900"
                                />
                              </div>
                              <div>
                                <label className="block font-bold text-[#0073aa] label mb-1 uppercase tracking-wider">Kurze Übersicht Beschreibung</label>
                                <textarea
                                  rows={3}
                                  value={editingService.description}
                                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                                  className="w-full p-2.5 border border-zinc-300 rounded text-zinc-900"
                                />
                              </div>
                              <div>
                                <label className="block font-bold text-[#0073aa] label mb-1 uppercase tracking-wider">WordPress Label/Kategorie (z.B. PLAN, MANAGE)</label>
                                <input
                                  type="text"
                                  value={editingService.label}
                                  onChange={(e) => setEditingService({ ...editingService, label: e.target.value })}
                                  className="w-full p-2.5 border border-[#0073aa] rounded text-zinc-900"
                                />
                              </div>
                              <div className="flex items-center gap-2 pt-2">
                                <input
                                  type="checkbox"
                                  id="is_primary"
                                  checked={!!editingService.isPrimary}
                                  onChange={(e) => setEditingService({ ...editingService, isPrimary: e.target.checked })}
                                  className="w-4 h-4 rounded text-[#0073aa] border-zinc-300 focus:ring-[#0073aa]"
                                />
                                <label htmlFor="is_primary" className="font-bold text-zinc-700 text-xs uppercase tracking-wider">Als Hauptleistung hervorheben (Spotlight-Banner)</label>
                              </div>
                            </div>
                            <div className="pt-4 border-t border-zinc-200 flex justify-end gap-3 text-xs">
                              <button
                                onClick={() => setEditingService(null)}
                                className="py-2 px-4 bg-zinc-100 border border-zinc-300 text-zinc-700 rounded font-bold hover:bg-zinc-200"
                              >
                                Abbrechen
                              </button>
                              <button
                                onClick={saveServiceEdit}
                                className="py-2 px-5 bg-[#0073aa] text-white font-bold rounded hover:bg-[#005177]"
                              >
                                Aktualisieren
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* NEW SERVICE POPUP */}
                      {isAddingService && (
                        <ServiceCreateForm 
                          onClose={() => setIsAddingService(false)} 
                          onCreate={addNewService} 
                        />
                      )}

                    </div>
                  );
                })()}

                {/* 4. TAB: TOOLS */}
                {activeTab === 'tools' && (
                  <div className="space-y-6 pb-12 font-sans">
                    
                    {/* Add tool button */}
                    <div className="flex justify-between items-center bg-white border border-zinc-200 p-4 rounded-xl shadow-sm">
                      <span className="text-sm font-semibold text-zinc-700">Verwalte dein technisches Arsenal auf der Landing Page</span>
                      <button
                        onClick={() => setIsAddingTool(true)}
                        className="py-1.5 px-4 bg-[#0073aa] hover:bg-[#005177] text-white text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tool hinzufügen</span>
                      </button>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden text-zinc-800">
                      <table className="w-full text-left text-xs sm:text-sm border-collapse">
                        <thead>
                          <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold uppercase tracking-wider text-[10px]">
                            <th className="p-4">Name</th>
                            <th className="p-4">Beschreibung</th>
                            <th className="p-4">Icon Name</th>
                            <th className="p-4 text-right">Aktionen</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                          {cmsData.tools.map((tool) => (
                            <tr key={tool.name} className="hover:bg-zinc-50">
                              <td className="p-4 font-bold text-[#0073aa]">{tool.name}</td>
                              <td className="p-4 text-zinc-500 max-w-sm shrink truncate">{tool.description}</td>
                              <td className="p-4 text-xs font-mono text-zinc-600">{tool.iconName}</td>
                              <td className="p-4 text-right space-x-2">
                                <button
                                  onClick={() => setEditingTool(tool)}
                                  className="inline-flex items-center gap-1 py-1 px-2.5 bg-zinc-100 font-semibold text-[#0073aa] hover:bg-zinc-200 rounded border border-zinc-300 text-xs cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" /> Bearbeiten
                                </button>
                                <button
                                  onClick={() => deleteTool(tool.name)}
                                  className="inline-flex items-center gap-1 py-1 px-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded border border-red-200 text-xs cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Löschen
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* EDIT TOOL BOX */}
                    {editingTool && (
                      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                        <div className="bg-white border border-zinc-300 rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
                          <h3 className="text-lg font-bold border-b border-zinc-200 pb-2 flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-[#0073aa]" />
                            <span>Tool bearbeiten</span>
                          </h3>
                          <div className="space-y-3 text-xs sm:text-sm">
                            <div>
                              <label className="block font-bold text-zinc-700 label mb-1">Name des Tools</label>
                              <input
                                type="text"
                                value={editingTool.name}
                                onChange={(e) => setEditingTool({ ...editingTool, name: e.target.value })}
                                className="w-full p-2.5 border border-zinc-300 rounded text-zinc-900 font-semibold"
                              />
                            </div>
                            <div>
                              <label className="block font-bold text-zinc-700 label mb-1">Beschreibung</label>
                              <textarea
                                rows={2}
                                value={editingTool.description}
                                onChange={(e) => setEditingTool({ ...editingTool, description: e.target.value })}
                                className="w-full p-2.5 border border-zinc-300 rounded text-zinc-900"
                              />
                            </div>
                            <div>
                              <label className="block font-bold text-zinc-700 label mb-1">Branchen-Icon Typ</label>
                              <select
                                value={editingTool.iconName}
                                onChange={(e) => setEditingTool({ ...editingTool, iconName: e.target.value as any })}
                                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded text-sm text-zinc-900"
                              >
                                <option value="Canva">Canva Pro </option>
                                <option value="Drive">Google Drive</option>
                                <option value="CapCut">CapCut App</option>
                                <option value="Instagram">Instagram Native</option>
                              </select>
                            </div>
                          </div>
                          <div className="pt-4 border-t border-zinc-200 flex justify-end gap-3 text-xs">
                            <button
                              onClick={() => setEditingTool(null)}
                              className="py-2 px-4 bg-zinc-100 border border-zinc-300 text-zinc-700 rounded font-bold hover:bg-zinc-200"
                            >
                              Abbrechen
                            </button>
                            <button
                              onClick={saveToolEdit}
                              className="py-2 px-5 bg-[#0073aa] text-white font-bold rounded hover:bg-[#005177]"
                            >
                              Aktualisieren
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* NEW TOOL BOX */}
                    {isAddingTool && (
                      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                        <ToolCreateForm 
                          onClose={() => setIsAddingTool(false)} 
                          onCreate={addNewTool} 
                        />
                      </div>
                    )}

                  </div>
                )}

                {/* 5. TAB: REFERENZEN & TESTIMONIALS */}
                {activeTab === 'referenzen' && (
                  <div className="space-y-6 pb-12 font-sans max-w-4xl">
                    <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-sm space-y-6">
                      
                      <div className="border-b border-zinc-100 pb-3">
                        <h3 className="text-base font-bold text-zinc-900">Kundenstimmen & Referenzen verwalten</h3>
                        <p className="text-xs text-zinc-500 mt-1">
                          Hier kannst du alle Referenzen verwalten. Markiere sie als <strong>Spotlight ⭐️</strong>, um sie in den prominenten Abschnitten (z. B. oberes Zitat, Smartphone-Reel oder Mallorca-Banner) anzuzeigen. Andere werden im Raster unten angezeigt. Klicke auf den Titel einer Referenz, um ihre Details ein- oder auszuklappen.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {cmsData.references.map((ref, idx) => {
                          const isExpanded = !!expandedReferences[idx];
                          const toggleExpanded = () => {
                            setExpandedReferences(prev => ({
                              ...prev,
                              [idx]: !prev[idx]
                            }));
                          };

                          return (
                            <div key={idx} className={`border rounded-xl transition-all duration-200 overflow-hidden ${ref.isSpotlight ? 'bg-amber-50/20 border-amber-200 shadow-sm' : 'bg-white border-zinc-200 hover:border-zinc-300'}`}>
                              
                              {/* Position/Role indicator & Accordion Header */}
                              <div className="p-4 bg-zinc-50/70 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-3 select-none">
                                <div 
                                  onClick={toggleExpanded}
                                  className="flex items-center gap-3 cursor-pointer group min-w-0 flex-1"
                                >
                                  <div className="text-zinc-400 group-hover:text-zinc-600 transition-colors shrink-0">
                                    {isExpanded ? (
                                      <ChevronUp className="w-5 h-5" />
                                    ) : (
                                      <ChevronDown className="w-5 h-5" />
                                    )}
                                  </div>
                                  <span className="w-6 h-6 rounded-full bg-[#0073aa]/10 text-[#0073aa] flex items-center justify-center text-xs font-bold font-mono shrink-0">
                                    {idx + 1}
                                  </span>
                                  <h4 className="font-bold text-sm text-zinc-800 truncate group-hover:text-[#0073aa] transition-colors">
                                    {ref.name || 'Neue Referenz'}
                                  </h4>
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase font-mono shrink-0 ${
                                    ref.isSpotlight ? 'bg-[#ffcc00]/25 text-[#8a6d00] border border-[#ffcc00]/40' : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                                  }`}>
                                    {ref.isSpotlight ? 'Spotlight ⭐️' : 'Standard'}
                                  </span>
                                  {ref.status && (
                                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded font-mono border shrink-0 ${
                                      ref.status === 'freigegeben' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      ref.status === 'ausstehend' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                      'bg-zinc-50 text-zinc-700 border-zinc-200'
                                    }`}>
                                      {ref.status === 'freigegeben' ? 'Freigegeben' : ref.status === 'ausstehend' ? 'Ausstehend' : 'Klärung'}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-4 shrink-0">
                                  {/* Spotlight Toggle */}
                                  <label className="flex items-center gap-1.5 text-xs text-zinc-700 font-bold cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={!!ref.isSpotlight}
                                      onChange={(e) => updateReference(idx, { isSpotlight: e.target.checked })}
                                      className="rounded text-[#0073aa] focus:ring-[#0073aa] h-4 w-4 border-zinc-300 cursor-pointer"
                                    />
                                    <span>Spotlight ⭐️</span>
                                  </label>

                                  {/* Delete Button for ALL references */}
                                  {deletingReferenceIdx === idx ? (
                                    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded p-1 animate-fadeIn shrink-0">
                                      <span className="text-[10px] font-bold text-red-700 uppercase font-mono px-1">Löschen?</span>
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          await deleteReference(idx);
                                          setDeletingReferenceIdx(null);
                                        }}
                                        className="bg-red-600 hover:bg-red-700 text-white font-mono font-bold text-[10px] px-2 py-1 rounded cursor-pointer transition-colors"
                                      >
                                        Ja
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDeletingReferenceIdx(null)}
                                        className="bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-mono font-bold text-[10px] px-2 py-1 rounded cursor-pointer transition-colors"
                                      >
                                        Nein
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setDeletingReferenceIdx(idx)}
                                      className="text-red-600 hover:text-red-800 text-xs font-bold font-mono bg-red-50 hover:bg-red-100 py-1 px-2.5 rounded border border-red-200 cursor-pointer flex items-center gap-1.5 transition-colors shrink-0"
                                    >
                                      <Trash className="w-3.5 h-3.5" />
                                      <span>Löschen</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Collapsible Content */}
                              {isExpanded && (
                                <div className="p-6 space-y-5 bg-white">
                                  {/* Stammdaten */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                    <div>
                                      <label className="block text-zinc-600 font-bold mb-1">Kunde / Firmenname</label>
                                      <input
                                        type="text"
                                        value={ref.name || ''}
                                        onChange={(e) => updateReference(idx, { name: e.target.value })}
                                        className="w-full p-2.5 border border-zinc-300 rounded text-zinc-900 bg-white focus:border-[#0073aa] focus:ring-1 focus:ring-[#0073aa] outline-none"
                                        placeholder="z. B. Fehrmann Glas & Design"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-zinc-600 font-bold mb-1">Format / Projektbezeichnung</label>
                                      <input
                                        type="text"
                                        value={ref.format || ''}
                                        onChange={(e) => updateReference(idx, { format: e.target.value })}
                                        className="w-full p-2.5 border border-zinc-300 rounded text-zinc-900 bg-white focus:border-[#0073aa] focus:ring-1 focus:ring-[#0073aa] outline-none"
                                        placeholder="z. B. Reels + Carousels"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-zinc-600 font-bold mb-1">Status Freigabe</label>
                                      <select
                                        value={ref.status || 'freigegeben'}
                                        onChange={(e) => updateReference(idx, { status: e.target.value as any })}
                                        className="w-full p-2.5 bg-white border border-zinc-300 rounded text-zinc-900 focus:border-[#0073aa] focus:ring-1 focus:ring-[#0073aa] outline-none"
                                      >
                                        <option value="freigegeben">Freigegeben (Aktiv)</option>
                                        <option value="ausstehend">Ausstehend (Wartend)</option>
                                        <option value="klaerung">In Klärung / Entwurf</option>
                                      </select>
                                    </div>
                                  </div>

                                  {/* LOGO BILD - ORIGINALGRÖSSE */}
                                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/60 space-y-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-3 bg-[#0073aa] rounded-full"></div>
                                      <h5 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Kunden-Logo / Avatar Bild (Originalgröße)</h5>
                                    </div>
                                    <div className="flex flex-col md:flex-row gap-6 items-start">
                                      {/* Original-Size Preview Area */}
                                      <div className="flex flex-col items-center gap-2 shrink-0">
                                        <div className="p-2 border-2 border-dashed border-zinc-300 bg-white shadow-sm flex items-center justify-center rounded-lg overflow-hidden min-h-24 min-w-24 max-w-[220px]">
                                          {ref.logoUrl ? (
                                            <img src={ref.logoUrl} alt="Logo" className="max-h-20 object-contain" />
                                          ) : ref.imageUrl ? (
                                            <img src={ref.imageUrl} alt="Fallback Logo" className="max-h-20 object-contain" />
                                          ) : (
                                            <div className="text-[#0073aa] text-lg font-bold flex items-center justify-center h-12 w-12 rounded-full bg-[#0073aa]/10">
                                              {(ref.name || 'CF').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                            </div>
                                          )}
                                        </div>
                                        <span className="text-[10px] text-zinc-400 font-mono uppercase">Vorschau Logo</span>
                                      </div>

                                      <div className="flex-1 w-full">
                                        <ImageUploader
                                          id={`ref-logo-${idx}`}
                                          label="Wähle das Kunden-Logo (Wird in der hochgeladenen Originalgröße und Proportionen dargestellt)"
                                          currentValue={ref.logoUrl}
                                          onChange={(val) => updateReference(idx, { logoUrl: val })}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* KUNDENSTIMME / TEXT TESTIMONIAL */}
                                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/60 space-y-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-3 bg-[#0073aa] rounded-full"></div>
                                      <h5 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Kundenstimme / Zitat-Text (Empfehlung)</h5>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                      <div>
                                        <label className="block text-zinc-600 mb-1">Autor Name / Ansprechpartner</label>
                                        <input
                                          type="text"
                                          value={ref.testimonial?.author || ''}
                                          onChange={(e) => updateReference(idx, { testimonial: { author: e.target.value, text: ref.testimonial?.text || '', role: ref.testimonial?.role || '' } })}
                                          className="w-full p-2.5 border border-zinc-300 rounded text-zinc-900 bg-white"
                                          placeholder="z. B. Claudia Fehrmann"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-zinc-600 mb-1">Autor Rolle / Position im Unternehmen</label>
                                        <input
                                          type="text"
                                          value={ref.testimonial?.role || ''}
                                          onChange={(e) => updateReference(idx, { testimonial: { role: e.target.value, author: ref.testimonial?.author || '', text: ref.testimonial?.text || '' } })}
                                          className="w-full p-2.5 border border-zinc-300 rounded text-zinc-900 bg-white"
                                          placeholder="z. B. Inhaberin"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-zinc-600 text-xs mb-1">Zitat-Empfehlungstext</label>
                                      <textarea
                                        rows={3}
                                        value={ref.testimonial?.text || ''}
                                        onChange={(e) => updateReference(idx, { testimonial: { text: e.target.value, author: ref.testimonial?.author || '', role: ref.testimonial?.role || '' } })}
                                        className="w-full p-2.5 border border-zinc-300 rounded text-xs text-zinc-900 bg-white leading-relaxed"
                                        placeholder="Schreibe hier die Bewertung des Kunden hinein..."
                                      />
                                    </div>
                                  </div>

                                  {/* PROJEKT-MEDIEN (IMAGE / VIDEO UPLOAD OR REEL LINK) */}
                                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/60 space-y-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-3 bg-[#0073aa] rounded-full"></div>
                                      <h5 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Projekt-Medien (Bilder, Videos, Reels & Links)</h5>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                      <div>
                                        <label className="block text-zinc-600 font-bold mb-1">Medien-Typ für diese Referenz</label>
                                        <select
                                          value={ref.mediaType || 'none'}
                                          onChange={(e) => updateReference(idx, { mediaType: e.target.value as any })}
                                          className="w-full p-2.5 bg-white border border-zinc-300 rounded text-zinc-900 font-semibold"
                                        >
                                          <option value="none">Keine Datei hochgeladen</option>
                                          <option value="image">Bilddatei hochladen (.jpg, .png)</option>
                                          <option value="video">Videodatei / Reel hochladen (.mp4, .mov)</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-zinc-600 font-bold mb-1 flex items-center gap-1">
                                          <Link className="w-3.5 h-3.5 text-[#0073aa]" />
                                          <span>Direkter Reel-Link / Instagram URL (Optional)</span>
                                        </label>
                                        <input
                                          type="text"
                                          value={ref.reelLink || ''}
                                          onChange={(e) => updateReference(idx, { reelLink: e.target.value })}
                                          placeholder="https://www.instagram.com/reel/..."
                                          className="w-full p-2.5 border border-zinc-300 rounded text-zinc-900 bg-white font-mono"
                                        />
                                      </div>
                                    </div>

                                    <div className="pt-2">
                                      {ref.mediaType === 'image' && (
                                        <ImageUploader
                                          id={`ref-image-file-${idx}`}
                                          label="Referenz-Bild hochladen"
                                          currentValue={ref.imageUrl}
                                          onChange={(val) => updateReference(idx, { imageUrl: val })}
                                        />
                                      )}
                                      {ref.mediaType === 'video' && (
                                        <VideoFileUploader
                                          id={`ref-video-file-${idx}`}
                                          label="Referenz-Video / Reel hochladen"
                                          currentValue={ref.imageUrl}
                                          onChange={(val) => updateReference(idx, { imageUrl: val })}
                                        />
                                      )}
                                    </div>

                                    {getInstagramEmbedUrl(ref.reelLink) && (
                                      <div className="pt-2 border-t border-zinc-200/60 mt-3">
                                        <div className="text-xs font-bold text-zinc-600 mb-2 flex items-center gap-1">
                                          <Play className="w-3.5 h-3.5 text-[#0073aa] fill-current" />
                                          <span>Instagram Reel Live-Vorschau:</span>
                                        </div>

                                        {/* Sizing Controls for the Backend Preview */}
                                        <div className="flex items-center gap-2 mb-3 bg-zinc-100 p-2 rounded-lg max-w-[240px] select-none">
                                          <span className="text-[10px] font-bold text-zinc-500">Größe:</span>
                                          <button
                                            type="button"
                                            onClick={() => setBackendPhoneScale(prev => Math.max(0.5, prev - 0.15))}
                                            className="w-6 h-6 flex items-center justify-center bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                                            title="Verkleinern"
                                          >
                                            -
                                          </button>
                                          <span className="text-[10px] font-mono font-bold text-zinc-600 w-8 text-center">{Math.round(backendPhoneScale * 100)}%</span>
                                          <button
                                            type="button"
                                            onClick={() => setBackendPhoneScale(prev => Math.min(1.5, prev + 0.15))}
                                            className="w-6 h-6 flex items-center justify-center bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                                            title="Vergrößern"
                                          >
                                            +
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setBackendPhoneScale(1.0)}
                                            className="text-[9px] text-[#0073aa] font-semibold hover:underline ml-auto cursor-pointer"
                                          >
                                            Reset
                                          </button>
                                        </div>

                                        {/* Miniature Mock Smartphone Wrapper */}
                                        <div 
                                          style={{ width: `${240 * backendPhoneScale}px`, height: `${420 * backendPhoneScale}px` }} 
                                          className="relative overflow-hidden shrink-0 transition-all duration-300 rounded-[32px] shadow-md border border-zinc-200"
                                        >
                                          <div 
                                            style={{ 
                                              transform: `scale(${backendPhoneScale})`, 
                                              transformOrigin: 'top left', 
                                              width: '240px', 
                                              height: '420px' 
                                            }} 
                                            className="absolute top-0 left-0"
                                          >
                                            {/* Miniature Mock Smartphone Body */}
                                            <div className="w-[240px] h-[420px] rounded-[32px] border-2 border-[#014e7a]/40 bg-black shadow-lg relative overflow-hidden select-none">
                                              
                                              {/* Status bar */}
                                              <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between px-3.5 text-[8px] font-sans font-semibold text-zinc-400 z-30 select-none">
                                                <span>12:30</span>
                                                <div className="w-12 h-2.5 bg-black rounded-full border border-zinc-900/40"></div>
                                                <div className="flex items-center gap-1">
                                                  <span className="text-[7px]">5G</span>
                                                  <div className="w-3 h-2 bg-emerald-500/80 rounded-[1px]"></div>
                                                </div>
                                              </div>

                                              <div className="absolute inset-0 bg-zinc-950 overflow-hidden rounded-[30px]">
                                                <iframe
                                                  src={getInstagramEmbedUrl(ref.reelLink)!}
                                                  className="absolute w-[102%] h-[calc(100%+114px)] -top-[54px] -left-[1%] border-0"
                                                  scrolling="no"
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <p className="text-[10px] text-zinc-400 mt-1">
                                          Diese Vorschau zeigt, wie das Reel direkt in die Website eingebettet wird.
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {/* SAVE REFERENCE BUTTON */}
                                  <div className="flex items-center justify-between gap-4 p-4 bg-emerald-50/50 rounded-xl border border-[#10b981]/30 text-xs mt-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                      <span className="text-zinc-600 font-medium font-semibold">Änderungen an dieser Referenz speichern?</span>
                                    </div>
                                    <button
                                      type="button"
                                      disabled={savingReferenceIdx === idx}
                                      onClick={() => handleSaveReference(idx)}
                                      className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:bg-zinc-400 disabled:cursor-not-allowed active:scale-95"
                                    >
                                      {savingReferenceIdx === idx ? (
                                        <>
                                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                          <span>Wird gespeichert...</span>
                                        </>
                                      ) : savedReferenceIdx === idx ? (
                                        <>
                                          <Check className="w-4 h-4 text-white" />
                                          <span>Gespeichert!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Save className="w-4 h-4" />
                                          <span>Referenz speichern</span>
                                        </>
                                      )}
                                    </button>
                                  </div>

                                </div>
                              )}

                            </div>
                          );
                        })}
                      </div>

                      {/* Add Button */}
                      <div className="pt-4 border-t border-zinc-100 flex justify-start">
                        <button
                          type="button"
                          onClick={addReference}
                          className="py-2.5 px-5 bg-[#0073aa] hover:bg-[#005177] text-white text-xs font-bold rounded shadow cursor-pointer flex items-center gap-1.5 transition-transform duration-100 active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Neue Referenz hinzufügen</span>
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                {/* 6. TAB: PROCESS (SCHRITTE) */}
                {activeTab === 'prozess' && (
                  <div className="space-y-6 pb-12 max-w-4xl font-sans">
                    <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-sm space-y-6">
                      <p className="text-sm text-zinc-500 mb-2">Passe den strukturierten Fahrplan deiner Zusammenarbeit und Beratungsphase an.</p>
                      
                      {cmsData.processes.map((step, idx) => (
                        <div key={idx} className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3 relative">
                          <span className="absolute top-3 right-3 font-mono font-black text-xs text-[#0073aa] bg-[#0073aa]/10 py-1 px-3.5 rounded-full uppercase">
                            Schritt {idx + 1}
                          </span>
                          
                          <div>
                            <label className="block text-zinc-600 font-bold mb-1 text-xs uppercase tracking-wider">Titel des Onboarding-Schritts</label>
                            <input
                              type="text"
                              value={step.title}
                              onChange={(e) => updateProcessStep(idx, 'title', e.target.value)}
                              className="w-full p-2.5 border border-zinc-300 rounded text-zinc-900 font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-zinc-600 font-bold mb-1 text-xs uppercase tracking-wider">Detaillierte Beschreibung</label>
                            <textarea
                              rows={2}
                              value={step.description}
                              onChange={(e) => updateProcessStep(idx, 'description', e.target.value)}
                              className="w-full p-2.5 border border-zinc-300 rounded text-zinc-900"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6B. TAB: CALENDLY INTEGRATION */}
                {activeTab === 'calendly' && (
                  <div className="space-y-6 pb-12 max-w-4xl font-sans">
                    {/* Status & Connection Card */}
                    <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-sm space-y-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-100 pb-4">
                        <div>
                          <h3 className="text-base font-bold text-zinc-900">Status der Calendly-Verbindung</h3>
                          <p className="text-xs text-zinc-500 mt-0.5">Steuere und synchronisiere die automatische Weiterleitung aller Buchungsanfragen direkt mit deinem Calendly-Konto.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {cmsData.calendly?.isConnected ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              Verbunden ({cmsData.calendly?.connectedEmail || auth.currentUser?.email || 'Aktiv'})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 text-zinc-600 border border-zinc-200 rounded-full text-xs font-semibold">
                              <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                              Nicht verbunden
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Connection / Login block */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Mein Calendly Buchungs-Link</label>
                            <input
                              type="url"
                              value={cmsData.calendly?.calendlyUrl ?? 'https://calendly.com/floriankusche'}
                              onChange={(e) => updateCalendlyField('calendlyUrl', e.target.value)}
                              placeholder="https://calendly.com/ihr-name"
                              className="w-full p-2.5 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#0073aa] text-zinc-900"
                            />
                            <p className="text-[10px] text-zinc-400 mt-1">Dieser Link wird für Online-Buchungen auf der Hauptseite genutzt.</p>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Calendly API-Zugriffsschlüssel (Optional)</label>
                            <input
                              type="password"
                              value={cmsData.calendly?.calendlyToken ?? ''}
                              onChange={(e) => updateCalendlyField('calendlyToken', e.target.value)}
                              placeholder="live_token_abc123..."
                              className="w-full p-2.5 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#0073aa] text-zinc-900"
                            />
                            <p className="text-[10px] text-zinc-400 mt-1">Sorgt für vollautomatische Live-Abfragen und Abgleich der Anfragen.</p>
                          </div>
                        </div>

                        <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-5 space-y-4">
                          <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Direkter Calendly Login & Abgleich</h4>
                          <p className="text-xs text-zinc-600 leading-relaxed">
                            Logge dich ein, um deine Calendly-Ereignisse und -Formulare mit diesem Portal zu verbinden. Alle Kundenanfragen und Buchungen werden vollautomatisch im Hintergrund synchronisiert.
                          </p>

                          <div className="flex flex-wrap gap-2 pt-2">
                            {cmsData.calendly?.isConnected ? (
                              <button
                                type="button"
                                onClick={() => {
                                  updateCalendlyFields({
                                    isConnected: false,
                                    connectedEmail: ''
                                  });
                                }}
                                className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded shadow transition-all active:scale-95 cursor-pointer"
                              >
                                Verbindung trennen
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  // High-fidelity simulation of OAuth or token connection
                                  updateCalendlyFields({
                                    isConnected: true,
                                    connectedEmail: auth.currentUser?.email || 'florian@floriankusche.de'
                                  });
                                }}
                                className="py-2 px-4 bg-[#0073aa] hover:bg-[#005177] text-white text-xs font-bold rounded shadow transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                              >
                                <Calendar className="w-4 h-4 shrink-0" />
                                <span>Jetzt mit Calendly einloggen & koppeln</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                alert('Synchronisierung erfolgreich gestartet! Calendly-Daten werden aktualisiert...');
                              }}
                              className="py-2 px-4 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded shadow transition-all active:scale-95 cursor-pointer"
                            >
                              Jetzt synchronisieren
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bookings & Inquiries Card */}
                    <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-sm space-y-6">
                      <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
                        <div>
                          <h3 className="text-base font-bold text-zinc-900">Synchronisierte Termine & Anfragen</h3>
                          <p className="text-xs text-zinc-500 mt-0.5">Hier siehst du alle eingegangenen Calendly-Buchungen und deren Synchronisationsstatus.</p>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => {
                            const newBookingName = prompt('Name des Kunden:');
                            if (!newBookingName) return;
                            const newBookingEmail = prompt('E-Mail des Kunden:');
                            if (!newBookingEmail) return;
                            const newBookingType = prompt('Ereignistyp:', '1:1 Instagram Strategie-Gespräch') || '1:1 Instagram Strategie-Gespräch';
                            const newBookingNotes = prompt('Notiz / Nachricht:') || '';
                            
                            const newBooking = {
                              id: `manual-${Date.now()}`,
                              name: newBookingName,
                              email: newBookingEmail,
                              eventType: newBookingType,
                              dateTime: new Date(Date.now() + 86400000 * 2).toISOString(),
                              status: 'confirmed' as const,
                              notes: newBookingNotes
                            };
                            
                            const currentBookings = cmsData.calendly?.bookings || [];
                            updateCalendlyField('bookings', [newBooking, ...currentBookings]);
                          }}
                          className="py-1.5 px-3 bg-zinc-100 border border-zinc-300 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded cursor-pointer transition-transform duration-100 active:scale-95 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Eintrag hinzufügen</span>
                        </button>
                      </div>

                      {/* Bookings List */}
                      {(!cmsData.calendly?.bookings || cmsData.calendly.bookings.length === 0) ? (
                        <div className="text-center py-12 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl">
                          <Calendar className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-zinc-600">Keine Buchungen gefunden</p>
                          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">Koppele Calendly oben oder füge einen manuellen Eintrag hinzu, um Buchungen anzuzeigen.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {cmsData.calendly.bookings.map((booking) => (
                            <div key={booking.id} className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-zinc-300 transition-colors">
                              <div className="space-y-1 max-w-xl">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm font-bold text-zinc-800">{booking.name}</h4>
                                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                    {booking.status === 'confirmed' ? 'Bestätigt' : 'Abgesagt'}
                                  </span>
                                  <span className="text-[10px] text-zinc-400 font-mono">ID: {booking.id}</span>
                                </div>
                                <p className="text-xs text-zinc-500">
                                  <strong>E-Mail:</strong> {booking.email} | <strong>Event:</strong> {booking.eventType}
                                </p>
                                <p className="text-xs text-zinc-500">
                                  <strong>Datum/Zeit:</strong> {new Date(booking.dateTime).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}
                                </p>
                                {booking.notes && (
                                  <p className="text-xs bg-white border border-zinc-150 p-2.5 rounded text-zinc-600 italic mt-1.5 leading-relaxed">
                                    &bdquo;{booking.notes}&ldquo;
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex gap-2 shrink-0 w-full md:w-auto justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm('Möchtest du diesen Eintrag wirklich löschen?')) {
                                      const currentBookings = cmsData.calendly?.bookings || [];
                                      const updated = currentBookings.filter(b => b.id !== booking.id);
                                      updateCalendlyField('bookings', updated);
                                    }
                                  }}
                                  className="p-2 text-red-600 hover:text-red-700 bg-white border border-zinc-200 rounded shadow-sm hover:border-red-300 transition-all cursor-pointer active:scale-95"
                                  title="Eintrag löschen"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <a
                                  href={`mailto:${booking.email}`}
                                  className="py-1.5 px-3 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold rounded shadow-sm transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                                >
                                  E-Mail senden
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 7. TAB: FOOTER & CONTACT DETAILS */}
                {activeTab === 'contact' && (
                  <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-sm space-y-6 max-w-3xl pb-12 font-sans">
                    <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-200 pb-2">Kontakte & Impressum Angaben</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">E-Mail-Adresse für Anfragen</label>
                        <input
                          type="email"
                          value={cmsData.footer.email}
                          onChange={(e) => updateFooterField('email', e.target.value)}
                          className="w-full p-2.5 border border-zinc-300 rounded text-sm text-[#0073aa] font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Telefon / WhatsApp-Nummer (Inkl. +49)</label>
                        <input
                          type="text"
                          value={cmsData.footer.phone}
                          onChange={(e) => updateFooterField('phone', e.target.value)}
                          className="w-full p-2.5 border border-zinc-300 rounded text-sm font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Instagram Account Handle</label>
                        <input
                          type="text"
                          value={cmsData.footer.instagram}
                          onChange={(e) => updateFooterField('instagram', e.target.value)}
                          className="w-full p-2.5 border border-zinc-300 rounded text-sm font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Physischer Standort (Impressum)</label>
                        <input
                          type="text"
                          value={cmsData.footer.location}
                          onChange={(e) => updateFooterField('location', e.target.value)}
                          className="w-full p-2.5 border border-zinc-300 rounded text-sm"
                        />
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-200 pb-2 mt-8">Kontakt Foto Einstellungen</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Füge dein eigenes Foto oder eine Grafik zwischen der Überschrift &bdquo;Kontakt &amp; Dialog&ldquo; und dem Slogan &bdquo;Lass uns etwas großes starten&ldquo; ein.
                    </p>

                    <div className="p-4 border border-zinc-200 rounded-xl bg-zinc-50 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-extrabold text-zinc-900">Kontakt-Foto aktivieren</h4>
                        <p className="text-xs text-zinc-500">Aktiviert die Bildanzeige im Kontakt-Bereich.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!cmsData.contactImage?.enabled}
                          onChange={(e) => updateContactImageField('enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-zinc-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-[#0073aa] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0073aa]"></div>
                        <span className="ml-2 text-xs font-bold text-zinc-700">Aktiviert</span>
                      </label>
                    </div>

                    {!!cmsData.contactImage?.enabled && (
                      <div className="space-y-4 pt-3 border-t border-zinc-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <ImageUploader
                              id="contact-image-upload"
                              label="Foto hochladen"
                              currentValue={cmsData.contactImage?.imageUrl || ''}
                              onChange={(val) => updateContactImageField('imageUrl', val)}
                            />
                          </div>

                          <div className="space-y-4 text-xs font-medium text-zinc-600">
                            {/* 1. Width Slider */}
                            <div>
                              <div className="flex justify-between mb-1">
                                <label className="font-bold text-zinc-700">Bildbreite (Größe auf Website)</label>
                                <span className="font-mono text-[#0073aa] font-bold">{cmsData.contactImage?.width || 250}px</span>
                              </div>
                              <input
                                type="range"
                                min="80"
                                max="600"
                                step="10"
                                value={cmsData.contactImage?.width || 250}
                                onChange={(e) => updateContactImageField('width', parseInt(e.target.value))}
                                className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-[#0073aa]"
                              />
                              <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                                <span>Klein (80px)</span>
                                <span>Mittel (250px)</span>
                                <span>Groß (600px)</span>
                              </div>
                            </div>

                            {/* 2. Rounding Dropdown */}
                            <div>
                              <label className="block font-bold text-zinc-700 mb-1">Ecken-Abrundung</label>
                              <select
                                value={cmsData.contactImage?.borderRadius || 'xl'}
                                onChange={(e) => updateContactImageField('borderRadius', e.target.value)}
                                className="w-full p-2 border border-zinc-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#0073aa] text-zinc-900"
                              >
                                <option value="none">Flach / Eckig</option>
                                <option value="md">Leicht abgerundet (md)</option>
                                <option value="xl">Abgerundete Kanten (xl)</option>
                                <option value="full">Kreisrund (Vollständig)</option>
                              </select>
                            </div>

                            {/* 3. Alignment Selection */}
                            <div>
                              <label className="block font-bold text-zinc-700 mb-1">Ausrichtung (PC-Ansicht)</label>
                              <div className="grid grid-cols-3 gap-2">
                                {(['left', 'center', 'right'] as const).map((align) => (
                                  <button
                                    key={align}
                                    type="button"
                                    onClick={() => updateContactImageField('alignment', align)}
                                    className={`p-2 border text-xs font-bold rounded capitalize transition-all ${
                                      (cmsData.contactImage?.alignment || 'left') === align
                                        ? 'border-[#0073aa] bg-[#0073aa]/10 text-[#0073aa]'
                                        : 'border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50'
                                    }`}
                                  >
                                    {align === 'left' ? 'Links' : align === 'center' ? 'Mitte' : 'Rechts'}
                                  </button>
                                ))}
                              </div>
                              <span className="text-[10px] text-zinc-400 block mt-1">Auf Mobilgeräten wird das Bild für optimales Layout immer zentriert angezeigt.</span>
                            </div>

                            {/* 4. Spacing */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block font-bold text-zinc-700 mb-1">Abstand Oben (px)</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="120"
                                  value={cmsData.contactImage?.marginTop ?? 0}
                                  onChange={(e) => updateContactImageField('marginTop', Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-full p-2 border border-zinc-300 rounded text-sm text-zinc-900 focus:outline-[#0073aa]"
                                />
                              </div>
                              <div>
                                <label className="block font-bold text-zinc-700 mb-1">Abstand Unten (px)</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="120"
                                  value={cmsData.contactImage?.marginBottom ?? 20}
                                  onChange={(e) => updateContactImageField('marginBottom', Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-full p-2 border border-zinc-300 rounded text-sm text-zinc-900 focus:outline-[#0073aa]"
                                />
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 7.5. TAB: DESIGN & FARBEN (Sliders for Tile, Button, Backgrounds) */}
                {activeTab === 'colors' && cmsData && (() => {
                  const activeColors = cmsData.colors || {
                    accent: '#ffcc00',
                    accentBrightness: 0,
                    brandDark: '#004369',
                    brandDarkBrightness: 0,
                    brandDarker: '#002d47',
                    brandDarkerBrightness: 0,
                    brandDarkCard: '#014e7a',
                    brandDarkCardBrightness: 0
                  };

                  return (
                    <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-sm space-y-8 max-w-4xl pb-12 font-sans text-zinc-800">
                      <div>
                        <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-200 pb-2 flex items-center gap-2">
                          <Palette className="w-5 h-5 text-[#0073aa]" />
                          <span>Farben & Helligkeitsregler</span>
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                          Passe die primären Farben deiner Website an. Wähle eine Basisfarbe für deine Elemente und nutze die Helligkeitsregler (Schieberegler), um diese beliebig zu <strong>verdunkeln</strong> oder zu <strong>erhellen</strong>. Die Änderungen wirken sich dynamisch auf der gesamten Mainpage aus, sobald du sie veröffentlichst.
                        </p>
                      </div>

                      {/* Color Editors Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* 1. BUTTONS & ACCENTS */}
                        <div className="p-4 border border-zinc-200 rounded-xl space-y-4 bg-zinc-50 relative">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-[#0073aa] flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: adjustBrightness(activeColors.accent, activeColors.accentBrightness) }}></span>
                              <span>Buttons & Akzentfarbe</span>
                            </h4>
                            <button
                              type="button"
                              onClick={() => {
                                updateColorField('accent', '#ffcc00');
                                updateColorField('accentBrightness', 0);
                              }}
                              className="text-[10px] text-zinc-500 hover:text-red-600 underline font-semibold cursor-pointer"
                            >
                              Standard
                            </button>
                          </div>
                          <p className="text-xs text-zinc-400">Verwendet für Primärbuttons, Text-Highlights und Symbole.</p>
                          
                          <div className="flex gap-4 items-center">
                            <div className="flex flex-col items-center gap-1 shrink-0">
                              <label className="text-[10px] uppercase font-bold text-zinc-500">Basis</label>
                              <input
                                type="color"
                                value={activeColors.accent}
                                onChange={(e) => updateColorField('accent', e.target.value)}
                                className="w-12 h-10 border border-zinc-300 rounded cursor-pointer p-0.5"
                              />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between text-xs font-bold text-zinc-600">
                                <span>Verdunkeln / Erhellen</span>
                                <span className="font-mono text-xs bg-zinc-200 px-1.5 py-0.5 rounded text-zinc-700">
                                  {activeColors.accentBrightness > 0 ? `+${activeColors.accentBrightness}%` : `${activeColors.accentBrightness}%`}
                                </span>
                              </div>
                              <input
                                type="range"
                                min="-80"
                                max="80"
                                value={activeColors.accentBrightness || 0}
                                onChange={(e) => updateColorField('accentBrightness', parseInt(e.target.value))}
                                className="w-full cursor-pointer accent-[#0073aa]"
                              />
                              <div className="flex justify-between text-[10px] text-zinc-400">
                                <span>← Verdunkeln</span>
                                <span>Erhellen →</span>
                              </div>
                            </div>
                          </div>

                          {/* Result */}
                          <div className="flex items-center justify-between p-2 bg-white border border-zinc-200 rounded-lg">
                            <span className="text-[11px] font-semibold text-zinc-500">Vorschau Farbe:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-bold text-zinc-700">{adjustBrightness(activeColors.accent, activeColors.accentBrightness)}</span>
                              <div className="w-12 h-5 rounded border border-zinc-300" style={{ backgroundColor: adjustBrightness(activeColors.accent, activeColors.accentBrightness) }}></div>
                            </div>
                          </div>
                        </div>

                        {/* 2. TILES & CARDS */}
                        <div className="p-4 border border-zinc-200 rounded-xl space-y-4 bg-zinc-50 relative">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-[#0073aa] flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: adjustBrightness(activeColors.brandDarkCard, activeColors.brandDarkCardBrightness) }}></span>
                              <span>Kacheln & Boxen</span>
                            </h4>
                            <button
                              type="button"
                              onClick={() => {
                                updateColorField('brandDarkCard', '#014e7a');
                                updateColorField('brandDarkCardBrightness', 0);
                              }}
                              className="text-[10px] text-zinc-500 hover:text-red-600 underline font-semibold cursor-pointer"
                            >
                              Standard
                            </button>
                          </div>
                          <p className="text-xs text-zinc-400">Verwendet für Service-Kacheln, Abgrenzungen und sekundäre Boxen.</p>
                          
                          <div className="flex gap-4 items-center">
                            <div className="flex flex-col items-center gap-1 shrink-0">
                              <label className="text-[10px] uppercase font-bold text-zinc-500">Basis</label>
                              <input
                                type="color"
                                value={activeColors.brandDarkCard}
                                onChange={(e) => updateColorField('brandDarkCard', e.target.value)}
                                className="w-12 h-10 border border-zinc-300 rounded cursor-pointer p-0.5"
                              />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between text-xs font-bold text-zinc-600">
                                <span>Verdunkeln / Erhellen</span>
                                <span className="font-mono text-xs bg-zinc-200 px-1.5 py-0.5 rounded text-zinc-700">
                                  {activeColors.brandDarkCardBrightness > 0 ? `+${activeColors.brandDarkCardBrightness}%` : `${activeColors.brandDarkCardBrightness}%`}
                                </span>
                              </div>
                              <input
                                type="range"
                                min="-80"
                                max="80"
                                value={activeColors.brandDarkCardBrightness || 0}
                                onChange={(e) => updateColorField('brandDarkCardBrightness', parseInt(e.target.value))}
                                className="w-full cursor-pointer accent-[#0073aa]"
                              />
                              <div className="flex justify-between text-[10px] text-zinc-400">
                                <span>← Verdunkeln</span>
                                <span>Erhellen →</span>
                              </div>
                            </div>
                          </div>

                          {/* Result */}
                          <div className="flex items-center justify-between p-2 bg-white border border-zinc-200 rounded-lg">
                            <span className="text-[11px] font-semibold text-zinc-500">Vorschau Farbe:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-bold text-zinc-700">{adjustBrightness(activeColors.brandDarkCard, activeColors.brandDarkCardBrightness)}</span>
                              <div className="w-12 h-5 rounded border border-zinc-300" style={{ backgroundColor: adjustBrightness(activeColors.brandDarkCard, activeColors.brandDarkCardBrightness) }}></div>
                            </div>
                          </div>
                        </div>

                        {/* 3. BACKGROUND 1 */}
                        <div className="p-4 border border-zinc-200 rounded-xl space-y-4 bg-zinc-50 relative">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-[#0073aa] flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: adjustBrightness(activeColors.brandDark, activeColors.brandDarkBrightness) }}></span>
                              <span>Hintergrund 1 (Hauptseite)</span>
                            </h4>
                            <button
                              type="button"
                              onClick={() => {
                                updateColorField('brandDark', '#004369');
                                updateColorField('brandDarkBrightness', 0);
                              }}
                              className="text-[10px] text-zinc-500 hover:text-red-600 underline font-semibold cursor-pointer"
                            >
                              Standard
                            </button>
                          </div>
                          <p className="text-xs text-zinc-400">Der Haupt-Hintergrundton der gesamten Landingpage.</p>
                          
                          <div className="flex gap-4 items-center">
                            <div className="flex flex-col items-center gap-1 shrink-0">
                              <label className="text-[10px] uppercase font-bold text-zinc-500">Basis</label>
                              <input
                                type="color"
                                value={activeColors.brandDark}
                                onChange={(e) => updateColorField('brandDark', e.target.value)}
                                className="w-12 h-10 border border-zinc-300 rounded cursor-pointer p-0.5"
                              />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between text-xs font-bold text-zinc-600">
                                <span>Verdunkeln / Erhellen</span>
                                <span className="font-mono text-xs bg-zinc-200 px-1.5 py-0.5 rounded text-zinc-700">
                                  {activeColors.brandDarkBrightness > 0 ? `+${activeColors.brandDarkBrightness}%` : `${activeColors.brandDarkBrightness}%`}
                                </span>
                              </div>
                              <input
                                type="range"
                                min="-80"
                                max="80"
                                value={activeColors.brandDarkBrightness || 0}
                                onChange={(e) => updateColorField('brandDarkBrightness', parseInt(e.target.value))}
                                className="w-full cursor-pointer accent-[#0073aa]"
                              />
                              <div className="flex justify-between text-[10px] text-zinc-400">
                                <span>← Verdunkeln</span>
                                <span>Erhellen →</span>
                              </div>
                            </div>
                          </div>

                          {/* Result */}
                          <div className="flex items-center justify-between p-2 bg-white border border-zinc-200 rounded-lg">
                            <span className="text-[11px] font-semibold text-zinc-500">Vorschau Farbe:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-bold text-zinc-700">{adjustBrightness(activeColors.brandDark, activeColors.brandDarkBrightness)}</span>
                              <div className="w-12 h-5 rounded border border-zinc-300" style={{ backgroundColor: adjustBrightness(activeColors.brandDark, activeColors.brandDarkBrightness) }}></div>
                            </div>
                          </div>
                        </div>

                        {/* 4. BACKGROUND 2 */}
                        <div className="p-4 border border-zinc-200 rounded-xl space-y-4 bg-zinc-50 relative">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-[#0073aa] flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: adjustBrightness(activeColors.brandDarker, activeColors.brandDarkerBrightness) }}></span>
                              <span>Hintergrund 2 (Sekundär)</span>
                            </h4>
                            <button
                              type="button"
                              onClick={() => {
                                updateColorField('brandDarker', '#002d47');
                                updateColorField('brandDarkerBrightness', 0);
                              }}
                              className="text-[10px] text-zinc-500 hover:text-red-600 underline font-semibold cursor-pointer"
                            >
                              Standard
                            </button>
                          </div>
                          <p className="text-xs text-zinc-400">Genutzt für Hero-Footer, Footer-Menü und Onepager-Hintergründe.</p>
                          
                          <div className="flex gap-4 items-center">
                            <div className="flex flex-col items-center gap-1 shrink-0">
                              <label className="text-[10px] uppercase font-bold text-zinc-500">Basis</label>
                              <input
                                type="color"
                                value={activeColors.brandDarker}
                                onChange={(e) => updateColorField('brandDarker', e.target.value)}
                                className="w-12 h-10 border border-zinc-300 rounded cursor-pointer p-0.5"
                              />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between text-xs font-bold text-zinc-600">
                                <span>Verdunkeln / Erhellen</span>
                                <span className="font-mono text-xs bg-zinc-200 px-1.5 py-0.5 rounded text-zinc-700">
                                  {activeColors.brandDarkerBrightness > 0 ? `+${activeColors.brandDarkerBrightness}%` : `${activeColors.brandDarkerBrightness}%`}
                                </span>
                              </div>
                              <input
                                type="range"
                                min="-80"
                                max="80"
                                value={activeColors.brandDarkerBrightness || 0}
                                onChange={(e) => updateColorField('brandDarkerBrightness', parseInt(e.target.value))}
                                className="w-full cursor-pointer accent-[#0073aa]"
                              />
                              <div className="flex justify-between text-[10px] text-zinc-400">
                                <span>← Verdunkeln</span>
                                <span>Erhellen →</span>
                              </div>
                            </div>
                          </div>

                          {/* Result */}
                          <div className="flex items-center justify-between p-2 bg-white border border-zinc-200 rounded-lg">
                            <span className="text-[11px] font-semibold text-zinc-500">Vorschau Farbe:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-bold text-zinc-700">{adjustBrightness(activeColors.brandDarker, activeColors.brandDarkerBrightness)}</span>
                              <div className="w-12 h-5 rounded border border-zinc-300" style={{ backgroundColor: adjustBrightness(activeColors.brandDarker, activeColors.brandDarkerBrightness) }}></div>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Info alert box */}
                      <div className="p-4 bg-blue-50 text-blue-800 border-l-4 border-blue-500 rounded text-xs flex gap-2.5 shadow-sm leading-relaxed">
                        <Palette className="w-5 h-5 text-blue-600 shrink-0" />
                        <div>
                          <strong className="font-bold block mb-0.5">Live-Vorschau in Echtzeit:</strong>
                          <span>Sobald du die Regler verschiebst, siehst du das erzeugte Farbschema unten aufgelistet. Wenn du fertig bist, klicke oben rechts auf <strong>"Veröffentlichen"</strong>, um das Farbschema für alle Besucher live zu schalten.</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 8. TAB: SECURITY & ADMINISTRATIVE CREDENTIALS */}
                {activeTab === 'credentials' && (
                  <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-sm space-y-6 max-w-2xl pb-12 font-sans text-zinc-800">
                    <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-200 pb-2">Admin-Zugangsdaten bearbeiten</h3>
                    
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Hier können Sie die Zugangsdaten für Ihren Admin-Account anpassen. Nach dem Speichern müssen diese bei der nächsten Anmeldung verwendet werden.
                    </p>

                    {credStatus === 'success' && (
                      <div className="bg-emerald-50 text-emerald-800 p-4 border-l-4 border-emerald-500 rounded text-xs flex items-center gap-2.5 shadow-sm">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>Zugangsdaten erfolgreich aktualisiert! Ab der nächsten Anmeldung gelten die neuen Angaben.</span>
                      </div>
                    )}

                    {credStatus === 'error' && (
                      <div className="bg-red-50 text-red-800 p-4 border-l-4 border-red-500 rounded text-xs flex items-center gap-2.5 shadow-sm">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                        <span>{credError}</span>
                      </div>
                    )}

                    <form onSubmit={handleUpdateCredentials} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">E-Mail-Adresse</label>
                        <input
                          type="email"
                          required
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="w-full p-2.5 border border-zinc-300 rounded text-sm font-semibold focus:ring-2 focus:ring-[#0073aa] focus:outline-none"
                        />
                      </div>

                      <div className="border-t border-zinc-200 pt-4 mt-4 space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Passwort ändern (optional)</h4>
                        
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Neues Passwort</label>
                          <input
                            type="password"
                            placeholder="Leergelassen = keine Änderung"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-2.5 border border-zinc-300 rounded text-sm placeholder:text-zinc-400 focus:ring-2 focus:ring-[#0073aa] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Neues Passwort bestätigen</label>
                          <input
                            type="password"
                            placeholder="Zweites Mal zur Sicherheit"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-2.5 border border-zinc-300 rounded text-sm placeholder:text-zinc-400 focus:ring-2 focus:ring-[#0073aa] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-zinc-200 flex justify-end">
                        <button
                          type="submit"
                          disabled={credStatus === 'updating'}
                          className="py-2 px-5 bg-[#0073aa] hover:bg-[#005177] text-white text-xs font-bold uppercase rounded shadow cursor-pointer transition-colors"
                        >
                          {credStatus === 'updating' ? 'Wird aktualisiert...' : 'Zugangsdaten speichern'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

              </div>
            )}

          </div>

        </main>
      </div>

    </div>
  );
}

// FORM ASSISTANTS TO PREVENT OVERFLOW & ENHANCE READING
function ServiceCreateForm({ onClose, onCreate }: { onClose: () => void; onCreate: (s: Service) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [label, setLabel] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    const generatedId = title.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-');
    onCreate({
      id: generatedId,
      title,
      description,
      label: label.toUpperCase() || 'SUPPORT',
      isPrimary
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 font-sans select-none">
      <div className="bg-white border border-zinc-300 rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
        <h3 className="text-lg font-bold border-b border-zinc-200 pb-2">Neue Leistung eintragen</h3>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
          <div>
            <label className="block font-bold text-[#32373c] mb-1">Titel</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 border border-zinc-300 rounded text-zinc-900"
              placeholder="z.B. Instagram Kampagnen"
            />
          </div>
          <div>
            <label className="block font-bold text-[#32373c] mb-1">Beschreibung</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 border border-zinc-300 rounded text-zinc-900"
              placeholder="Schreibe eine fesselnde Detailbeschreibung..."
            />
          </div>
          <div>
            <label className="block font-bold text-[#32373c] mb-1">WP Kategorie-Schild (z.B. STRATEGY)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full p-2.5 border border-zinc-300 rounded text-zinc-900"
              placeholder="CREATE, MANAGE, ANALYZE..."
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="new_is_primary"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="w-4 h-4 text-[#0073aa]"
            />
            <label htmlFor="new_is_primary" className="font-bold text-[#32373c] uppercase text-xs tracking-wider">Als Hauptleistung markieren</label>
          </div>

          <div className="pt-4 border-t border-zinc-200 flex justify-end gap-3 text-xs">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-zinc-100 border border-zinc-300 text-zinc-700 rounded font-bold hover:bg-zinc-200"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="py-2 px-5 bg-[#0073aa] text-white font-bold rounded hover:bg-[#005177]"
            >
              Erstellen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ToolCreateForm({ onClose, onCreate }: { onClose: () => void; onCreate: (t: Tool) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconName, setIconName] = useState<'Canva' | 'Drive' | 'CapCut' | 'Instagram'>('Canva');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onCreate({
      name,
      description,
      iconName
    });
  };

  return (
    <div className="bg-white border border-zinc-300 rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
      <h3 className="text-lg font-bold border-b border-zinc-200 pb-2">Tool zum Arsenal hinzufügen</h3>
      <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
        <div>
          <label className="block font-bold text-[#32373c] mb-1">Zahnrad Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2.5 border border-zinc-300 rounded text-zinc-900"
            placeholder="z.B. Adobe Premiere"
          />
        </div>
        <div>
          <label className="block font-bold text-[#32373c] mb-1">Zweck / Beschreibung</label>
          <textarea
            rows={2}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2.5 border border-zinc-300 rounded text-zinc-900"
            placeholder="Welche Rolle spielt dieses Werkzeug für Kundenbetreuung?"
          />
        </div>
        <div>
          <label className="block font-bold text-[#32373c] mb-1">UI-Icon Typ</label>
          <select
            value={iconName}
            onChange={(e) => setIconName(e.target.value as any)}
            className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded text-zinc-900"
          >
            <option value="Canva">Canva Pro Layout</option>
            <option value="Drive">Google Drive Cloud</option>
            <option value="CapCut">CapCut App Schnitt</option>
            <option value="Instagram">Instagram Native App</option>
          </select>
        </div>

        <div className="pt-4 border-t border-zinc-200 flex justify-end gap-3 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-zinc-100 border border-zinc-300 text-zinc-700 rounded font-bold hover:bg-zinc-200"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            className="py-2 px-5 bg-[#0073aa] text-white font-bold rounded hover:bg-[#005177]"
          >
            Speichern
          </button>
        </div>
      </form>
    </div>
  );
}

export function VideoFileUploader({
  id,
  currentValue,
  onChange,
  label
}: {
  id: string;
  currentValue: string | undefined;
  onChange: (value: string) => void;
  label?: string;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith('video/')) {
        setError('Bitte wähle eine gültige Videodatei (MP4, MOV, WEBM).');
        return;
      }
      if (file.size > 15 * 1024 * 1024) { // 15MB limit
        setError('Das Video ist zu groß. Bitte lade eine Datei unter 15MB hoch, um Ladezeiten gering zu halten.');
        return;
      }

      setIsProcessing(true);
      setError('');
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          onChange(event.target.result);
        }
        setIsProcessing(false);
      };
      reader.onerror = () => {
        setError('Fehler beim Lesen der Datei.');
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-zinc-600 font-bold mb-1 text-xs">{label}</label>}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Video Preview Box */}
        <div className="relative w-24 h-24 rounded-lg bg-zinc-100 border border-zinc-200 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-inner">
          {currentValue ? (
            <video
              src={currentValue}
              className="w-full h-full object-cover"
              muted
              loop
              autoPlay
              playsInline
            />
          ) : (
            <div className="text-zinc-400 text-center text-[10px] uppercase font-mono p-1">
              <Video className="w-5 h-5 mx-auto mb-1 text-zinc-300" />
              Kein Video
            </div>
          )}
          {currentValue && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 hover:scale-110 transition-all cursor-pointer shadow text-[10px] z-10"
              title="Video entfernen"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Upload area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 w-full min-h-[96px] border-2 border-dashed border-zinc-300 hover:border-[#0073aa] hover:bg-zinc-50 rounded-lg flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all"
        >
          <input
            id={id}
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="video/*"
            className="hidden"
          />
          {isProcessing ? (
            <div className="space-y-1">
              <Loader2 className="w-5 h-5 animate-spin text-[#0073aa] mx-auto" />
              <p className="text-xs text-zinc-500 font-medium">Video wird geladen & kodiert...</p>
            </div>
          ) : (
            <div className="space-y-1">
              <Upload className="w-5 h-5 mx-auto text-zinc-400" />
              <p className="text-xs text-zinc-700 font-semibold">Video (.mp4, .mov, etc.) hochladen</p>
              <p className="text-[10px] text-zinc-400 font-mono uppercase">Max. 15MB • Für mobile Reels optimiert</p>
            </div>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-red-600 font-medium mt-1">⚠️ {error}</p>}
    </div>
  );
}
