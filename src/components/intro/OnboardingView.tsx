import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface OnboardingViewProps {
  onComplete: () => void;
  onSkip?: () => void;
}

// ----------------------------------------------------------------------
// High-Precision Vector Illustrations matching 11.png, 12.png, 13.png
// ----------------------------------------------------------------------

// 1. Vendas Illustration (11.png)
const VendasIllustration: React.FC = () => (
  <svg
    viewBox="0 0 460 420"
    className="w-80 h-72 sm:w-96 sm:h-84 md:w-[420px] md:h-[360px] select-none"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <filter id="soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.06" />
      </filter>
    </defs>

    {/* Background Soft Disc & Blobs */}
    <ellipse cx="205" cy="210" rx="145" ry="145" fill="#ECEFF2" />
    <ellipse cx="330" cy="305" rx="22" ry="34" fill="#DEE3E8" opacity="0.8" transform="rotate(-25 330 305)" />
    <ellipse cx="90" cy="140" rx="12" ry="18" fill="#DEE3E8" opacity="0.6" />

    {/* Subtle geometric constellation background lines */}
    <path
      d="M175 145 L295 105 L310 190 L240 220 Z"
      stroke="#CBD5E1"
      strokeWidth="1.2"
      strokeDasharray="4 4"
      opacity="0.75"
    />
    <path
      d="M295 105 L350 145"
      stroke="#CBD5E1"
      strokeWidth="1.2"
      strokeDasharray="4 4"
      opacity="0.75"
    />

    {/* Floating Icon 1: Red Rounded Square (top-right) */}
    <g transform="translate(270, 72) rotate(12)">
      <rect
        x="0"
        y="0"
        width="28"
        height="28"
        rx="6"
        fill="#EB3B3B"
        filter="url(#soft-shadow)"
      />
    </g>

    {/* Floating Icon 2: Yellow & Charcoal Pie Chart Diagram */}
    <g transform="translate(332, 118)">
      <circle cx="20" cy="20" r="18" fill="#FABE15" />
      {/* Top right slice */}
      <path d="M20 2 A18 18 0 0 1 38 20 L20 20 Z" fill="#20242A" />
      {/* Bottom right slice */}
      <path d="M20 20 L38 20 A18 18 0 0 1 20 38 Z" fill="#20242A" />
      <circle cx="20" cy="20" r="18" stroke="#ECEFF2" strokeWidth="1" />
    </g>

    {/* Floating Icon 3: Blue Document with horizontal lines */}
    <g transform="translate(288, 122)" filter="url(#soft-shadow)">
      <rect x="0" y="0" width="42" height="54" rx="5" fill="#3B82F6" />
      <line x1="7" y1="12" x2="35" y2="12" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="7" y1="20" x2="35" y2="20" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="7" y1="28" x2="35" y2="28" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="7" y1="36" x2="35" y2="36" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="7" y1="44" x2="25" y2="44" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </g>

    {/* Thin Desk / Shelf Surface Bar */}
    <rect x="125" y="278" width="245" height="7" rx="3.5" fill="#DDE2E8" />

    {/* Character: Salesperson */}
    <g id="character-vendas">
      {/* Hair (Black, cropped modern cut) */}
      <path
        d="M188 114 C180 102 205 90 226 92 C236 94 242 102 240 114 C234 110 224 107 216 108 C202 110 192 110 188 114 Z"
        fill="#1C2025"
      />
      {/* Sideburn & back neck hair */}
      <path d="M192 114 L190 134 L198 126 Z" fill="#1C2025" />

      {/* Head / Face */}
      <path
        d="M194 115 C194 108 202 102 214 102 C226 102 232 108 232 118 C232 130 226 142 214 142 C202 142 194 130 194 115 Z"
        fill="#F6AC78"
      />
      {/* Left Ear */}
      <ellipse cx="194" cy="122" rx="4.5" ry="6" fill="#F6AC78" />
      <path d="M194 120 C195 122 195 125 193 126" stroke="#E29462" strokeWidth="1.2" fill="none" />

      {/* Face details */}
      {/* Eyebrow */}
      <path d="M216 112 Q223 111 227 114" stroke="#1C2025" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Eye */}
      <ellipse cx="222" cy="118" rx="2.5" ry="2.8" fill="#1C2025" />
      {/* Nose */}
      <path d="M228 118 L232 123 L227 125" stroke="#E29462" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Cheerful Smile */}
      <path d="M218 131 Q224 136 229 130" stroke="#B45309" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Neck */}
      <rect x="204" y="138" width="18" height="15" fill="#F6AC78" />

      {/* Blue T-Shirt Body */}
      <path
        d="M172 152 C186 148 230 148 248 152 L268 185 L248 196 L242 176 L244 266 L180 266 L182 176 L174 196 L154 185 Z"
        fill="#3B82F6"
      />

      {/* White Square Outline on Chest */}
      <rect
        x="200"
        y="178"
        width="28"
        height="28"
        rx="2"
        stroke="white"
        strokeWidth="3.5"
        fill="none"
      />

      {/* Left Arm (angled back / side) */}
      <path
        d="M172 152 L154 185 L180 220 L195 210 L174 184 Z"
        fill="#F6AC78"
      />

      {/* Right Arm (reaching forward to laptop keyboard) */}
      <path
        d="M242 174 L276 210 L308 210 L308 222 L268 224 L236 186 Z"
        fill="#F6AC78"
      />

      {/* Dark Pants / Bottom */}
      <path d="M180 266 L244 266 L244 315 L180 315 Z" fill="#1C2025" />
    </g>

    {/* Modern Laptop on Desk */}
    <g id="laptop" transform="translate(268, 204)" filter="url(#soft-shadow)">
      {/* Laptop Lid / Screen */}
      <path
        d="M22 6 L68 6 C70 6 72 8 72 10 L64 62 C64 64 62 66 60 66 L14 66 C12 66 10 64 10 62 L18 10 C18 8 20 6 22 6 Z"
        fill="#1C2025"
      />
      {/* White Square Logo on Laptop Lid */}
      <rect
        x="36"
        y="28"
        width="16"
        height="16"
        rx="2"
        stroke="white"
        strokeWidth="2.8"
        fill="none"
      />
      {/* Laptop Base */}
      <path d="M6 65 L76 65 L84 74 L0 74 Z" fill="#282D33" />
      <rect x="0" y="73" width="84" height="2" fill="#525B66" />
    </g>
  </svg>
);

