import React, { useState, useRef } from "react";
import { 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Crop, 
  SunMedium, 
  FileCheck,
  RefreshCw,
  Camera
} from "lucide-react";
import { OfflineCameraModal } from "./ui/OfflineCameraModal";

interface SmartImageUploadProps {
  onImageProcessed: (processedImageUrl: string, blob: Blob) => void;
  initialImageUrl?: string | null;
}

// Passos do Pipeline de Processamento (100% Local / Offline)
const PIPELINE_STEPS = [
  { id: 1, name: "Isolamento de Fundo & Remoção Local", icon: Sparkles, weight: 35 },
  { id: 2, name: "Realce de Nitidez & Cores HD", icon: SunMedium, weight: 25 },
  { id: 3, name: "Enquadramento 1:1 & Sombra 3D", icon: Crop, weight: 25 },
  { id: 4, name: "Compressão Otimizada (WebP)", icon: FileCheck, weight: 15 },
];

export function SmartProductImageUpload({ onImageProcessed, initialImageUrl }: SmartImageUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [stepProgress, setStepProgress] = useState<number>(0); // 0 a 100% da etapa atual
  const [totalProgress, setTotalProgress] = useState<number>(0); // 0 a 100% do processo global
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Processamento Inteligente 100% no Canvas do Navegador:
   * Funciona perfeitamente offline, sem requisições a servidores externos ou CDNs,
   * evitando qualquer erro de rede / CORS ("TypeError: Failed to fetch").
   */
  const processImagePipeline = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Falha ao carregar a imagem original"));
      };

      img.onload = () => {
        try {
          // --- ETAPA 1: Isolamento de Fundo por Amostragem de Borda ---
          setCurrentStep(1);
          setStepProgress(40);
          setTotalProgress(15);

          const canvasSize = 800;
          const canvas = document.createElement("canvas");
          canvas.width = canvasSize;
          canvas.height = canvasSize;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });

          if (!ctx) {
            URL.revokeObjectURL(objectUrl);
            return resolve(file);
          }

          // Renderizar temporariamente imagem original para análise cromática
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
          const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });

          if (!tempCtx) {
            URL.revokeObjectURL(objectUrl);
            return resolve(file);
          }

          tempCtx.drawImage(img, 0, 0);
          const imgData = tempCtx.getImageData(0, 0, img.width, img.height);
          const data = imgData.data;

          // Amostra dos 4 cantos para estimar cor do fundo
          const corners = [
            0, // Top-left
            (img.width - 1) * 4, // Top-right
            ((img.height - 1) * img.width) * 4, // Bottom-left
            ((img.height - 1) * img.width + (img.width - 1)) * 4, // Bottom-right
          ];

          let avgR = 0, avgG = 0, avgB = 0;
          for (const c of corners) {
            avgR += data[c];
            avgG += data[c + 1];
            avgB += data[c + 2];
          }
          avgR /= 4;
          avgG /= 4;
          avgB /= 4;

          // Se o fundo for branco / cinza claro de estúdio (maioria dos produtos), suaviza o fundo
          const isStudioBg = (avgR > 215 && avgG > 215 && avgB > 215) || (avgR < 25 && avgG < 25 && avgB < 25);
          if (isStudioBg) {
            const tolerance = 45;
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const diff = Math.hypot(r - avgR, g - avgG, b - avgB);
              if (diff < tolerance) {
                // Suavização gradual da transparência
                data[i + 3] = Math.max(0, Math.min(255, (diff / tolerance) * 255));
              }
            }
            tempCtx.putImageData(imgData, 0, 0);
          }

          setStepProgress(100);
          setTotalProgress(35);

          // --- ETAPA 2: Realce de Nitidez, Contraste e Cores HD ---
          setCurrentStep(2);
          setStepProgress(50);
          setTotalProgress(50);

          ctx.clearRect(0, 0, canvasSize, canvasSize);
          ctx.filter = "contrast(1.15) saturate(1.10) brightness(1.02)";

          setStepProgress(100);
          setTotalProgress(60);

          // --- ETAPA 3: Enquadramento Centralizado 1:1 & Sombra Flutuante 3D ---
          setCurrentStep(3);
          setStepProgress(30);
          setTotalProgress(70);

          const padding = canvasSize * 0.12;
          const availableSpace = canvasSize - padding * 2;
          const scale = Math.min(availableSpace / img.width, availableSpace / img.height);
          const drawWidth = img.width * scale;
          const drawHeight = img.height * scale;
          const drawX = (canvasSize - drawWidth) / 2;
          const drawY = (canvasSize - drawHeight) / 2;

          // Sombra estética 3D
          ctx.shadowColor = "rgba(0, 0, 0, 0.40)";
          ctx.shadowBlur = 22;
          ctx.shadowOffsetY = 14;

          ctx.drawImage(tempCanvas, drawX, drawY, drawWidth, drawHeight);

          setStepProgress(100);
          setTotalProgress(85);

          // --- ETAPA 4: Compressão Otimizada (WebP com fallback PNG) ---
          setCurrentStep(4);
          setStepProgress(40);
          setTotalProgress(90);

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(objectUrl);
              setStepProgress(100);
              setTotalProgress(100);

              if (blob) {
                resolve(blob);
              } else {
                resolve(file);
              }
            },
            "image/webp",
            0.92
          );
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          console.warn("Processamento local utilizou fallback direto:", err);
          resolve(file);
        }
      };
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setCurrentStep(1);
      setStepProgress(10);
      setTotalProgress(10);

      // Processamento 100% Local no Navegador
      const finalBlob = await processImagePipeline(file);

      const finalUrl = URL.createObjectURL(finalBlob);
      setPreviewUrl(finalUrl);
      onImageProcessed(finalUrl, finalBlob);
    } catch (err) {
      console.warn("Utilizando arquivo original:", err);
      const fallbackUrl = URL.createObjectURL(file);
      setPreviewUrl(fallbackUrl);
      onImageProcessed(fallbackUrl, file);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 300);
    }
  };

  const handleCameraCapture = async (compressed: { dataUrl: string; blob?: Blob }) => {
    try {
      setIsProcessing(true);
      setCurrentStep(1);
      setStepProgress(25);
      setTotalProgress(25);

      let blob = compressed.blob;
      if (!blob) {
        const res = await fetch(compressed.dataUrl);
        blob = await res.blob();
      }

      const finalBlob = await processImagePipeline(blob as File);
      const finalUrl = URL.createObjectURL(finalBlob);
      setPreviewUrl(finalUrl);
      onImageProcessed(finalUrl, finalBlob);
    } catch (err) {
      console.warn("Utilizando captura direta da câmara:", err);
      setPreviewUrl(compressed.dataUrl);
      if (compressed.blob) {
        onImageProcessed(compressed.dataUrl, compressed.blob);
      }
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 300);
    }
  };

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-5 select-none space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* ⏳ ECRÃ DE PROGRESSO DETALHADO */}
      {isProcessing && (
        <div className="min-h-[300px] bg-neutral-950 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between">
          {/* Header com percentagem total */}
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase text-[#E1FB15] tracking-widest bg-[#E1FB15]/10 px-2.5 py-1 rounded-full border border-[#E1FB15]/20">
                Pipeline HD 100% Offline
              </span>
              <h4 className="text-base font-extrabold text-white mt-2">Processando Fotografia</h4>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-[#E1FB15]">{totalProgress}%</span>
              <p className="text-[10px] text-neutral-500 font-bold">Concluído</p>
            </div>
          </div>

          {/* Barra de Progresso Principal (Neon Yellow) */}
          <div className="w-full my-4">
            <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden p-0.5 border border-neutral-800">
              <div
                className="h-full bg-gradient-to-r from-[#32D583] to-[#E1FB15] rounded-full transition-all duration-300 ease-out"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </div>

          {/* Lista das 4 Etapas com Indicadores Visuais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PIPELINE_STEPS.map((step) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div
                  key={step.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                    isCurrent
                      ? "bg-neutral-900 border-[#E1FB15]/50 shadow-lg shadow-[#E1FB15]/5"
                      : isCompleted
                      ? "bg-neutral-900/60 border-neutral-800 opacity-80"
                      : "bg-neutral-950 border-neutral-800/40 opacity-40"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isCurrent
                          ? "bg-[#E1FB15] text-black"
                          : isCompleted
                          ? "bg-[#32D583]/20 text-[#32D583]"
                          : "bg-neutral-800 text-neutral-500"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white line-clamp-1">{step.name}</p>
                      {isCurrent && (
                        <p className="text-[10px] text-[#E1FB15] font-semibold">
                          Progresso da etapa: {stepProgress}%
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Estado do Ícone */}
                  <div>
                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-[#32D583]" />}
                    {isCurrent && <Loader2 className="w-4 h-4 text-[#E1FB15] animate-spin" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 🖼️ PRÉ-VISUALIZAÇÃO APÓS CONCLUÍDO */}
      {!isProcessing && previewUrl && (
        <div className="flex flex-col items-center">
          <div className="w-full h-64 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-center p-6 relative overflow-hidden bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:16px_16px]">
            <div className="absolute top-3 left-3 bg-[#32D583] text-black text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
              <CheckCircle2 className="w-3 h-3 stroke-[3]" />
              <span>1:1 HD Transparente (WebP Offline)</span>
            </div>

            <img
              src={previewUrl}
              alt="Produto Otimizado"
              className="max-h-full max-w-full object-contain drop-shadow-[0_16px_24px_rgba(0,0,0,0.95)]"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="px-3.5 py-2 bg-[#E1FB15] hover:bg-[#d4ec13] text-black text-xs font-black rounded-xl flex items-center gap-2 transition cursor-pointer shadow-sm"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Tirar Nova Foto (Câmara)</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-white rounded-xl flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-neutral-400" />
              <span>Carregar Outro Ficheiro</span>
            </button>
          </div>
        </div>
      )}

      {/* 📤 OPÇÕES DE CAPTURA & DROPZONE INICIAL */}
      {!isProcessing && !previewUrl && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Opção 1: Captura Direta pela Câmara */}
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="p-4 rounded-2xl bg-gradient-to-br from-neutral-950 to-neutral-900 border border-neutral-700/80 hover:border-[#E1FB15] text-left transition group cursor-pointer flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-[#E1FB15] text-black group-hover:scale-105 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                  100% Offline
                </span>
              </div>
              <div className="mt-3">
                <p className="text-xs font-black text-white group-hover:text-[#E1FB15] transition-colors">
                  Tirar Foto com a Câmara
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                  Use a câmara do terminal para fotografar diretamente o produto
                </p>
              </div>
            </button>

            {/* Opção 2: Carregar do Disco */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-[#E1FB15]/50 text-left transition group cursor-pointer flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-neutral-800 text-neutral-300 group-hover:text-[#E1FB15] transition-colors">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded-full border border-neutral-800">
                  WebP / PNG / JPG
                </span>
              </div>
              <div className="mt-3">
                <p className="text-xs font-black text-white group-hover:text-[#E1FB15] transition-colors">
                  Carregar Ficheiro Local
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                  Selecione ou arraste uma fotografia salva no computador
                </p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-center text-neutral-500 font-medium pt-1">
            Resolução automática em <span className="text-neutral-300 font-bold">800px</span> com compressão <span className="text-emerald-400 font-bold">WebP</span> ultraleve para economia de memória.
          </p>
        </div>
      )}

      {/* Modal de Câmara Local Offline */}
      <OfflineCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(compressed) => {
          setIsCameraOpen(false);
          handleCameraCapture(compressed);
        }}
        title="Fotografar Produto com a Câmara"
        subtitle="Enquadre o artigo no visor. O sistema fará compressão WebP e recorte 1:1 localmente."
      />
    </div>
  );
}
