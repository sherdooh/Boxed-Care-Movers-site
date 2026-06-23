import { ArrowRight, ShieldCheck, Truck, Box, BadgeCheck } from 'lucide-react';
import { SiteContent } from '../../lib/siteContent';

interface HeroProps {
  content: SiteContent;
}

export default function Hero({ content }: HeroProps) {
  const headlineLines = (content.heroHeadline || "Moving Shouldn't Be Stressful.")
    .split('\n')
    .filter(Boolean);

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-[#f7f1e8]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.9),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(214,180,128,0.24),_transparent_36%),linear-gradient(180deg,rgba(247,241,232,1),rgba(244,234,221,0.92))]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0)_35%,rgba(184,150,106,0.08)_100%)]" />
      <div className="absolute left-[-8rem] top-[-6rem] h-80 w-80 rounded-full bg-[#d9c4a6]/30 blur-3xl animate-[float_10s_ease-in-out_infinite]" />
      <div className="absolute right-[-5rem] top-20 h-64 w-64 rounded-full bg-[#e7d7c2]/60 blur-3xl animate-[float_12s_ease-in-out_infinite]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl items-center gap-16 px-6 py-24 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d9c4a6]/70 bg-white/65 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#7a5f42] shadow-[0_18px_60px_rgba(120,90,55,0.08)] backdrop-blur-md">
            Premium moving service
          </div>

          <h1 className="mt-6 text-5xl font-black leading-[0.95] tracking-[-0.05em] text-[#171311] sm:text-6xl lg:text-7xl">
            {headlineLines.map((line, index) => (
              <span key={line + index} className="block">
                {line}
              </span>
            ))}
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-[#5c5147] sm:text-xl">
            {content.heroSubtext || 'Professional movers delivering reliable residential and commercial relocation services with care and precision.'}
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#171311] px-7 py-4 text-base font-semibold text-white shadow-[0_20px_40px_rgba(23,19,17,0.16)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#0f0d0c]"
            >
              {content.heroCTA || 'Get Free Quote'}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#services"
              className="inline-flex items-center justify-center rounded-full border border-[#c9b39a] bg-white/70 px-7 py-4 text-base font-semibold text-[#2f241a] shadow-[0_16px_32px_rgba(120,90,55,0.07)] backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white"
            >
              {content.heroCallText || 'View Services'}
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium text-[#4f4136]">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/65 px-4 py-2 shadow-sm backdrop-blur-sm">
              <span className="text-[#b68b4f]">★★★★★</span> Customer Rated
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/65 px-4 py-2 shadow-sm backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-[#b68b4f]" /> Fully Insured
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/65 px-4 py-2 shadow-sm backdrop-blur-sm">
              <BadgeCheck className="h-4 w-4 text-[#b68b4f]" /> Transparent Pricing
            </span>
          </div>

          <div className="mt-10 grid max-w-xl gap-4 sm:grid-cols-3">
            {[
              { label: '10+ Years', sub: 'Moving experience' },
              { label: '24/7 Support', sub: 'Fast response' },
              { label: 'Careful Handling', sub: 'Every item matters' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/70 bg-white/55 px-4 py-4 shadow-[0_18px_45px_rgba(124,92,56,0.08)] backdrop-blur-md">
                <p className="text-sm font-semibold text-[#241b15]">{item.label}</p>
                <p className="mt-1 text-xs text-[#6d6055]">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center lg:justify-end">
          <div className="relative w-full max-w-[560px] rounded-[2rem] border border-white/70 bg-white/45 p-4 shadow-[0_30px_90px_rgba(96,74,48,0.14)] backdrop-blur-xl">
            <div className="absolute -left-6 top-10 rounded-2xl border border-white/70 bg-white/75 px-4 py-3 shadow-lg animate-[float_8s_ease-in-out_infinite]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#171311] text-white shadow-md">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6f53]">Reliable fleet</p>
                  <p className="text-sm font-semibold text-[#201913]">On-time arrivals</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 top-20 rounded-2xl border border-white/70 bg-white/75 px-4 py-3 shadow-lg animate-[float_9s_ease-in-out_infinite] [animation-delay:1.2s]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d9c4a6] text-[#2f241a] shadow-md">
                  <Box className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6f53]">Careful packing</p>
                  <p className="text-sm font-semibold text-[#201913]">Secure every box</p>
                </div>
              </div>
            </div>

            <svg viewBox="0 0 720 720" className="h-auto w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="truckBody" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#ead8c4" />
                </linearGradient>
                <linearGradient id="truckCab" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2b221c" />
                  <stop offset="100%" stopColor="#5a4330" />
                </linearGradient>
                <linearGradient id="routeStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#b68b4f" />
                  <stop offset="100%" stopColor="#e6cda7" />
                </linearGradient>
              </defs>

              <g transform="translate(40 54)">
                <ellipse cx="312" cy="568" rx="210" ry="30" fill="rgba(60,40,26,0.09)" />

                <path
                  d="M116 462C196 398 272 370 346 370C424 370 486 396 564 348"
                  stroke="url(#routeStroke)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray="10 14"
                  className="animate-[dash_9s_linear_infinite]"
                />

                <circle cx="118" cy="460" r="10" fill="#b68b4f" />
                <circle cx="566" cy="348" r="10" fill="#b68b4f" />

                <g className="animate-[float_7s_ease-in-out_infinite]">
                  <rect x="146" y="248" width="180" height="150" rx="24" fill="url(#truckBody)" stroke="#eadfce" strokeWidth="2" />
                  <rect x="322" y="286" width="124" height="112" rx="22" fill="url(#truckCab)" />
                  <rect x="154" y="262" width="62" height="44" rx="14" fill="#f8f3ea" opacity="0.8" />
                  <rect x="225" y="262" width="82" height="82" rx="18" fill="#f8f3ea" opacity="0.65" />
                  <path d="M330 324H416V350H330V324Z" fill="#f5e8d6" opacity="0.45" />

                  <g transform="translate(126 184)">
                    <rect x="0" y="0" width="86" height="58" rx="18" fill="#fffaf2" stroke="#e8dccb" />
                    <path d="M16 18H68" stroke="#b68b4f" strokeWidth="3" strokeLinecap="round" />
                    <path d="M16 32H54" stroke="#cab08d" strokeWidth="3" strokeLinecap="round" />
                  </g>

                  <g transform="translate(242 150)">
                    <rect x="0" y="0" width="76" height="54" rx="18" fill="#fff7ef" stroke="#e8dccb" />
                    <path d="M16 16H60" stroke="#b68b4f" strokeWidth="3" strokeLinecap="round" />
                    <path d="M16 29H46" stroke="#cab08d" strokeWidth="3" strokeLinecap="round" />
                  </g>

                  <circle cx="196" cy="426" r="32" fill="#251d17" />
                  <circle cx="196" cy="426" r="16" fill="#f7f1e8" />
                  <circle cx="392" cy="426" r="32" fill="#251d17" />
                  <circle cx="392" cy="426" r="16" fill="#f7f1e8" />
                  <circle cx="196" cy="426" r="7" fill="#b68b4f" />
                  <circle cx="392" cy="426" r="7" fill="#b68b4f" />

                  <path d="M344 302H392C410 302 424 316 424 334V352H344V302Z" fill="#f3eadc" opacity="0.4" />
                  <path d="M346 292H416" stroke="#f9f3eb" strokeWidth="10" strokeLinecap="round" opacity="0.22" />
                </g>

                <g className="animate-[float_11s_ease-in-out_infinite] [animation-delay:1s]">
                  <rect x="554" y="164" width="90" height="90" rx="24" fill="#ffffff" fillOpacity="0.75" stroke="#efe5d8" />
                  <path d="M576 196H622" stroke="#b68b4f" strokeWidth="4" strokeLinecap="round" />
                  <path d="M576 214H608" stroke="#d6c2a8" strokeWidth="4" strokeLinecap="round" />
                </g>

                <g className="animate-[float_9s_ease-in-out_infinite] [animation-delay:0.5s]">
                  <rect x="74" y="394" width="82" height="82" rx="22" fill="#ffffff" fillOpacity="0.78" stroke="#efe5d8" />
                  <path d="M95 421H135" stroke="#b68b4f" strokeWidth="4" strokeLinecap="round" />
                  <path d="M95 439H125" stroke="#d6c2a8" strokeWidth="4" strokeLinecap="round" />
                </g>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}