// 2. Cliente Illustration (12.png)
const ClienteIllustration: React.FC = () => (
  <svg
    viewBox="0 0 460 420"
    className="w-80 h-72 sm:w-96 sm:h-84 md:w-[420px] md:h-[360px] select-none"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <filter id="soft-shadow-2" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.06" />
      </filter>
    </defs>

    {/* Background Soft Disc & Blobs */}
    <ellipse cx="235" cy="210" rx="145" ry="145" fill="#ECEFF2" />
    <ellipse cx="120" cy="320" rx="24" ry="36" fill="#DEE3E8" opacity="0.8" transform="rotate(25 120 320)" />
    <ellipse cx="370" cy="150" rx="14" ry="20" fill="#DEE3E8" opacity="0.6" />

    {/* Floating Chat Bubbles */}
    {/* Bubble 1: Blue (Top) */}
    <g transform="translate(112, 78)" filter="url(#soft-shadow-2)">
      <rect x="0" y="0" width="68" height="36" rx="8" fill="#3B82F6" />
      <path d="M14 36 L6 45 L24 36 Z" fill="#3B82F6" />
      <line x1="12" y1="11" x2="56" y2="11" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="12" y1="19" x2="46" y2="19" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="12" y1="27" x2="34" y2="27" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </g>

    {/* Bubble 2: Yellow / Gold (Middle) */}
    <g transform="translate(142, 134)" filter="url(#soft-shadow-2)">
      <rect x="0" y="0" width="62" height="34" rx="8" fill="#FABE15" />
      <path d="M12 34 L5 42 L22 34 Z" fill="#FABE15" />
      <line x1="11" y1="11" x2="51" y2="11" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="11" y1="20" x2="39" y2="20" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </g>

    {/* Bubble 3: Red (Bottom) */}
    <g transform="translate(114, 184)" filter="url(#soft-shadow-2)">
      <rect x="0" y="0" width="58" height="32" rx="8" fill="#EB3B3B" />
      <path d="M12 32 L6 39 L20 32 Z" fill="#EB3B3B" />
      <line x1="10" y1="10" x2="48" y2="10" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="10" y1="19" x2="36" y2="19" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </g>

    {/* Character: Customer / Client with Phone */}
    <g id="character-cliente">
      {/* Hair (Black cropped cut) */}
      <path
        d="M228 114 C220 102 245 90 266 92 C276 94 282 102 280 114 C274 110 264 107 256 108 C242 110 232 110 228 114 Z"
        fill="#1C2025"
      />
      <path d="M232 114 L230 134 L238 126 Z" fill="#1C2025" />

      {/* Head / Face */}
      <path
        d="M234 115 C234 108 242 102 254 102 C266 102 272 108 272 118 C272 130 266 142 254 142 C242 142 234 130 234 115 Z"
        fill="#F6AC78"
      />
      {/* Left Ear */}
      <ellipse cx="234" cy="122" rx="4.5" ry="6" fill="#F6AC78" />
      <path d="M234 120 C235 122 235 125 233 126" stroke="#E29462" strokeWidth="1.2" fill="none" />

      {/* Face details */}
      <path d="M256 112 Q263 111 267 114" stroke="#1C2025" strokeWidth="2" strokeLinecap="round" fill="none" />
      <ellipse cx="262" cy="118" rx="2.5" ry="2.8" fill="#1C2025" />
      <path d="M268 118 L272 123 L267 125" stroke="#E29462" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M258 131 Q264 136 269 130" stroke="#B45309" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Neck */}
      <rect x="244" y="138" width="18" height="15" fill="#F6AC78" />

      {/* Red T-Shirt Body */}
      <path
        d="M212 152 C226 148 270 148 288 152 L308 185 L288 196 L282 176 L284 266 L220 266 L222 176 L214 196 L194 185 Z"
        fill="#EB3B3B"
      />

      {/* White Circle Outline on Chest */}
      <circle
        cx="253"
        cy="192"
        r="18"
        stroke="white"
        strokeWidth="3.5"
        fill="none"
      />

      {/* Left Arm raised holding Smartphone */}
      <path
        d="M214 176 L175 220 L195 244 L225 212 L212 176 Z"
        fill="#F6AC78"
      />
      {/* Hand grasping smartphone */}
      <path d="M174 218 L162 195 L174 190 L188 214 Z" fill="#F6AC78" />
      {/* Smartphone */}
      <rect
        x="152"
        y="180"
        width="16"
        height="32"
        rx="3"
        fill="#1C2025"
        transform="rotate(-20 152 180)"
        filter="url(#soft-shadow-2)"
      />

      {/* Right Arm relaxed by side */}
      <path
        d="M282 176 L298 228 L284 236 L270 186 Z"
        fill="#F6AC78"
      />

      {/* Dark Pants / Bottom */}
      <path d="M220 266 L284 266 L284 315 L220 315 Z" fill="#1C2025" />
    </g>
  </svg>
);

