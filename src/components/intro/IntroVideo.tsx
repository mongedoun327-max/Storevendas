import React, { useRef } from 'react';

interface IntroVideoProps {
  onFinish: () => void;
}

/**
 * Reproduz o vídeo de introdução original (sem alterações).
 * Quando o vídeo termina naturalmente, chama onFinish para entrar na tela de login.
 */
export function IntroVideo({ onFinish }: IntroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div
      id="intro-video-stage"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
    >
      <video
        ref={videoRef}
        src="/intro/vendas-intro.mp4"
        autoPlay
        muted
        playsInline
        onEnded={onFinish}
        onError={onFinish}
        className="h-full w-full object-cover"
      />
      <button
        type="button"
        onClick={onFinish}
        className="absolute bottom-8 right-8 z-50 px-5 py-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold tracking-wide transition-all border border-white/30 cursor-pointer shadow-lg"
      >
        Pular Introdução →
      </button>
    </div>
  );
}
