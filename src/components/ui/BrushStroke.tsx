import React from 'react';

interface BrushStrokeProps {
  className?: string;
  color?: string;
  opacity?: number;
}

export function BrushStroke({
  className = "w-full h-full text-white",
  color,
  opacity = 0.95
}: BrushStrokeProps) {
  return (
    <svg
      viewBox="0 0 600 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="none"
      style={color ? { color } : undefined}
    >
      <defs>
        <filter id="brush-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.35" />
        </filter>
      </defs>

      <g filter="url(#brush-shadow)" opacity={opacity}>
        {/* Traço de Base Sólido da Pincelada */}
        <path
          d="M 28,90 
             C 42,82 58,77 78,73 
             C 120,65 170,62 225,63 
             C 290,64 355,70 420,67 
             C 470,64 515,50 558,32 
             C 572,26 584,20 592,15 
             C 595,19 586,28 576,36 
             C 556,51 530,68 508,82 
             C 468,107 416,124 360,132 
             C 300,140 235,141 175,137 
             C 125,134 82,132 44,124 
             C 30,121 18,115 12,105 
             C 8,95 16,91 28,90 Z"
          fill="currentColor"
        />

        {/* Textura de Cerdas Superiores */}
        <path
          d="M 60,70 C 115,56 195,54 285,58 C 375,62 465,50 555,23 C 570,18 575,22 560,30 C 480,58 390,70 295,66 C 205,62 125,66 60,76 C 50,78 45,73 60,70 Z"
          fill="currentColor"
          opacity="0.85"
        />
        <path
          d="M 110,54 C 210,48 330,56 450,40 C 500,33 540,22 568,14 C 572,16 564,23 540,31 C 430,50 310,56 190,58 C 140,59 105,58 110,54 Z"
          fill="currentColor"
          opacity="0.7"
        />

        {/* Cerdas Secas na Ponta Direita */}
        <path
          d="M 515,36 C 540,28 565,20 585,12 C 580,16 560,28 535,40 Z"
          fill="currentColor"
          opacity="0.9"
        />
        <path
          d="M 495,50 C 525,38 555,28 577,22 C 571,26 545,40 515,56 Z"
          fill="currentColor"
          opacity="0.8"
        />
        <path
          d="M 475,66 C 510,53 540,43 565,36 C 555,43 525,60 490,74 Z"
          fill="currentColor"
          opacity="0.75"
        />

        {/* Textura de Cerdas Inferiores */}
        <path
          d="M 24,100 C 46,116 86,124 141,128 C 226,134 316,132 406,120 C 466,112 516,93 551,73 C 546,80 506,103 446,120 C 356,138 256,142 161,136 C 101,132 51,124 18,110 C 12,106 16,98 24,100 Z"
          fill="currentColor"
          opacity="0.85"
        />
        <path
          d="M 40,118 C 105,132 195,140 295,138 C 395,136 475,118 530,90 C 520,98 460,126 370,140 C 270,144 170,140 75,128 C 45,124 30,120 40,118 Z"
          fill="currentColor"
          opacity="0.6"
        />
      </g>
    </svg>
  );
}

export default BrushStroke;
