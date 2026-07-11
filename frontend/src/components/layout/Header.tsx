import { useState, useEffect, useCallback } from 'react';
import { Menu, X, Phone, Package } from 'lucide-react';

// Navigation links – static, moved outside the component for performance
const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Services', href: '#services' },
  { label: 'Why Us', href: '#why-us' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Contact', href: '#contact' },
];

interface HeaderProps {
  scrolled: boolean;
  siteName: string;
  siteTagline: string;
  phone: string;
  logoUrl?: string;
}

export default function Header({
  scrolled,
  siteName,
  siteTagline,
  phone,
  logoUrl,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(Boolean(logoUrl));

  // Close menu on resize to desktop width (lg: 1024px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menu when a nav link is clicked
  const handleNavClick = useCallback(() => {
    setMenuOpen(false);
  }, []);

  // Sanitise phone number: keep only digits and '+'
  const phoneLink = phone?.replace(/[^\d+]/g, '') || '+254748851679';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white shadow-md py-3'
          : 'bg-black/20 backdrop-blur-sm py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* ===== LOGO ===== */}
          <a
            href="#home"
            className="flex items-center gap-3 group"
            aria-label={`${siteName} – Back to home`}
          >
            <div
              className={`w-12 h-12 rounded-full border-2 border-amber-400 flex items-center justify-center overflow-hidden shrink-0 transition-all duration-300 ${
                scrolled
                  ? 'bg-white shadow-md shadow-amber-100/60'
                  : 'bg-white/10 shadow-lg shadow-black/20 backdrop-blur-sm'
              }`}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${siteName} logo`}
                  className="w-full h-full object-contain p-1"
                  onError={(e) => {
                      // Hide broken image, show Package icon fallback
                      (e.target as HTMLImageElement).style.display = 'none';
                      setLogoLoaded(false);
                      }}
                  width={48}
                  height={48}
                  loading="eager"
                />
              ) : (
                <Package className="w-6 h-6 text-amber-500" strokeWidth={2} />
              )}
            </div>
            <div>
              <span
                className={`text-lg font-bold leading-none block transition-colors ${
                  scrolled ? 'text-gray-900' : 'text-white'
                }`}
              >
                {siteName}
              </span>
              <span
                className={`text-xs font-medium tracking-wider transition-colors ${
                  scrolled ? 'text-amber-600' : 'text-amber-300'
                }`}
              >
                {siteTagline}
              </span>
            </div>
          </a>

          {/* ===== DESKTOP NAV ===== */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-amber-500 ${
                  scrolled ? 'text-gray-700' : 'text-white/90'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* ===== CTA + MOBILE TOGGLE ===== */}
          <div className="flex items-center gap-3">
            {/* Phone link */}
            <a
              href={`tel:${phoneLink}`}
              className={`hidden sm:flex items-center gap-2 text-sm font-medium transition-colors ${
                scrolled
                  ? 'text-gray-700 hover:text-amber-600'
                  : 'text-white hover:text-amber-300'
              }`}
              aria-label={`Call ${phone}`}
            >
              <Phone className="w-4 h-4" />
              <span className="hidden md:inline">{phone}</span>
            </a>

            {/* Quote CTA */}
            <a
              href="#contact"
              className="hidden sm:inline-flex items-center px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md"
            >
              Get a Quote
            </a>

            {/* Mobile toggle button */}
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                scrolled
                  ? 'text-gray-700 hover:bg-gray-100'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ===== MOBILE MENU (smooth slide animation) ===== */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            menuOpen ? 'max-h-[600px] opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          <nav
            className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={handleNavClick}
                  className="px-5 py-3 text-gray-700 font-medium hover:bg-amber-50 hover:text-amber-600 transition-colors border-b border-gray-50 last:border-0"
                >
                  {link.label}
                </a>
              ))}
              <div className="px-5 py-4 flex flex-col gap-2 mt-1 border-t border-gray-100">
                <a
                  href={`tel:${phoneLink}`}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 transition-colors"
                >
                  <Phone className="w-4 h-4 text-amber-500" />
                  {phone}
                </a>
                <a
                  href="#contact"
                  onClick={handleNavClick}
                  className="mt-2 text-center px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Get a Quote
                </a>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}