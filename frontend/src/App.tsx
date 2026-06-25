import { useState, useEffect, lazy, Suspense } from 'react';
import Header from './components/layout/Header';
import Hero from './components/sections/Hero';
import Services from './components/sections/Services';
import WhyUs from './components/sections/WhyUs';
import HowItWorks from './components/sections/HowItWorks';
import Testimonials from './components/sections/Testimonials';
import Blog from './components/sections/Blog';
import BlogDetails from './components/sections/BlogDetails';
import QuoteForm from './components/sections/QuoteForm';
import Footer from './components/layout/Footer';
import { defaultSiteContent } from './lib/siteContent';
import { fetchSiteContent } from './lib/api';
import { slugifyBlogTitle } from './lib/blogUtils';

// Lazy load Admin
const Admin = lazy(() => import('./pages/Admin'));

// AOS & Helmet imports
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Helmet } from 'react-helmet-async';

function App() {
  const [scrolled, setScrolled] = useState(false);
  const [content, setContent] = useState(defaultSiteContent);
  const [loading, setLoading] = useState(true);

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isAdmin = currentPath.startsWith('/admin');
  const isBlogDetailsRoute = currentPath.startsWith('/blog/');
  const blogSlug = isBlogDetailsRoute
    ? decodeURIComponent(currentPath.split('/').filter(Boolean)[1] || '')
    : '';

  // Cookie helpers
  const getCookie = (name: string) =>
    document.cookie.split('; ').find((cookie) => cookie.startsWith(`${name}=`))?.split('=')[1] || '';

  const setCookie = (name: string, value: string, days: number) => {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
  };

  const generateVisitorId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  };

  // Load content & set visitor cookies
  useEffect(() => {
    if (typeof window === 'undefined' || isAdmin) {
      setLoading(false);
      return;
    }

    const visitorId = getCookie('visitor_id') || generateVisitorId();
    setCookie('visitor_id', visitorId, 365);
    setCookie('visitor_session_start', `${Date.now()}`, 1);

    const loadContent = async () => {
      try {
        const data = await fetchSiteContent();
        setContent({ ...defaultSiteContent, ...data });
      } catch (error) {
        console.warn('Using default content (API failed)');
        setContent(defaultSiteContent);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [isAdmin]);

  // Scroll effect for header
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // AOS initialization
  useEffect(() => {
    if (!isAdmin) {
      AOS.init({
        duration: 800,
        once: true,
        easing: 'ease-out-cubic',
      });
    }
  }, [isAdmin, content]);

  // Blog data
  const blogPosts = content.blogPosts.length ? content.blogPosts : defaultSiteContent.blogPosts;
  const activeBlogPost = blogSlug
    ? blogPosts.find((post) => (post.slug || slugifyBlogTitle(post.title)) === blogSlug)
    : null;

  // Admin route (lazy loaded)
  if (isAdmin) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent" />
          </div>
        }
      >
        <Admin />
      </Suspense>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-600">Loading site content…</p>
        </div>
      </div>
    );
  }

  // Blog detail page
  if (isBlogDetailsRoute) {
    if (activeBlogPost) {
      return <BlogDetails content={content} post={activeBlogPost} posts={blogPosts} />;
    }

    return (
      <div className="min-h-screen bg-[#f7f1e8] px-4 py-20 text-gray-900">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-[0_24px_70px_rgba(107,81,50,0.12)] backdrop-blur-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-700">Article not found</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.04em]">This blog post does not exist.</h1>
          <p className="mt-4 text-lg leading-8 text-gray-600">The link may be outdated, or the post may have been removed.</p>
          <a href="/#blog" className="mt-8 inline-flex rounded-full bg-[#171311] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5">
            Back to blog
          </a>
        </div>
      </div>
    );
  }

  // Main app rendering
  return (
    <>
      <Helmet>
        <title>{content.siteName} – Professional Moving Services</title>
        <meta name="description" content={content.heroSubtext} />
        <meta name="keywords" content="moving, packing, relocation, Nairobi, Kenya" />
        <link rel="canonical" href="https://boxedwithcare.co.ke" />
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* ✅ UPDATED: Header with individual props */}
        <Header
          scrolled={scrolled}
          siteName={content.siteName}
          siteTagline={content.siteTagline}
          phone={content.phone}
          logoUrl={content.logoUrl}
        />

        <Hero content={content} />
        <Services content={content} />
        <WhyUs content={content} />
        <HowItWorks phone={content.phone} />
        <Testimonials />
        <Blog content={content} />
        <QuoteForm content={content} />

        {/* ✅ UPDATED: Footer with individual props */}
        <Footer
          siteName={content.siteName}
          siteTagline={content.siteTagline}
          phone={content.phone}
          email={content.email}
          footerText={content.footerText}
          logoUrl={content.logoUrl}
        />
      </div>

      {/* Floating WhatsApp Button */}
      <WhatsAppButton phone={content.phone} />
    </>
  );
}

// WhatsApp Button component
function WhatsAppButton({ phone }: { phone?: string }) {
  const whatsappNumber = phone?.replace(/\D/g, '') || '254748851679';
  const message = 'Hi%20I%20need%20a%20moving%20quote';
  const href = `https://wa.me/${whatsappNumber}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-all hover:scale-110"
      aria-label="Chat on WhatsApp"
    >
      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
    </a>
  );
}

export default App;