// 3. Controle Illustration (13.png)
const ControleIllustration: React.FC = () => (
  <svg
    viewBox="0 0 460 420"
    className="w-80 h-72 sm:w-96 sm:h-84 md:w-[420px] md:h-[360px] select-none"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <filter id="soft-shadow-3" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.06" />
      </filter>
    </defs>

    {/* Background Soft Disc & Blobs */}
    <ellipse cx="255" cy="210" rx="145" ry="145" fill="#ECEFF2" />
    <ellipse cx="150" cy="330" rx="20" ry="32" fill="#DEE3E8" opacity="0.8" transform="rotate(-30 150 330)" />
    <ellipse cx="380" cy="140" rx="12" ry="18" fill="#DEE3E8" opacity="0.6" />

    {/* Interactive Floating Touch Dashboard Panel */}
    <g transform="translate(112, 85)" filter="url(#soft-shadow-3)">
      {/* Outer White Frame with soft border */}
      <rect
        x="0"
        y="0"
        width="174"
        height="140"
        rx="18"
        fill="white"
        stroke="#DDE3EA"
        strokeWidth="4"
      />
      {/* Interior Soft Blue Canvas */}
      <rect
        x="9"
        y="9"
        width="156"
        height="122"
        rx="12"
        fill="#E1EEFC"
      />

      {/* Grid of Interactive UI Blocks (3 rows x 4 columns) */}
      {/* Row 1 */}
      <rect x="20" y="20" width="26" height="24" rx="5" fill="#91BDF8" />
      <rect x="54" y="20" width="26" height="24" rx="5" fill="#91BDF8" />
      <rect x="88" y="20" width="26" height="24" rx="5" fill="#1D63ED" />
      <rect x="122" y="20" width="26" height="24" rx="5" fill="#91BDF8" />

      {/* Row 2 */}
      <rect x="20" y="52" width="26" height="24" rx="5" fill="#FABE15" />
      <rect x="54" y="52" width="26" height="24" rx="5" fill="#91BDF8" />
      <rect x="88" y="52" width="26" height="24" rx="5" fill="#91BDF8" />
      <rect x="122" y="52" width="26" height="24" rx="5" fill="#91BDF8" />

      {/* Row 3 */}
      <rect x="20" y="84" width="26" height="24" rx="5" fill="#91BDF8" />
      <rect x="54" y="84" width="26" height="24" rx="5" fill="#91BDF8" />
      <rect x="88" y="84" width="26" height="24" rx="5" fill="#EB3B3B" />
      <rect x="122" y="84" width="26" height="24" rx="5" fill="#91BDF8" />
    </g>

    {/* Character seen from Back / 3/4 Perspective Touching Dashboard */}
    <g id="character-controle">
      {/* Hair (Back of head view) */}
      <path
        d="M272 108 C262 98 290 92 304 96 C314 100 318 112 314 124 C306 132 294 136 282 134 C270 130 268 118 272 108 Z"
        fill="#1C2025"
      />
      {/* Side of face & ear visible in profile */}
      <ellipse cx="270" cy="122" rx="4.5" ry="6" fill="#F6AC78" />
      {/* Neck */}
      <rect x="274" y="132" width="24" height="18" fill="#F6AC78" />

      {/* Yellow T-Shirt Body (Back view) */}
      <path
        d="M246 150 C268 144 306 144 328 150 L348 184 L326 195 L318 174 L320 266 L256 266 L258 174 L244 195 L224 184 Z"
        fill="#FABE15"
      />

      {/* White Inverted Triangle Outline on Back of Shirt */}
      <polygon
        points="287,175 301,198 273,198"
        stroke="white"
        strokeWidth="3.5"
        fill="none"
        transform="rotate(180 287 187)"
      />

      {/* Left Arm reaching forward with index finger touching the panel */}
      <path
        d="M246 154 L212 176 L188 162 L190 148 L218 144 L246 150 Z"
        fill="#F6AC78"
      />
      {/* Extended index finger tapping the panel */}
      <path
        d="M190 148 L178 126 L188 122 L198 144 Z"
        fill="#F6AC78"
      />

      {/* Right Arm relaxed by side */}
      <path
        d="M326 174 L340 224 L326 230 L314 180 Z"
        fill="#F6AC78"
      />

      {/* Dark Pants / Bottom */}
      <path d="M256 266 L320 266 L320 318 L256 318 Z" fill="#1C2025" />
    </g>
  </svg>
);

