import { ArrowRight, ShieldCheck, Truck, Box, BadgeCheck, Star, Clock, ThumbsUp, Award, Phone, MapPin } from 'lucide-react';
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
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-amber-50/95 via-white to-amber-50/70"
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(214,180,128,0.15),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(214,180,128,0.10),_transparent_50%)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/20 to-transparent" />
      </div>

      {/* Animated floating background blobs */}
      <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-amber-200/15 blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="absolute -right-40 -bottom-40 h-[500px] w-[500px] rounded-full bg-amber-300/12 blur-3xl animate-[pulse_10s_ease-in-out_infinite_1s]" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-amber-100/10 blur-3xl animate-[pulse_12s_ease-in-out_infinite_2s]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 min-h-screen flex items-center py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
          {/* Left Content */}
          <div className="order-2 lg:order-1">
            {/* Animated Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/90 border border-amber-200/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800 shadow-sm backdrop-blur-sm animate-[fadeIn_0.8s_ease-out]">
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Trusted by 500+ Families</span>
            </div>

            {/* Animated Headline with Typewriter Effect */}
            <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-gray-900">
              {headlineLines.map((line, index) => (
                <span 
                  key={index} 
                  className="block animate-[slideUp_0.8s_ease-out]"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  {line}
                </span>
              ))}
            </h1>

            {/* Subtext with fade-in */}
            <p className="mt-4 max-w-lg text-base sm:text-lg text-gray-600 leading-relaxed animate-[fadeIn_1s_ease-out_0.4s_both]">
              {content.heroSubtext || 'Professional movers delivering reliable residential and commercial relocation services with care and precision.'}
            </p>

            {/* CTA Buttons with hover animations */}
            <div className="mt-8 flex flex-wrap gap-3 sm:gap-4 animate-[fadeIn_1s_ease-out_0.6s_both]">
              <a
                href="#contact"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 px-6 sm:px-8 py-3.5 text-sm sm:text-base font-semibold text-white shadow-lg shadow-amber-600/30 hover:shadow-xl hover:shadow-amber-600/40 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]"
              >
                {content.heroCTA || 'Get Free Quote'}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
              <a
                href="#services"
                className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white/80 px-6 sm:px-8 py-3.5 text-sm sm:text-base font-semibold text-gray-700 hover:bg-gray-50 hover:border-amber-200 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                {content.heroCallText || 'View Services'}
              </a>
            </div>

            {/* Trust Badges with stagger animation */}
            <div className="mt-8 flex flex-wrap gap-2 sm:gap-3 animate-[fadeIn_1s_ease-out_0.8s_both]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 border border-amber-100 px-3.5 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                <span className="flex text-amber-500">★★★★★</span>
                <span className="text-gray-400">·</span>
                4.9 (200+ reviews)
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 border border-amber-100 px-3.5 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                Fully Insured
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 border border-amber-100 px-3.5 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                <BadgeCheck className="h-3.5 w-3.5 text-amber-500" />
                No Hidden Fees
              </span>
            </div>

            {/* Stats with hover effects */}
            <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-4 max-w-md">
              {[
                { label: '10+', sub: 'Years Experience', icon: Award },
                { label: '24/7', sub: 'Support Available', icon: Clock },
                { label: '100%', sub: 'Care Guarantee', icon: ThumbsUp },
              ].map((item, index) => (
                <div
                  key={item.label}
                  className="group rounded-2xl bg-white/70 backdrop-blur-sm border border-amber-100/60 px-3 py-3.5 text-center shadow-sm hover:shadow-lg hover:border-amber-200 transition-all duration-300 hover:-translate-y-1 cursor-default"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <item.icon className="h-5 w-5 text-amber-500 mx-auto mb-1 group-hover:scale-110 transition-transform duration-300" />
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{item.label}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-medium">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Enhanced Illustration with more floating badges */}
          <div className="order-1 lg:order-2 flex justify-center">
            <div className="relative w-full max-w-md lg:max-w-lg">
              {/* Decorative rings */}
              <div className="absolute -inset-4 rounded-full border border-amber-200/30 animate-[spin_30s_linear_infinite]" />
              <div className="absolute -inset-8 rounded-full border border-amber-100/20 animate-[spin_40s_linear_infinite_reverse]" />
              <div className="absolute -inset-12 rounded-full border border-amber-50/30 animate-[spin_50s_linear_infinite]" />

              {/* Main image container */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-amber-500/15 bg-gradient-to-br from-amber-50 to-white border border-amber-100/30">
                <div className="aspect-square p-6 sm:p-8 flex items-center justify-center">
                  {/* Enhanced Truck Illustration */}
                  <div className="w-full max-w-sm">
                    <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                      <defs>
                        <linearGradient id="truckBody" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f5ede4" />
                          <stop offset="100%" stopColor="#e8dccc" />
                        </linearGradient>
                        <linearGradient id="truckCab" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2d241e" />
                          <stop offset="100%" stopColor="#1a1410" />
                        </linearGradient>
                      </defs>

                      {/* Shadow */}
                      <ellipse cx="190" cy="270" rx="150" ry="14" fill="rgba(60,40,26,0.08)" />

                      {/* Road */}
                      <path
                        d="M20 240 L160 240 L180 220 L320 220 L340 200 L380 200"
                        stroke="#d4c5b5"
                        strokeWidth="3"
                        strokeDasharray="8 8"
                        opacity="0.4"
                      />

                      {/* Moving boxes */}
                      <g className="animate-[float_4s_ease-in-out_infinite]">
                        <rect x="70" y="145" width="44" height="38" rx="6" fill="#f5ede4" stroke="#d4c5b5" strokeWidth="1.5" />
                        <rect x="75" y="150" width="34" height="4" rx="2" fill="#d4c5b5" opacity="0.5" />
                        <rect x="75" y="158" width="24" height="4" rx="2" fill="#d4c5b5" opacity="0.5" />
                      </g>

                      <g className="animate-[float_4.5s_ease-in-out_infinite_0.8s]">
                        <rect x="120" y="125" width="50" height="42" rx="6" fill="#f5ede4" stroke="#d4c5b5" strokeWidth="1.5" />
                        <rect x="126" y="131" width="38" height="4" rx="2" fill="#d4c5b5" opacity="0.5" />
                        <rect x="126" y="140" width="26" height="4" rx="2" fill="#d4c5b5" opacity="0.5" />
                      </g>

                      <g className="animate-[float_5s_ease-in-out_infinite_1.6s]">
                        <rect x="50" y="175" width="35" height="30" rx="6" fill="#f5ede4" stroke="#d4c5b5" strokeWidth="1.5" />
                        <rect x="55" y="180" width="25" height="3" rx="2" fill="#d4c5b5" opacity="0.5" />
                      </g>

                      {/* Truck Body */}
                      <rect x="110" y="170" width="160" height="70" rx="12" fill="url(#truckBody)" stroke="#d4c5b5" strokeWidth="1.5" />

                      {/* Truck Body details */}
                      <rect x="120" y="180" width="50" height="30" rx="6" fill="#faf6f0" stroke="#e8dccc" strokeWidth="1" />
                      <rect x="180" y="180" width="40" height="30" rx="6" fill="#faf6f0" stroke="#e8dccc" strokeWidth="1" />

                      {/* Truck Cab */}
                      <path d="M270 186 L270 240 L240 240 L240 200 L260 200 L270 186 Z" fill="url(#truckCab)" />

                      {/* Window */}
                      <path d="M254 196 L270 196 L270 212 L254 212 Z" fill="#4a6fa5" opacity="0.4" />

                      {/* Headlight glow */}
                      <circle cx="272" cy="220" r="4" fill="#fbbf24" opacity="0.6" />

                      {/* Wheels */}
                      <circle cx="160" cy="245" r="28" fill="#1a1410" stroke="#2d241e" strokeWidth="2" />
                      <circle cx="160" cy="245" r="14" fill="#3d3d3d" />
                      <circle cx="160" cy="245" r="6" fill="#666" />

                      <circle cx="230" cy="245" r="28" fill="#1a1410" stroke="#2d241e" strokeWidth="2" />
                      <circle cx="230" cy="245" r="14" fill="#3d3d3d" />
                      <circle cx="230" cy="245" r="6" fill="#666" />

                      {/* Highlight */}
                      <rect x="115" y="172" width="100" height="6" rx="3" fill="white" opacity="0.3" />

                      {/* Motion lines */}
                      <path d="M360 200 L380 200" stroke="#d4c5b5" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
                      <path d="M365 210 L385 210" stroke="#d4c5b5" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
                      <path d="M355 190 L375 190" stroke="#d4c5b5" strokeWidth="2" strokeLinecap="round" opacity="0.25" />
                    </svg>
                  </div>
                </div>

                {/* Floating badges - more of them for visual richness */}
                <div className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 rounded-2xl bg-white/95 shadow-xl border border-amber-100/60 px-3 sm:px-4 py-2 sm:py-2.5 backdrop-blur-sm animate-[float_6s_ease-in-out_infinite]">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.1em] text-amber-700">Reliable</p>
                      <p className="text-xs sm:text-sm font-bold text-gray-800">On-time delivery</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 rounded-2xl bg-white/95 shadow-xl border border-amber-100/60 px-3 sm:px-4 py-2 sm:py-2.5 backdrop-blur-sm animate-[float_7s_ease-in-out_infinite_1s]">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <Box className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.1em] text-amber-700">Careful</p>
                      <p className="text-xs sm:text-sm font-bold text-gray-800">Every item</p>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/2 -left-6 sm:-left-8 rounded-2xl bg-white/95 shadow-xl border border-amber-100/60 px-3 sm:px-4 py-2 sm:py-2.5 backdrop-blur-sm animate-[float_8s_ease-in-out_infinite_2s] hidden sm:block">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
                      <ThumbsUp className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.1em] text-green-700">Satisfied</p>
                      <p className="text-xs sm:text-sm font-bold text-gray-800">100% guaranteed</p>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/3 -right-6 sm:-right-8 rounded-2xl bg-white/95 shadow-xl border border-amber-100/60 px-3 sm:px-4 py-2 sm:py-2.5 backdrop-blur-sm animate-[float_9s_ease-in-out_infinite_0.5s] hidden sm:block">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.1em] text-blue-700">24/7</p>
                      <p className="text-xs sm:text-sm font-bold text-gray-800">Support ready</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-xl bg-white/95 shadow-xl border border-amber-100/60 px-4 py-1.5 backdrop-blur-sm animate-[float_5s_ease-in-out_infinite_0.3s] hidden md:block">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">4.9/5</span>
                  </div>
                </div>
              </div>

              {/* Bottom call-to-action indicator */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-white/90 shadow-lg border border-amber-100/60 px-6 py-2 backdrop-blur-sm flex items-center gap-2 animate-bounce">
                <Phone className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-semibold text-gray-700">{content.phone || '+254 748 851 679'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.8s ease-out forwards;
        }
      `}</style>
    </section>
  );
}