import React, { useState, useRef, useEffect } from "react";
import { Upload, X, Image as ImageIcon, RefreshCw, Trash2 } from "lucide-react";
import { BorderParticles } from "./BorderParticles";

export interface ImageUploadDropzoneProps {
  onImageSelected: (file: File | null) => void;
  initialImageUrl?: string;
  className?: string;
}

export function ImageUploadDropzone({
  onImageSelected,
  initialImageUrl,
  className = "",
}: ImageUploadDropzoneProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialImageUrl !== undefined) {
      setPreviewUrl(initialImageUrl || null);
    }
  }, [initialImageUrl]);

  const triggerParticles = () => {
    setShowParticles(true);
    setTimeout(() => {
      setShowParticles(false);
    }, 2800);
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return;
    }
    triggerParticles();
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPreviewUrl(base64);
    };
    reader.readAsDataURL(file);
    onImageSelected(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    setShowParticles(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onImageSelected(null);
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !previewUrl && fileInputRef.current?.click()}
        style={showParticles ? { animation: "borderGlowPulse 1.8s ease-in-out infinite" } : undefined}
        className={`
          flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-4 transition-all duration-300 relative overflow-visible
          ${
            showParticles
              ? "border-[#32D583] bg-emerald-950/30"
              : previewUrl
              ? "border-emerald-500/60 bg-neutral-900/70"
              : isDragging
              ? "border-[#E1FB15] bg-neutral-900/80 scale-[0.99]"
              : "border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900/70 hover:border-neutral-700 cursor-pointer"
          }
        `}
      >
        {/* Partículas verdes emitidas a partir da borda pontilhada */}
        <BorderParticles active={showParticles} count={32} />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/webp,image/jpeg"
          onChange={handleChange}
          className="hidden"
        />

        {previewUrl ? (
          <div className="flex flex-col items-center gap-3 w-full py-1">
            <div className="relative w-32 h-32 flex items-center justify-center p-2 bg-neutral-950/80 rounded-xl border border-neutral-800 shadow-inner">
              <img
                src={previewUrl}
                alt="Pré-visualização do produto"
                referrerPolicy="no-referrer"
                className="max-h-28 w-auto object-contain drop-shadow-md pointer-events-none animate-in zoom-in-75 duration-300"
              />
              <button
                type="button"
                onClick={handleRemove}
                aria-label="Remover imagem"
                className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 shadow-md transition-colors cursor-pointer z-10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold cursor-pointer transition shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#32D583]" />
                <span>Trocar Imagem</span>
              </button>

              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-400 border border-rose-800/50 text-xs font-semibold cursor-pointer transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center text-neutral-400 mb-3 border border-neutral-700">
              <ImageIcon className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-neutral-200">
              Carregar foto do produto
            </span>
            <span className="text-[11px] text-neutral-400 mt-1">
              Arraste ou clique para selecionar (PNG transparente recomendado)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageUploadDropzone;
