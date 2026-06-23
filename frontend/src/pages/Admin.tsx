import { useEffect, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Upload, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { defaultSiteContent, SiteContent, LeadEntry, BlogPost } from '../lib/siteContent';
import { fetchSiteContent, fetchLeads, loginAdmin, saveSiteContent, verifyToken, uploadFile, deleteLead, createLead, fetchBlogs, createBlog, updateBlog, deleteBlogPost } from '../lib/api';
import { formatQuoteNumber, sanitizeFileName } from '../lib/quoteUtils';
import { slugifyBlogTitle } from '../lib/blogUtils';

const TOKEN_KEY = 'bolt_admin_token';

const SERVICE_NAMES = [
  'Residential Moving',
  'Office & Commercial',
  'Professional Packing',
  'Long-Distance Moving',
  'Storage Solutions',
  'Furniture Assembly',
];

type CropTarget = 'hero' | 'service' | 'whyUs' | 'blog';

interface PhotoToCrop {
  file: File;
  previewUrl: string;
  target: CropTarget;
  index?: number;
}

interface QuoteDraft {
  id: string;
  quoteNumber: string;
  issueDate: string;
  validUntil: string;
  name: string;
  email: string;
  phone: string;
  from_location: string;
  to_location: string;
  current_floor: string;
  destination_floor: string;
  current_size: string;
  destination_size: string;
  move_date: string;
  move_type: string;
  message: string;
  inventory: { description: string; quantity: string }[];
  services: string[];
  pricing: { description: string; amount: string }[];
  total_price: string;
  terms: string[];
}

const SECTION_META = {
  hero: {
    title: 'Homepage Content',
    description: 'Edit the hero headline, CTA, subtext, and hero background image.',
  },
  services: {
    title: 'Service Photos',
    description: 'Manage the images used for each service card on the homepage.',
  },
  contacts: {
    title: 'Contact Details',
    description: 'Update phone, email, and footer text shown site-wide.',
  },
  whyUs: {
    title: 'Why Us Image',
    description: 'Manage the image used in the Why Us section with the success stat overlay.',
  },
  blogs: {
    title: 'Blog Posts',
    description: 'Create, edit, and manage blog articles with images.',
  },
  leads: {
    title: 'Leads',
    description: 'Review submitted quote leads and track incoming inquiries.',
  },
} as const;

type AdminSection = keyof typeof SECTION_META;

export default function Admin() {
  const [siteContent, setSiteContent] = useState<SiteContent>(defaultSiteContent);
  const [leads, setLeads] = useState<LeadEntry[]>([]);
  const [token, setToken] = useState<string>('');
  const [authState, setAuthState] = useState<'loading' | 'logged-out' | 'logged-in'>('loading');
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [savedAt, setSavedAt] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingWhyUs, setUploadingWhyUs] = useState(false);
  const [uploadingService, setUploadingService] = useState<number | null>(null);
  const [photoToCrop, setPhotoToCrop] = useState<PhotoToCrop | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>('hero');
  const [showManualLeadForm, setShowManualLeadForm] = useState(false);
  const [manualLeadForm, setManualLeadForm] = useState<Partial<LeadEntry>>({
    name: '',
    email: '',
    phone: '',
    from_location: '',
    to_location: '',
    current_floor: '',
    destination_floor: '',
    current_size: '',
    destination_size: '',
    move_date: '',
    move_type: 'Residential Moving',
    message: '',
  });
  const [quoteDraft, setQuoteDraft] = useState<QuoteDraft | null>(null);
  const [showQuoteEditor, setShowQuoteEditor] = useState(false);
  const [quoteEditorStatus, setQuoteEditorStatus] = useState<string>('');
  const [lastLeadRefresh, setLastLeadRefresh] = useState<string>('');
  const [editingBlog, setEditingBlog] = useState<Partial<BlogPost> | null>(null);
  const [showBlogEditor, setShowBlogEditor] = useState(false);
  const [uploadingBlogImage, setUploadingBlogImage] = useState(false);
  const [blogImageCrop, setBlogImageCrop] = useState<PhotoToCrop | null>(null);

  useEffect(() => {
    const boot = async () => {
      const storedToken = window.localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setAuthState('logged-out');
        return;
      }

      try {
        await verifyToken(storedToken);
        setToken(storedToken);
        setAuthState('logged-in');
        await loadData(storedToken);
      } catch {
        window.localStorage.removeItem(TOKEN_KEY);
        setAuthState('logged-out');
      }
    };

    boot();
  }, []);

  const loadData = async (authToken: string) => {
    try {
      const [content, savedLeads] = await Promise.all([fetchSiteContent(), fetchLeads(authToken)]);
      // also fetch blogs from API to prefer DB-backed posts
      let blogs = content.blogPosts || [];
      try {
        const remoteBlogs = await fetchBlogs();
        if (Array.isArray(remoteBlogs) && remoteBlogs.length > 0) blogs = remoteBlogs;
      } catch (err) {
        // ignore remote blog fetch errors and fall back to content.blogPosts
      }

      setSiteContent({ ...defaultSiteContent, ...content, blogPosts: blogs });
      setLeads(savedLeads);
    } catch (error) {
      console.error('Failed to load admin data', error);
    }
  };

  const refreshLeads = async () => {
    if (!token) return;
    try {
      const savedLeads = await fetchLeads(token);
      setLeads(savedLeads);
      setLastLeadRefresh(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Failed to refresh leads', error);
    }
  };

  useEffect(() => {
    if (authState !== 'logged-in' || !token) return;

    const interval = setInterval(() => {
      fetchLeads(token)
        .then((savedLeads) => {
          setLeads(savedLeads);
          setLastLeadRefresh(new Date().toLocaleTimeString());
        })
        .catch((error) => console.error('Failed to refresh leads', error));
    }, 15000);

    return () => clearInterval(interval);
  }, [authState, token]);

  useEffect(() => {
    const handleFocus = () => {
      if (authState === 'logged-in' && token) {
        refreshLeads();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [authState, token]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError('');

    try {
      const response = await loginAdmin(loginUsername, loginPassword);
      window.localStorage.setItem(TOKEN_KEY, response.token);
      setToken(response.token);
      setAuthState('logged-in');
      await loadData(response.token);
    } catch (error: any) {
      setLoginError(error?.message || 'Unable to authenticate.');
    }
  };

  const handleFieldChange = (field: keyof SiteContent, value: string) => {
    setSiteContent((current) => ({ ...current, [field]: value }));
  };

  const prepareCrop = (file: File, target: CropTarget, index?: number) => {
    if (photoToCrop) {
      URL.revokeObjectURL(photoToCrop.previewUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    setPhotoToCrop({ file, previewUrl, target, index });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    prepareCrop(file, 'hero');
  };

  const handleWhyUsImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    prepareCrop(file, 'whyUs');
  };

  const handleServiceImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    prepareCrop(file, 'service', index);
  };

  const onCropComplete = (_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const resetCrop = () => {
    if (photoToCrop) {
      URL.revokeObjectURL(photoToCrop.previewUrl);
    }
    setPhotoToCrop(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Unable to get canvas context');

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Canvas is empty'));
        resolve(blob);
      }, 'image/jpeg', 0.92);
    });
  };

  const uploadCroppedImage = async () => {
    if (!photoToCrop || !croppedAreaPixels) return;
    const { file, previewUrl, target, index } = photoToCrop;
    try {
      const croppedBlob = await getCroppedImg(previewUrl, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], file.name, { type: croppedBlob.type });

      if (target === 'hero') {
        setUploadingHero(true);
      } else if (target === 'whyUs') {
        setUploadingWhyUs(true);
      } else if (target === 'blog') {
        setUploadingBlogImage(true);
      } else {
        setUploadingService(index ?? 0);
      }

      const url = await uploadFile(croppedFile, token);
      let updatedContent;
      if (target === 'blog') {
        // set preview on editingBlog and locally in siteContent.blogPosts
        const updatedEditing = editingBlog ? { ...editingBlog, image: url } : null;
        setEditingBlog(updatedEditing as any);
        const previewBlogs = [...siteContent.blogPosts];
        const idx = previewBlogs.findIndex((b) => b.id === (editingBlog?.id));
        if (idx >= 0) previewBlogs[idx] = { ...previewBlogs[idx], image: url };
        updatedContent = { ...siteContent, blogPosts: previewBlogs };
      } else {
        updatedContent = target === 'hero'
          ? { ...siteContent, heroBgImage: url }
          : target === 'whyUs'
            ? { ...siteContent, whyUsImage: url }
            : (() => {
                const serviceImages = [...siteContent.serviceImages];
                if (typeof index === 'number') serviceImages[index] = url;
                return { ...siteContent, serviceImages };
              })();
      }

      setSiteContent(updatedContent);
      try {
        if (target !== 'blog') {
          await saveSiteContent(updatedContent, token);
          setSaveStatus('Image uploaded and saved successfully.');
        } else {
          setSaveStatus('Image uploaded. Save the blog to persist.');
        }
      } catch (saveError) {
        setSaveStatus('Image uploaded, but failed to save content.');
      }
    } catch (error) {
      setSaveStatus('Failed to upload cropped image.');
    } finally {
      if (photoToCrop) {
        URL.revokeObjectURL(photoToCrop.previewUrl);
      }
      setUploadingHero(false);
      setUploadingWhyUs(false);
      setUploadingService(null);
      setUploadingBlogImage(false);
      resetCrop();
    }
  };

  const saveChanges = async () => {
    try {
      await saveSiteContent(siteContent, token);
      setSavedAt(new Date().toLocaleString());
      setSaveStatus('Saved successfully.');
    } catch (error) {
      setSaveStatus('Failed to save changes.');
    }
  };

  const resetDefaults = async () => {
    setSiteContent(defaultSiteContent);
    try {
      await saveSiteContent(defaultSiteContent, token);
      setSavedAt(new Date().toLocaleString());
      setSaveStatus('Reset to defaults.');
    } catch {
      setSaveStatus('Failed to reset defaults.');
    }
  };

  const logout = () => {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setAuthState('logged-out');
    setLeads([]);
  };

  const parseAmountValue = (value: string) => {
    const normalized = value.replace(/[^0-9.-]/g, '');
    const numeric = parseFloat(normalized);
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const extractCurrencyPrefix = (value: string) => {
    const match = value.trim().match(/^([^0-9.-]+)/);
    return match ? match[1].trim() : 'KES';
  };

  const formatTotalPrice = (pricing: QuoteDraft['pricing']) => {
    const amountSum = pricing.reduce((sum, item) => sum + parseAmountValue(item.amount), 0);
    const prefix = pricing.find((item) => item.amount.trim())
      ? extractCurrencyPrefix(pricing.find((item) => item.amount.trim())!.amount)
      : 'KES';
    const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(amountSum);
    return `${prefix} ${formatted}`.trim();
  };

  const handleManualLeadChange = (field: keyof LeadEntry, value: string) => {
    setManualLeadForm((current) => ({ ...current, [field]: value }));
  };

  const openQuoteEditor = (lead: LeadEntry) => {
    const issueDate = new Date().toISOString().slice(0, 10);
    const defaultValidUntil = new Date();
    defaultValidUntil.setMonth(defaultValidUntil.getMonth() + 1);

    const defaultQuoteNumber = lead.quoteNumber || formatQuoteNumber(issueDate, lead.id);

    setQuoteDraft({
      id: lead.id,
      quoteNumber: defaultQuoteNumber,
      issueDate,
      validUntil: defaultValidUntil.toISOString().slice(0, 10),
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      from_location: lead.from_location,
      to_location: lead.to_location,
      current_floor: lead.current_floor || '',
      destination_floor: lead.destination_floor || '',
      current_size: lead.current_size || '',
      destination_size: lead.destination_size || '',
      move_date: lead.move_date || '',
      move_type: lead.move_type || 'Residential Moving',
      message: lead.message || '',
      inventory: [
        { description: 'Sofa Sets', quantity: '2' },
        { description: 'Beds & Mattresses', quantity: '3' },
      ],
      services: ['Loading & Offloading', 'Secure Transportation', 'Professional Packing'],
      pricing: [
        { description: 'Transportation Charges', amount: 'KES 15,000' },
        { description: 'Packing Services', amount: 'KES 5,000' },
      ],
      total_price: formatTotalPrice([
        { description: 'Transportation Charges', amount: 'KES 15,000' },
        { description: 'Packing Services', amount: 'KES 5,000' },
      ]),
      terms: siteContent.defaultTerms && siteContent.defaultTerms.length > 0 ? siteContent.defaultTerms : [
        'A 30% deposit is required to confirm the booking.',
        'This quotation remains valid for one month from the issue date.',
        'Delays caused by traffic, weather, or building access restrictions may affect timelines.',
        'Fragile or high-value items should be declared before moving day.',
        'Final payment is due immediately upon successful completion of the move.',
      ],
    });
    setQuoteEditorStatus('Draft loaded. You can edit and download the quote.');
    setShowQuoteEditor(true);
  };

  const updateQuoteDraftField = <K extends keyof QuoteDraft>(field: K, value: QuoteDraft[K]) => {
    setQuoteDraft((current) => (current ? { ...current, [field]: value } : current));
  };

  const updateInventoryRow = (index: number, field: 'description' | 'quantity', value: string) => {
    setQuoteDraft((current) => {
      if (!current) return current;
      const inventory = [...current.inventory];
      inventory[index] = { ...inventory[index], [field]: value };
      return { ...current, inventory };
    });
  };

  const addInventoryRow = () => {
    setQuoteDraft((current) => {
      if (!current) return current;
      return { ...current, inventory: [...current.inventory, { description: '', quantity: '' }] };
    });
  };

  const removeInventoryRow = (index: number) => {
    setQuoteDraft((current) => {
      if (!current) return current;
      const inventory = current.inventory.filter((_, i) => i !== index);
      return { ...current, inventory };
    });
  };

  const updatePricingRow = (index: number, field: 'description' | 'amount', value: string) => {
    setQuoteDraft((current) => {
      if (!current) return current;
      const pricing = [...current.pricing];
      pricing[index] = { ...pricing[index], [field]: value };
      const total_price = formatTotalPrice(pricing);
      return { ...current, pricing, total_price };
    });
  };

  const addPricingRow = () => {
    setQuoteDraft((current) => {
      if (!current) return current;
      const pricing = [...current.pricing, { description: '', amount: '' }];
      const total_price = formatTotalPrice(pricing);
      return { ...current, pricing, total_price };
    });
  };

  const removePricingRow = (index: number) => {
    setQuoteDraft((current) => {
      if (!current) return current;
      const pricing = current.pricing.filter((_, i) => i !== index);
      const total_price = formatTotalPrice(pricing);
      return { ...current, pricing, total_price };
    });
  };

  const updateTerm = (index: number, value: string) => {
    setQuoteDraft((current) => {
      if (!current) return current;
      const terms = [...current.terms];
      terms[index] = value;
      return { ...current, terms };
    });
  };

  const addTerm = () => {
    setQuoteDraft((current) => {
      if (!current) return current;
      return { ...current, terms: [...current.terms, ''] };
    });
  };

  const removeTerm = (index: number) => {
    setQuoteDraft((current) => {
      if (!current) return current;
      const terms = current.terms.filter((_, i) => i !== index);
      return { ...current, terms };
    });
  };

  const saveQuoteDraft = () => {
    setQuoteEditorStatus('Quote draft saved. You can download it now.');
    // Persist edited terms as site defaults so future quotes use them
    if (quoteDraft) {
      const updatedContent = { ...siteContent, defaultTerms: quoteDraft.terms };
      setSiteContent(updatedContent);
      (async () => {
        try {
          if (token) {
            await saveSiteContent(updatedContent, token);
            setSaveStatus('Quote defaults saved.');
            setSavedAt(new Date().toLocaleString());
          } else {
            setSaveStatus('Quote defaults updated locally (login to persist).');
          }
        } catch (err) {
          setSaveStatus('Failed to persist quote defaults.');
        }
      })();
    }
  };

  const downloadQuoteDraft = async () => {
    if (quoteDraft) {
      await generateQuoteTemplate(quoteDraft);
    }
  };

  const submitManualLead = async () => {
    if (!manualLeadForm.name || !manualLeadForm.email || !manualLeadForm.phone) {
      setSaveStatus('Please fill in name, email, and phone.');
      return;
    }

    try {
      const submissionDate = new Date().toISOString().slice(0, 10);
      const newLeadId = formatQuoteNumber(submissionDate, `${Date.now()}`);
      const newLead: LeadEntry = {
        id: newLeadId,
        date: new Date().toLocaleString(),
        name: manualLeadForm.name || '',
        email: manualLeadForm.email || '',
        phone: manualLeadForm.phone || '',
        from_location: manualLeadForm.from_location || '',
        to_location: manualLeadForm.to_location || '',
        current_floor: manualLeadForm.current_floor || '',
        destination_floor: manualLeadForm.destination_floor || '',
        current_size: manualLeadForm.current_size || '',
        destination_size: manualLeadForm.destination_size || '',
        move_date: manualLeadForm.move_date || '',
        move_type: manualLeadForm.move_type || 'Residential Moving',
        message: manualLeadForm.message || '',
        quoteNumber: newLeadId,
      };

      await createLead(newLead);
      setLeads((current) => [newLead, ...current]);
      setSaveStatus('Lead created successfully.');
      setManualLeadForm({
        name: '',
        email: '',
        phone: '',
        from_location: '',
        to_location: '',
        current_floor: '',
        destination_floor: '',
        current_size: '',
        destination_size: '',
        move_date: '',
        move_type: 'Residential Moving',
        message: '',
      });
      setShowManualLeadForm(false);
    } catch (error) {
      setSaveStatus('Failed to create lead.');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;

    try {
      await deleteLead(leadId, token);
      setLeads((current) => current.filter((lead) => lead.id !== leadId));
      setSaveStatus('Lead deleted successfully.');
    } catch (error) {
      setSaveStatus('Failed to delete lead.');
    }
  };

  const openBlogEditor = (blog?: any) => {
    if (blog) {
      setEditingBlog({ ...blog });
    } else {
      setEditingBlog({
        id: 'blog-' + Date.now(),
        title: '',
        excerpt: '',
        content: '',
        image: '',
        category: 'Moving Tips',
        slug: '',
      });
    }
    setShowBlogEditor(true);
  };

  const handleBlogBlogImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    prepareCrop(file, 'blog');
  };

  const saveBlog = async () => {
    if (!editingBlog?.title || !editingBlog?.excerpt) {
      setSaveStatus('Please fill in all blog fields.');
      return;
    }

    try {
      if (!token) throw new Error('Login required to save blog');

      if (String(editingBlog.id).startsWith('blog-')) {
        // create via API
        const created = await createBlog(editingBlog, token);
        setSaveStatus('Blog created successfully.');
      } else {
        await updateBlog(editingBlog.id as any, editingBlog, token);
        setSaveStatus('Blog updated successfully.');
      }

      // refresh blog list from backend
      const blogs = await fetchBlogs();
      setSiteContent((current) => ({ ...current, blogPosts: blogs }));
      setShowBlogEditor(false);
      setEditingBlog(null);
      setSavedAt(new Date().toLocaleString());
    } catch (error) {
      setSaveStatus('Failed to save blog.');
    }
  };

  const deleteBlog = async (blogId: string) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;

    try {
      if (token && !String(blogId).startsWith('blog-')) {
        await deleteBlogPost(blogId, token);
      }

      const blogs = await fetchBlogs();
      setSiteContent((current) => ({ ...current, blogPosts: blogs }));
      setSavedAt(new Date().toLocaleString());
      setSaveStatus('Blog deleted successfully.');
    } catch (error) {
      setSaveStatus('Failed to delete blog.');
    }
  };

const generateQuoteTemplate = async (lead: QuoteDraft) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  let y = margin;

  // ✅ Helper to format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const issueDate = lead.issueDate || new Date().toISOString().slice(0, 10);
  const defaultValidUntil = new Date();
  defaultValidUntil.setMonth(defaultValidUntil.getMonth() + 1);
  const validUntil = lead.validUntil || defaultValidUntil.toISOString().slice(0, 10);
  const quoteNumber = lead.quoteNumber || formatQuoteNumber(lead.id, issueDate);

  const wrapText = (text: string, maxWidth: number, size = 10, style: 'normal' | 'bold' = 'normal') => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    return doc.splitTextToSize(text, maxWidth);
  };

  const drawBox = (x: number, w: number, h: number, fillColor: [number, number, number], stroke = true) => {
    doc.setFillColor(...fillColor);
    if (stroke) {
      doc.setDrawColor(156, 163, 175);
      doc.roundedRect(x, y, w, h, 10, 10, 'FD');
    } else {
      doc.roundedRect(x, y, w, h, 10, 10, 'F');
    }
  };

  const ensureSpace = (height: number) => {
    if (y + height > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFillColor(51, 65, 85);
  doc.rect(0, 0, pageWidth, 140, 'F');
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text(siteContent.siteName || 'Boxed With Care Movers', margin, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(siteContent.siteTagline || 'Safe • Reliable • Affordable Moving Solutions', margin, 68);
  doc.setFontSize(9);
  doc.text(`Phone: ${siteContent.phone || '-'}`, margin, 88);
  doc.text(`Email: ${siteContent.email || '-'}`, margin, 100);
  doc.text(`Website: ${siteContent.website || '-'}`, margin, 112);

  const quoteBoxW = 208;
  const quoteBoxX = pageWidth - margin - quoteBoxW;
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(quoteBoxX, 26, quoteBoxW, 88, 12, 12, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('OFFICIAL QUOTE', quoteBoxX + 14, 46);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Quote #: ${quoteNumber}`, quoteBoxX + 14, 62);
  doc.text(`Issue: ${issueDate}`, quoteBoxX + 14, 74);
  doc.text(`Valid: ${validUntil}`, quoteBoxX + 14, 86);

  y = 158;
  const sectionWidth = pageWidth - margin * 2;
  const columnGap = 14;
  const columnWidth = (sectionWidth - columnGap) / 2;
  const leftColumnX = margin + 14;
  const rightColumnX = margin + 14 + columnWidth + columnGap;
  const rightTextX = pageWidth - margin - 12;
  const valueColumnX = leftColumnX + 140;

  ensureSpace(150);
  const summaryHeight = 120;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, sectionWidth, summaryHeight, 10, 10, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Client Details', leftColumnX, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Name:', leftColumnX, y + 42);
  doc.setFont('helvetica', 'bold');
  doc.text(lead.name || '-', valueColumnX, y + 42);

  doc.setFont('helvetica', 'normal');
  doc.text('Phone:', leftColumnX, y + 58);
  doc.setFont('helvetica', 'bold');
  doc.text(lead.phone || '-', valueColumnX, y + 58);

  doc.setFont('helvetica', 'normal');
  doc.text('Email:', leftColumnX, y + 74);
  doc.setFont('helvetica', 'bold');
  doc.text(lead.email || '-', valueColumnX, y + 74);

  doc.setFont('helvetica', 'normal');
  doc.text('Move Type:', leftColumnX, y + 90);
  doc.setFont('helvetica', 'bold');
  doc.text(lead.move_type || '-', valueColumnX, y + 90);

  y += summaryHeight + 20;

  const moveDetailsTop = y;
  doc.setFillColor(226, 232, 240);

  const inventoryLinesCount = lead.inventory?.reduce((count, item) => count + wrapText(`• ${item.description || '-'} (${item.quantity || '-'})`, columnWidth - 12, 10).length, 0) || 1;
  const serviceLinesCount = lead.services?.reduce((count, service) => count + wrapText(`• ${service}`, columnWidth - 12, 10).length, 0) || 1;
  const rightContentRows = inventoryLinesCount + serviceLinesCount + 1;
  const contentRows = Math.max(rightContentRows, 5);
  const moveSectionHeight = 28 + contentRows * 14 + 70;
  ensureSpace(moveSectionHeight + 20);
  doc.roundedRect(margin, moveDetailsTop, sectionWidth, moveSectionHeight, 10, 10, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Move Details', leftColumnX, moveDetailsTop + 20);
  doc.text('Inventory', rightColumnX, moveDetailsTop + 20);

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.75);
  const separatorX = leftColumnX + columnWidth + columnGap / 2;
  doc.line(separatorX, moveDetailsTop + 12, separatorX, moveDetailsTop + moveSectionHeight - 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Pickup:', leftColumnX, moveDetailsTop + 42);
  doc.setFont('helvetica', 'bold');
  doc.text(lead.from_location || '-', valueColumnX, moveDetailsTop + 42);

  doc.setFont('helvetica', 'normal');
  doc.text('Destination:', leftColumnX, moveDetailsTop + 58);
  doc.setFont('helvetica', 'bold');
  doc.text(lead.to_location || '-', valueColumnX, moveDetailsTop + 58);

  doc.setFont('helvetica', 'normal');
  doc.text('Date:', leftColumnX, moveDetailsTop + 74);
  doc.setFont('helvetica', 'bold');
  // ✅ Format the move date
  doc.text(formatDate(lead.move_date), valueColumnX, moveDetailsTop + 74);

  doc.setFont('helvetica', 'normal');
  doc.text('Current house size:', leftColumnX, moveDetailsTop + 90);
  doc.setFont('helvetica', 'bold');
  doc.text(lead.current_size || '-', valueColumnX, moveDetailsTop + 90);

  doc.setFont('helvetica', 'normal');
  doc.text('Destination house size:', leftColumnX, moveDetailsTop + 106);
  doc.setFont('helvetica', 'bold');
  doc.text(lead.destination_size || '-', valueColumnX, moveDetailsTop + 106);


    const inventoryStartY = moveDetailsTop + 42;
    let inventoryY = inventoryStartY;
    doc.setFont('helvetica', 'normal');
    if (lead.inventory?.length) {
      lead.inventory.forEach((item) => {
        const inventoryLines = wrapText(`• ${item.description || '-'} (${item.quantity || '-'})`, columnWidth - 12, 10);
        inventoryLines.forEach((line: string) => {
          doc.text(line, rightColumnX, inventoryY);
          inventoryY += 14;
        });
      });
    } else {
      doc.text('• No inventory items provided.', rightColumnX, inventoryY);
      inventoryY += 14;
    }

    const servicesTitleY = inventoryY + 12;
    doc.setFont('helvetica', 'bold');
    doc.text('Services', rightColumnX, servicesTitleY);
    const servicesStartY = servicesTitleY + 14;
    let servicesY = servicesStartY;
    doc.setFont('helvetica', 'normal');
    if (lead.services?.length) {
      lead.services.forEach((service) => {
        const lines = wrapText(`• ${service}`, columnWidth - 12, 10);
        lines.forEach((line: string) => {
          doc.text(line, rightColumnX, servicesY);
          servicesY += 14;
        });
      });
    } else {
      doc.text('• Full-service moving included.', rightColumnX, servicesY);
      servicesY += 14;
    }

    y += moveSectionHeight + 20;
    const pricingTableRows = Math.max(lead.pricing?.length || 0, 4);
    const pricingTableHeight = 28 + pricingTableRows * 16 + 36;
    ensureSpace(pricingTableHeight + 30);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, sectionWidth, pricingTableHeight, 10, 10, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Pricing Summary', leftColumnX, y + 20);

    const tableHeaderY = y + 36;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Description', leftColumnX, tableHeaderY);
    doc.text('Amount', rightTextX, tableHeaderY, { align: 'right' });

    doc.setDrawColor(156, 163, 175);
    doc.setLineWidth(0.5);
    doc.line(leftColumnX, tableHeaderY + 4, pageWidth - margin - 12, tableHeaderY + 4);

    let pricingY = tableHeaderY + 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    if (lead.pricing?.length) {
      lead.pricing.forEach((item) => {
        doc.text(item.description || '-', leftColumnX, pricingY);
        doc.text(item.amount || '-', rightTextX, pricingY, { align: 'right' });
        pricingY += 16;
      });
    } else {
      doc.text('No pricing details provided.', leftColumnX, pricingY);
      pricingY += 16;
    }

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.75);
    doc.line(leftColumnX, pricingY + 4, pageWidth - margin - 12, pricingY + 4);
    pricingY += 18;
    const totalPrice = formatTotalPrice(lead.pricing);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Estimate', leftColumnX, pricingY);
    doc.text(totalPrice, rightTextX, pricingY, { align: 'right' });

    y += pricingTableHeight + 20;
    ensureSpace(120);
    drawBox(margin, pageWidth - margin * 2, 100, [226, 232, 240]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Terms & Approval', margin + 14, y + 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    let termY = y + 34;
    if (lead.terms?.length) {
      lead.terms.forEach((term) => {
        const lines = wrapText(term, pageWidth - margin * 2 - 24, 10);
        lines.forEach((line: string) => {
          ensureSpace(20);
          doc.text(`• ${line}`, margin + 14, termY);
          termY += 13;
        });
      });
    } else {
      ensureSpace(20);
      doc.text('• Quote valid for one month from issue date.', margin + 14, termY);
      termY += 13;
    }
    termY += 18;
    if (termY > pageHeight - margin) {
      doc.addPage();
      termY = margin + 18;
    }
    doc.setDrawColor(148, 163, 184);
    doc.line(margin + 14, termY, pageWidth / 2 - 10, termY);
    doc.line(pageWidth / 2 + 10, termY, pageWidth - margin - 14, termY);
    doc.setFont('helvetica', 'bold');
    doc.text('Authorized Signature', margin + 14, termY + 16);
    doc.text('Customer Signature', pageWidth / 2 + 10, termY + 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Signature accepted on this quote.', margin + 14, termY + 32);

    // Footer: confirmation reminder on the final page
    const lastPage = doc.getNumberOfPages();
    if (lastPage > 0) doc.setPage(lastPage);
    doc.setFontSize(9);
    doc.setTextColor(100);
    const footerText = 'Please confirm the moving date atleast 48 hours prior to the desired moving date to allow for appropriate preparation and scheduling.';
    const footerX = margin + 14;
    const footerY = pageHeight - margin + 6;
    doc.text(footerText, footerX, footerY);

    const quoteFileName = sanitizeFileName(quoteNumber);
    doc.save(`${quoteFileName}.pdf`);
  };

  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-700">Loading admin panel…</div>
    );
  }

  if (authState === 'logged-out') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-gray-200">
          <p className="text-sm text-gray-500 uppercase tracking-[0.3em]">Admin Login</p>
          <h1 className="text-3xl font-extrabold mt-4 mb-2">Sign in to manage the site</h1>
          <p className="mb-6 text-gray-600">Enter your admin credentials to edit content and view leads.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Username</span>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-gray-200 p-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Password</span>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-gray-200 p-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
                required
              />
            </label>
            {loginError && <p className="text-sm text-red-600">{loginError}</p>}
            <button
              type="submit"
              className="w-full px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 text-gray-900">
      <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-10 py-10">
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-[0.3em]">Admin Panel</p>
            <h1 className="text-4xl font-extrabold mt-4">Site Editor & Lead Manager</h1>
            <p className="mt-2 text-gray-600 max-w-none">
              Choose a section from the menu, then update content, photos, or leads.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={saveChanges}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={resetDefaults}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Reset Defaults
            </button>
            <button
              onClick={logout}
              className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-10">
          <aside className="space-y-6 lg:sticky lg:top-8">
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
              <div className="mb-6">
                <p className="text-sm text-gray-500 uppercase tracking-[0.3em]">Admin Menu</p>
                <h2 className="text-3xl font-extrabold mt-4">Sections</h2>
                <p className="mt-2 text-gray-600 text-sm">Switch between content, service images, contact details, and leads.</p>
              </div>
              <div className="space-y-3">
                {(Object.keys(SECTION_META) as AdminSection[]).map((sectionKey) => (
                  <button
                    key={sectionKey}
                    onClick={() => setActiveSection(sectionKey)}
                    className={`w-full text-left rounded-2xl px-5 py-4 transition-colors ${
                      activeSection === sectionKey
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="block text-sm font-semibold">{SECTION_META[sectionKey].title}</span>
                    <span className="block text-xs mt-1 text-gray-500">{SECTION_META[sectionKey].description}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold mb-4">Quick Preview</h2>
              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">Site name:</span> {siteContent.siteName}
                </p>
                <p>
                  <span className="font-semibold">Tagline:</span> {siteContent.siteTagline}
                </p>
                <p>
                  <span className="font-semibold">Phone:</span> {siteContent.phone}
                </p>
                <p>
                  <span className="font-semibold">Email:</span> {siteContent.email}
                </p>
                <p>
                  <span className="font-semibold">Website:</span> {siteContent.website}
                </p>
                <p>
                  <span className="font-semibold">Last saved:</span> {savedAt || 'Not saved yet'}
                </p>
                {saveStatus && <p className="text-sm text-amber-600">{saveStatus}</p>}
              </div>
            </section>
          </aside>

          <main className="space-y-8">
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-[0.3em]">Admin Section</p>
                  <h2 className="text-3xl font-bold">{SECTION_META[activeSection].title}</h2>
                  <p className="mt-2 text-gray-600 text-sm">{SECTION_META[activeSection].description}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                    {activeSection === 'hero' && 'Content Editor'}
                    {activeSection === 'whyUs' && 'Why Us Image'}
                    {activeSection === 'services' && 'Service Images'}
                    {activeSection === 'contacts' && 'Contacts & Footer'}
                    {activeSection === 'blogs' && 'Blog Management'}
                    {activeSection === 'leads' && 'Lead Review'}
                  </span>
                </div>
              </div>

              {activeSection === 'hero' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-700">Headline</span>
                      <textarea
                        rows={3}
                        value={siteContent.heroHeadline}
                        onChange={(e) => handleFieldChange('heroHeadline', e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-gray-200 p-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
                      />
                    </label>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <label className="block">
                        <span className="text-sm font-semibold text-gray-700">Highlight Text</span>
                        <input
                          type="text"
                          value={siteContent.heroHighlight}
                          onChange={(e) => handleFieldChange('heroHighlight', e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-gray-200 p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold text-gray-700">CTA Button</span>
                        <input
                          type="text"
                          value={siteContent.heroCTA}
                          onChange={(e) => handleFieldChange('heroCTA', e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-gray-200 p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="text-sm font-semibold text-gray-700">Subtext</span>
                      <textarea
                        rows={4}
                        value={siteContent.heroSubtext}
                        onChange={(e) => handleFieldChange('heroSubtext', e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-gray-200 p-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
                      />
                    </label>
                  </div>

                  <div className="space-y-4">
                    <span className="text-sm font-semibold text-gray-700">Background Image & Preview</span>
                    <div className="w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-4">
                      {siteContent.heroBgImage ? (
                        <div className="relative w-full h-48 rounded-xl overflow-hidden mb-3">
                          <img src={siteContent.heroBgImage} alt="Hero background" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-48 text-gray-400">No image set</div>
                      )}

                      <label className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-dashed border-amber-300 bg-white cursor-pointer hover:bg-amber-50 transition-colors">
                        <Upload className="w-5 h-5 text-amber-600" />
                        <span className="text-sm font-semibold text-amber-700">{uploadingHero ? 'Uploading...' : 'Upload Image'}</span>
                        <input type="file" accept="image/*" onChange={handleHeroImageUpload} disabled={uploadingHero} className="hidden" />
                      </label>

                      <div className="mt-3 text-xs text-gray-500">Preview will update after upload. Use a wide image for best results.</div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'whyUs' && (
                <div className="grid gap-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700">Why Us Section Image</span>
                    <div className="mt-2 flex flex-col gap-3">
                      {siteContent.whyUsImage && (
                        <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-gray-200">
                          <img
                            src={siteContent.whyUsImage}
                            alt="Why Us section"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors">
                        <Upload className="w-5 h-5 text-amber-600" />
                        <span className="text-sm font-semibold text-amber-700">
                          {uploadingWhyUs ? 'Uploading...' : 'Upload Image'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleWhyUsImageUpload}
                          disabled={uploadingWhyUs}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </label>
                </div>
              )}

              {activeSection === 'services' && (
                <div className="grid gap-6">
                  {siteContent.serviceImages.map((image, index) => (
                    <div key={index} className="pb-6 border-b border-gray-200 last:pb-0 last:border-0">
                      <p className="text-sm font-semibold text-gray-700 mb-3">{SERVICE_NAMES[index]}</p>
                      <div className="flex flex-col gap-3">
                        {image && (
                          <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-gray-200">
                            <img
                              src={image}
                              alt={`Service ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors">
                          <Upload className="w-5 h-5 text-amber-600" />
                          <span className="text-sm font-semibold text-amber-700">
                            {uploadingService === index ? 'Uploading...' : 'Upload Image'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleServiceImageUpload(index, e)}
                            disabled={uploadingService === index}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'contacts' && (
                <div className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-700">Phone Number</span>
                      <input
                        type="text"
                        value={siteContent.phone}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-gray-200 p-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-700">Email Address</span>
                      <input
                        type="email"
                        value={siteContent.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-gray-200 p-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-700">Website</span>
                      <input
                        type="text"
                        value={siteContent.website}
                        onChange={(e) => handleFieldChange('website', e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-gray-200 p-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700">Footer Text</span>
                    <textarea
                      rows={3}
                      value={siteContent.footerText}
                      onChange={(e) => handleFieldChange('footerText', e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-gray-200 p-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                  </label>
                </div>
              )}

              {activeSection === 'leads' && (
                <div className="space-y-4">
                  <button
                    onClick={() => setShowManualLeadForm(!showManualLeadForm)}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-2xl transition-colors"
                  >
                    {showManualLeadForm ? 'Cancel' : '+ Add Lead Manually'}
                  </button>

                  {showManualLeadForm && (
                    <div className="rounded-3xl bg-white border border-gray-200 p-6 shadow-sm">
                      <h3 className="text-lg font-bold mb-4">Create New Lead</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <input
                          type="text"
                          placeholder="Name"
                          value={manualLeadForm.name || ''}
                          onChange={(e) => handleManualLeadChange('name', e.target.value)}
                          className="rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={manualLeadForm.email || ''}
                          onChange={(e) => handleManualLeadChange('email', e.target.value)}
                          className="rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                        />
                        <input
                          type="tel"
                          placeholder="Phone"
                          value={manualLeadForm.phone || ''}
                          onChange={(e) => handleManualLeadChange('phone', e.target.value)}
                          className="rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                        />
                        <input
                          type="text"
                          placeholder="From Location"
                          value={manualLeadForm.from_location || ''}
                          onChange={(e) => handleManualLeadChange('from_location', e.target.value)}
                          className="rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                        />
                        <input
                          type="text"
                          placeholder="To Location"
                          value={manualLeadForm.to_location || ''}
                          onChange={(e) => handleManualLeadChange('to_location', e.target.value)}
                          className="rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                        />
                        <input
                          type="text"
                          placeholder="Current Floor"
                          value={manualLeadForm.current_floor || ''}
                          onChange={(e) => handleManualLeadChange('current_floor', e.target.value)}
                          className="rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                        />
                        <input
                          type="text"
                          placeholder="Destination Floor"
                          value={manualLeadForm.destination_floor || ''}
                          onChange={(e) => handleManualLeadChange('destination_floor', e.target.value)}
                          className="rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                        />
                        <input
                          type="text"
                          placeholder="Current Property Size"
                          value={manualLeadForm.current_size || ''}
                          onChange={(e) => handleManualLeadChange('current_size', e.target.value)}
                          className="rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                        />
                        <input
                          type="text"
                          placeholder="Destination Property Size"
                          value={manualLeadForm.destination_size || ''}
                          onChange={(e) => handleManualLeadChange('destination_size', e.target.value)}
                          className="rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                        />
                        <input
                          type="date"
                          value={manualLeadForm.move_date || ''}
                          onChange={(e) => handleManualLeadChange('move_date', e.target.value)}
                          className="rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                        />
                        <select
                          value={manualLeadForm.move_type || 'Residential Moving'}
                          onChange={(e) => handleManualLeadChange('move_type', e.target.value)}
                          className="rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                        >
                          <option>Residential Moving</option>
                          <option>Office & Commercial</option>
                          <option>Professional Packing</option>
                          <option>Long-Distance Moving</option>
                          <option>Storage Solutions</option>
                        </select>
                      </div>
                      <textarea
                        placeholder="Additional Notes"
                        rows={3}
                        value={manualLeadForm.message || ''}
                        onChange={(e) => handleManualLeadChange('message', e.target.value)}
                        className="mt-4 w-full rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                      />
                      <button
                        onClick={submitManualLead}
                        className="mt-4 w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-2xl transition-colors"
                      >
                        Save Lead
                      </button>
                    </div>
                  )}

                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-500">
                      Leads refresh automatically every 15 seconds.
                      {lastLeadRefresh ? ` Last updated ${lastLeadRefresh}.` : ''}
                    </p>
                    <button
                      onClick={refreshLeads}
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Refresh Leads
                    </button>
                  </div>

                  {leads.length === 0 ? (
                    <p className="text-gray-500">No leads have been submitted yet.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-sm">
                      <table className="min-w-full border-separate border border-gray-200 rounded-3xl" style={{ borderSpacing: 0 }}>
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Name</th>
                            <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Contact</th>
                            <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">House Size</th>
                            <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Date</th>
                            <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Move Type</th>
                            <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Route</th>
                            <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Floors</th>
                            <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {leads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-gray-50">
                              <td className="border-b border-gray-200 px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                <div>{lead.name}</div>
                                <div className="text-xs text-gray-500">ID: {lead.id}</div>
                              </td>
                              <td className="border-b border-gray-200 px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                <div>{lead.phone}</div>
                                <div className="text-xs text-gray-500">{lead.email}</div>
                              </td>
                              <td className="border-b border-gray-200 px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                <div>{lead.current_size || '–'}</div>
                                <div className="text-xs text-gray-500">to {lead.destination_size || '–'}</div>
                              </td>
                              <td className="border-b border-gray-200 px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                {lead.date}
                              </td>
                              <td className="border-b border-gray-200 px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                {lead.move_type}
                              </td>
                              <td className="border-b border-gray-200 px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                <div>{lead.from_location}</div>
                                <div className="text-xs text-gray-500">→ {lead.to_location}</div>
                              </td>
                              <td className="border-b border-gray-200 px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                <div>{lead.current_floor || 'N/A'} → {lead.destination_floor || 'N/A'}</div>
                              </td>
                              <td className="border-b border-gray-200 px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => openQuoteEditor(lead)}
                                    className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors"
                                  >
                                    Quote
                                  </button>
                                  <button
                                    onClick={() => handleDeleteLead(lead.id)}
                                    className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                                  >
                                    <X className="w-4 h-4" />
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'blogs' && (
                <div className="space-y-4">
                  <button
                    onClick={() => openBlogEditor()}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-2xl transition-colors"
                  >
                    + Create New Blog Post
                  </button>

                  {siteContent.blogPosts.length === 0 ? (
                    <p className="text-gray-500">No blog posts yet. Create your first one!</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {siteContent.blogPosts.map((blog) => (
                        <div key={blog.id} className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
                          {blog.image && (
                            <img
                              src={blog.image}
                              alt={blog.title}
                              className="w-full h-40 object-cover rounded-2xl mb-3"
                            />
                          )}
                          <h3 className="font-bold text-gray-900">{blog.title}</h3>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{blog.excerpt}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <span className="inline-block bg-amber-100 text-amber-800 px-2 py-1 rounded-lg text-xs font-medium">
                              {blog.category}
                            </span>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => openBlogEditor(blog)}
                              className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteBlog(blog.id)}
                              className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                              <X className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>

      {showQuoteEditor && quoteDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div className="w-full max-w-5xl overflow-y-auto max-h-[90vh] rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
            <div className="space-y-6 p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">Quote Editor</p>
                  <h2 className="mt-2 text-3xl font-bold text-gray-900">Edit quote before download</h2>
                  {quoteEditorStatus && <p className="mt-2 text-sm text-green-600">{quoteEditorStatus}</p>}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={saveQuoteDraft}
                    className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={downloadQuoteDraft}
                    className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-600"
                  >
                    Download PDF
                  </button>
                  <button
                    onClick={() => setShowQuoteEditor(false)}
                    className="rounded-2xl bg-gray-100 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Quote Number</span>
                  <input
                    type="text"
                    value={quoteDraft.quoteNumber}
                    onChange={(e) => updateQuoteDraftField('quoteNumber', e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Issue Date</span>
                  <input
                    type="date"
                    value={quoteDraft.issueDate}
                    onChange={(e) => updateQuoteDraftField('issueDate', e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Valid Until</span>
                  <input
                    type="date"
                    value={quoteDraft.validUntil}
                    onChange={(e) => updateQuoteDraftField('validUntil', e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Customer Name</span>
                  <input
                    type="text"
                    value={quoteDraft.name}
                    onChange={(e) => updateQuoteDraftField('name', e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Phone</span>
                  <input
                    type="text"
                    value={quoteDraft.phone}
                    onChange={(e) => updateQuoteDraftField('phone', e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Email</span>
                  <input
                    type="email"
                    value={quoteDraft.email}
                    onChange={(e) => updateQuoteDraftField('email', e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Move Type</span>
                  <input
                    type="text"
                    value={quoteDraft.move_type}
                    onChange={(e) => updateQuoteDraftField('move_type', e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Pickup Address</span>
                  <input
                    type="text"
                    value={quoteDraft.from_location}
                    onChange={(e) => updateQuoteDraftField('from_location', e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Destination Address</span>
                  <input
                    type="text"
                    value={quoteDraft.to_location}
                    onChange={(e) => updateQuoteDraftField('to_location', e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Additional Notes</span>
                <textarea
                  value={quoteDraft.message}
                  onChange={(e) => updateQuoteDraftField('message', e.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </label>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold text-gray-900">Inventory List</p>
                  <button
                    type="button"
                    onClick={addInventoryRow}
                    className="rounded-2xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                  >
                    Add Item
                  </button>
                </div>
                <div className="overflow-hidden rounded-3xl border border-gray-200">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3">Qty</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteDraft.inventory.map((item, index) => (
                        <tr key={index} className="border-t border-gray-100">
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateInventoryRow(index, 'description', e.target.value)}
                              className="w-full rounded-2xl border border-gray-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={item.quantity}
                              onChange={(e) => updateInventoryRow(index, 'quantity', e.target.value)}
                              className="w-full rounded-2xl border border-gray-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => removeInventoryRow(index)}
                              className="rounded-2xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold text-gray-900">Pricing Breakdown</p>
                  <button
                    type="button"
                    onClick={addPricingRow}
                    className="rounded-2xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                  >
                    Add Price Line
                  </button>
                </div>
                <div className="overflow-hidden rounded-3xl border border-gray-200">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Service</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteDraft.pricing.map((line, index) => (
                        <tr key={index} className="border-t border-gray-100">
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={line.description}
                              onChange={(e) => updatePricingRow(index, 'description', e.target.value)}
                              className="w-full rounded-2xl border border-gray-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={line.amount}
                              onChange={(e) => updatePricingRow(index, 'amount', e.target.value)}
                              className="w-full rounded-2xl border border-gray-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => removePricingRow(index)}
                              className="rounded-2xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Total Price</span>
                  <input
                    type="text"
                    value={quoteDraft.total_price}
                    readOnly
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-100 p-3 text-sm text-gray-700 focus:outline-none"
                  />
                  <p className="mt-2 text-xs text-gray-500">Automatically calculated from the pricing breakdown.</p>
                </label>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold text-gray-900">Terms & Conditions</p>
                  <button
                    type="button"
                    onClick={addTerm}
                    className="rounded-2xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                  >
                    Add Term
                  </button>
                </div>
                <div className="space-y-3">
                  {quoteDraft.terms.map((term, index) => (
                    <div key={index} className="flex gap-3">
                      <textarea
                        value={term}
                        onChange={(e) => updateTerm(index, e.target.value)}
                        rows={2}
                        className="min-h-[62px] w-full rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeTerm(index)}
                        className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBlogEditor && editingBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div className="w-full max-w-2xl overflow-y-auto max-h-[90vh] rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
            <div className="space-y-6 p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">Blog Editor</p>
                  <h2 className="mt-2 text-3xl font-bold text-gray-900">
                    {editingBlog.id?.startsWith('blog-') ? 'Create New' : 'Edit'} Blog Post
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowBlogEditor(false);
                    setEditingBlog(null);
                  }}
                  className="rounded-2xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Title</span>
                  <input
                    type="text"
                    value={editingBlog.title || ''}
                    onChange={(e) => setEditingBlog({ ...editingBlog, title: e.target.value, slug: editingBlog.slug || slugifyBlogTitle(e.target.value) })}
                    className="mt-2 w-full rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    placeholder="Blog post title"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Excerpt</span>
                  <textarea
                    rows={3}
                    value={editingBlog.excerpt || ''}
                    onChange={(e) => setEditingBlog({ ...editingBlog, excerpt: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    placeholder="Brief description of the blog post"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Full Content</span>
                  <textarea
                    rows={8}
                    value={editingBlog.content || ''}
                    onChange={(e) => setEditingBlog({ ...editingBlog, content: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    placeholder="Full article content shown on the blog details page"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Slug</span>
                  <input
                    type="text"
                    value={editingBlog.slug || ''}
                    onChange={(e) => setEditingBlog({ ...editingBlog, slug: e.target.value.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-') })}
                    className="mt-2 w-full rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    placeholder="unique-post-slug"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Category</span>
                  <select
                    value={editingBlog.category || 'Moving Tips'}
                    onChange={(e) => setEditingBlog({ ...editingBlog, category: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  >
                    <option>Moving Tips</option>
                    <option>Packing</option>
                    <option>Planning</option>
                    <option>Moving Guide</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Featured Image</span>
                  <div className="mt-2 flex flex-col gap-3">
                    {editingBlog.image && (
                      <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-gray-200">
                        <img
                          src={editingBlog.image}
                          alt="Blog preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors">
                      <Upload className="w-5 h-5 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-700">
                        {uploadingBlogImage ? 'Uploading...' : 'Upload Image'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBlogBlogImageUpload}
                        disabled={uploadingBlogImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                </label>

                <div className="flex gap-3">
                  <button
                    onClick={saveBlog}
                    className="flex-1 rounded-2xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
                  >
                    Save Blog Post
                  </button>
                  <button
                    onClick={() => {
                      setShowBlogEditor(false);
                      setEditingBlog(null);
                    }}
                    className="flex-1 rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {photoToCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Crop Image</h2>
                <p className="text-sm text-gray-500">Preview and crop the photo before upload.</p>
              </div>
              <button
                onClick={resetCrop}
                className="rounded-2xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
            <div className="grid gap-6 p-6 lg:grid-cols-[2fr_1fr]">
              <div className="relative h-96 w-full overflow-hidden rounded-3xl bg-black">
                <Cropper
                  image={photoToCrop.previewUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={16 / 9}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  showGrid={true}
                />
              </div>
              <div className="space-y-6">
                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-700">Crop settings</p>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Zoom</label>
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.01}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="mt-2 w-full"
                      />
                    </div>
                    <div className="rounded-2xl bg-white p-4 text-sm text-gray-700">
                      <p className="font-semibold">Target</p>
                      <p>
                        {photoToCrop.target === 'hero'
                          ? 'Hero section image'
                          : photoToCrop.target === 'whyUs'
                          ? 'Why Us section image'
                          : `Service ${photoToCrop.index! + 1} image`}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={uploadCroppedImage}
                    className="w-full rounded-2xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-600"
                  >
                    Upload Cropped Image
                  </button>
                  <button
                    type="button"
                    onClick={resetCrop}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