// ----------------------------------------------------------------------
// Slide Data Definitions strictly adhering to 11.png, 12.png, 13.png
// ----------------------------------------------------------------------

interface OnboardingSlide {
  id: number;
  title: string;
  quoteLines: string[];
  illustration: React.ReactNode;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 0,
    title: 'Vendas !',
    quoteLines: [
      '“Faça vendas cada',
      'vez mais  otimizadas',
      'para os seus clientes  ”',
    ],
    illustration: <VendasIllustration />,
  },
  {
    id: 1,
    title: 'Cliente !',
    quoteLines: [
      '“Tenha uma otimista clientela,',
      'De melhor segurança e um',
      'atendimento agradável ”',
    ],
    illustration: <ClienteIllustration />,
  },
  {
    id: 2,
    title: 'Controle !',
    quoteLines: [
      '“Monitore cada, venda, produtos, lucros',
      'e perdas com graficos otimizados',
      'e interativos ”',
    ],
    illustration: <ControleIllustration />,
  },
];

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete, onSkip }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  // Keyboard navigation support (Arrow Right, Arrow Left, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const slide = SLIDES[currentSlide];

  return (
    <div
      id="view-onboarding"
      className="relative min-h-screen w-full bg-white text-zinc-950 flex flex-col justify-between p-6 sm:p-10 md:p-12 select-none overflow-hidden font-josefin"
      style={{ fontFamily: "'Josefin Sans', sans-serif" }}
    >
      {/* Top Header: Brand Logo & Skip Button */}
      <header className="w-full flex items-center justify-between z-20">
        <div id="masakula-brand-title" className="flex items-center gap-2">
          <span className="font-bold text-2xl sm:text-[30px] tracking-normal text-zinc-950 font-josefin">
            Masakula
          </span>
          <span className="text-[11px] font-bold text-zinc-400">
            {currentSlide + 1}/3
          </span>
        </div>

        <button
          id="btn-onboarding-skip"
          type="button"
          onClick={onSkip || onComplete}
          className="px-4 py-1.5 rounded-full text-xs font-semibold text-zinc-500 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200/80 transition-colors cursor-pointer"
        >
          Pular
        </button>
      </header>

      {/* Main Screen Content: Two Symmetrical Columns */}
      <main className="w-full max-w-6xl mx-auto my-auto py-6 sm:py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center"
          >
            {/* Left Column: Hand-Crafted Character Illustration + Bold Title */}
            <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6">
              <div className="w-full flex justify-center items-center">
                {slide.illustration}
              </div>

              {/* Title exactly: "Vendas !", "Cliente !", "Controle !" */}
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-zinc-900 tracking-normal text-center font-josefin">
                {slide.title}
              </h2>
            </div>

            {/* Right Column: Quotes matching exact spacing & typography in Josefin Sans */}
            <div className="flex flex-col justify-center items-center md:items-start text-center md:text-left px-4 sm:px-8">
              <div className="space-y-1 max-w-xl">
                {slide.quoteLines.map((line, idx) => (
                  <p
                    key={idx}
                    className="text-2xl sm:text-3xl lg:text-[33px] font-bold text-zinc-900 leading-snug tracking-normal font-josefin"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer: Bottom Controls */}
      <footer className="w-full relative flex items-center justify-between pt-4 pb-2">
        {/* Left: Optional Back button */}
        <div className="w-14">
          {currentSlide > 0 && (
            <button
              id="btn-onboarding-prev"
              type="button"
              onClick={prevSlide}
              aria-label="Voltar"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current rotate-180" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}
        </div>

        {/* Center: Exact 3 Pagination Dots */}
        <div
          id="onboarding-dots"
          className="flex items-center gap-2.5"
        >
          {[0, 1, 2].map((dotIdx) => {
            const isActive = currentSlide === dotIdx;
            return (
              <button
                key={dotIdx}
                type="button"
                aria-label={`Slide ${dotIdx + 1}`}
                onClick={() => setCurrentSlide(dotIdx)}
                className={`rounded-full transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'w-3 h-3 bg-zinc-950 scale-110 shadow-xs'
                    : 'w-2 h-2 bg-zinc-300 hover:bg-zinc-400'
                }`}
              />
            );
          })}
        </div>

        {/* Right: Black Pill Action Button with Solid White Arrow */}
        <div className="w-14 flex justify-end">
          <button
            id="btn-onboarding-next"
            type="button"
            onClick={nextSlide}
            aria-label={currentSlide === 2 ? 'Iniciar' : 'Avançar'}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-black hover:bg-zinc-800 active:scale-95 text-white flex items-center justify-center shadow-lg transition-all cursor-pointer"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 fill-current translate-x-0.5"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
};
