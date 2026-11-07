import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  X, 
  RotateCw, 
  Check, 
  RotateCcw, 
  AlertCircle, 
  Upload, 
  Sparkles,
  Maximize2
} from 'lucide-react';
import { compressImageToWebP } from '../../utils/localMediaStorage';

interface OfflineCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (compressed: { dataUrl: string; sizeKb: number; width: number; height: number }) => void;
  title?: string;
  subtitle?: string;
}

export const OfflineCameraModal: React.FC<OfflineCameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Capturar Fotografia Offline',
  subtitle = 'Utilize a câmara do aparelho para fotografar o artigo ou documento'
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement | null>(null);

  // Stop current video stream
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopStream();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCamera(false);
      setCameraError('O seu navegador ou dispositivo não possui suporte a câmara.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId 
          ? { deviceId: { exact: selectedDeviceId } }
          : { 
              facingMode: { ideal: facingMode },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setHasCamera(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch((err) => console.warn('Erro ao reproduzir vídeo:', err));
      }

      // Check available video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoDevices);
    } catch (err: any) {
      console.warn('Erro de acesso à câmara:', err);
      setHasCamera(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Permissão de acesso à câmara recusada pelo utilizador.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('Nenhuma câmara física encontrada neste terminal.');
      } else {
        setCameraError('Não foi possível iniciar a câmara. Pode carregar um ficheiro local.');
      }
    }
  }, [facingMode, selectedDeviceId, stopStream]);

  useEffect(() => {
    if (isOpen) {
      setCapturedPreview(null);
      startCamera();
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, stopStream]);

  // Toggle between front and back cameras
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    setSelectedDeviceId('');
  };

  // Capture frame from video stream
  const handleSnap = async () => {
    if (!videoRef.current) return;
    try {
      setIsProcessing(true);
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Não foi possível obter contexto de captura.');

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const rawDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedPreview(rawDataUrl);
    } catch (err: any) {
      console.warn('Erro ao capturar frame:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm and compress to 800px WebP
  const handleConfirm = async () => {
    if (!capturedPreview) return;
    try {
      setIsProcessing(true);
      const compressed = await compressImageToWebP(capturedPreview, 800, 0.82);
      onCapture(compressed);
      stopStream();
      onClose();
    } catch (err: any) {
      console.warn('Erro ao comprimir imagem:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedPreview(null);
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  };

  // Fallback file input upload
  const handleFallbackFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const compressed = await compressImageToWebP(file, 800, 0.82);
      onCapture(compressed);
      stopStream();
      onClose();
    } catch (err: any) {
      console.warn('Erro ao processar ficheiro fallback:', err);
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base text-zinc-100">{title}</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Preview Body */}
        <div className="relative aspect-4/3 bg-black flex items-center justify-center overflow-hidden">
          {capturedPreview ? (
            /* Still Capture Preview */
            <img
              src={capturedPreview}
              alt="Pré-visualização capturada"
              className="w-full h-full object-contain"
            />
          ) : hasCamera ? (
            /* Live Camera Feed */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Viewfinder Focus Target Guide */}
              <div className="absolute inset-8 border border-white/30 rounded-2xl pointer-events-none flex flex-col justify-between p-4">
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-t-2 border-l-2 border-emerald-400 rounded-tl-md" />
                  <div className="w-5 h-5 border-t-2 border-r-2 border-emerald-400 rounded-tr-md" />
                </div>
                <div className="text-center text-[10px] font-mono text-white/60 tracking-wider uppercase">
                  Enquadre o documento ou artigo
                </div>
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-b-2 border-l-2 border-emerald-400 rounded-bl-md" />
                  <div className="w-5 h-5 border-b-2 border-r-2 border-emerald-400 rounded-br-md" />
                </div>
              </div>
            </>
          ) : (
            /* No Camera / Permission Error Fallback */
            <div className="p-8 text-center space-y-4 max-w-sm">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-amber-400 flex items-center justify-center mx-auto border border-zinc-700">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-zinc-200">Câmara Indisponível</p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {cameraError || 'Não foi possível aceder à câmara deste dispositivo.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => fallbackInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs transition cursor-pointer"
              >
                <Upload className="w-4 h-4 text-zinc-700" />
                Carregar Imagem do Computador
              </button>
            </div>
          )}

          {/* Device switcher control (top-right overlay when live) */}
          {!capturedPreview && hasCamera && availableDevices.length > 1 && (
            <button
              type="button"
              onClick={toggleFacingMode}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-zinc-950/70 hover:bg-zinc-950 text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer"
              title="Trocar câmara"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}

          <input
            ref={fallbackInputRef}
            type="file"
            accept="image/*"
            onChange={handleFallbackFile}
            className="hidden"
          />
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-zinc-950/60 border-t border-zinc-800 flex items-center justify-between gap-4">
          {capturedPreview ? (
            /* Actions after Snap */
            <>
              <button
                type="button"
                onClick={handleRetake}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Repetir Foto
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-emerald-950/40"
              >
                <Check className="w-4 h-4" />
                <span>{isProcessing ? 'A otimizar (WebP)...' : 'Confirmar & Guardar'}</span>
              </button>
            </>
          ) : hasCamera ? (
            /* Live Camera Capture Controls */
            <>
              <button
                type="button"
                onClick={() => fallbackInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-semibold transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Carregar Ficheiro
              </button>

              <div className="flex items-center justify-center flex-1">
                <button
                  type="button"
                  onClick={handleSnap}
                  disabled={isProcessing}
                  className="w-14 h-14 rounded-full border-4 border-white/80 p-1 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                >
                  <div className="w-full h-full bg-white rounded-full shadow-md" />
                </button>
              </div>

              <div className="w-20 text-right text-[10px] font-mono text-zinc-500">
                100% Offline
              </div>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={() => {
                  stopStream();
                  onClose();
                }}
                className="px-4 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
