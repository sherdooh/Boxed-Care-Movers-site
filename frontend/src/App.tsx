import { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Hero from './components/sections/Hero';
import Services from './components/sections/Services';
import WhyUs from './components/sections/WhyUs';
import HowItWorks from './components/sections/HowItWorks';
import Testimonials from './components/sections/Testimonials';
import Blog from './components/sections/Blog';
import QuoteForm from './components/sections/QuoteForm';
import Footer from './components/layout/Footer';
import Admin from './pages/Admin';
import { defaultSiteContent } from './lib/siteContent';
import { fetchSiteContent } from './lib/api';

function App() {
  const [scrolled, setScrolled] = useState(false);
  const [content, setContent] = useState(defaultSiteContent);

  const isAdmin =
    typeof window !== 'undefined' &&
    window.location.pathname.startsWith('/admin');

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

  useEffect(() => {
    if (typeof window === 'undefined' || isAdmin) return;

    const visitorId = getCookie('visitor_id') || generateVisitorId();
    setCookie('visitor_id', visitorId, 365);
    setCookie('visitor_session_start', `${Date.now()}`, 1);

    const loadContent = async () => {
      try {
        const data = await fetchSiteContent();
        setContent({ ...defaultSiteContent, ...data });
      } catch (error) {
        setContent(defaultSiteContent);
      }
    };

    loadContent();
  }, [isAdmin]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isAdmin) {
    return <Admin />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header scrolled={scrolled} siteName={content.siteName} siteTagline={content.siteTagline} phone={content.phone} />
      <Hero content={content} />
      <Services content={content} />
      <WhyUs content={content} />
      <HowItWorks phone={content.phone} />
      <Testimonials />
      <Blog content={content} />
      <QuoteForm content={content} />
      <Footer content={content} />
    </div>
  );
}

export default App;