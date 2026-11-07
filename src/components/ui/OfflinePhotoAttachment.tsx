import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Trash2, 
  Eye, 
  X, 
  Image as ImageIcon,
  CheckCircle2,
  Maximize2
} from 'lucide-react';
import { OfflineCameraModal } from './OfflineCameraModal';
import { compressImageToWebP } from '../../utils/localMediaStorage';

interface OfflinePhotoAttachmentProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  label?: string;
  helperText?: string;
  allowCamera?: boolean;
}

export const OfflinePhotoAttachment: React.FC<OfflinePhotoAttachmentProps> = ({
  photos = [],
  onChange,
  maxPhotos = 4,
  label = 'Fotografias & Anexos Offline',
  helperText = 'As fotos são comprimidas em WebP e guardadas diretamente na memória do seu dispositivo',
  allowCamera = true,
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canAddMore = photos.length < maxPhotos;

  const handleProcessFile = async (file: File) => {
    if (!canAddMore) return;
    try {
      setIsCompressing(true);
      const compressed = await compressImageToWebP(file, 800, 0.82);
      onChange([...photos, compressed.dataUrl]);
    } catch (err: any) {
      console.warn('Erro ao comprimir imagem anexada:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (photos.length < maxPhotos) {
        await handleProcessFile(file);
      }
    }
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        await handleProcessFile(file);
      }
    }
  };

  const handleCameraCapture = (compressed: { dataUrl: string }) => {
    if (photos.length < maxPhotos) {
      onChange([...photos, compressed.dataUrl]);
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    onChange(photos.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-3">
      {/* Label and Helper */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold text-zinc-900">
            {label} ({photos.length}/{maxPhotos})
          </label>
          <p className="text-[11px] text-zinc-400 mt-0.5">{helperText}</p>
        </div>
        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          100% Offline (WebP)
        </span>
      </div>

      {/* Grid of thumbnails & Dropzone */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Existing photos thumbnails */}
        {photos.map((photoUrl, idx) => (
          <div
            key={idx}
            className="group relative aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-zinc-100 shadow-xs"
          >
            <img
              src={photoUrl}
              alt={`Foto ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Overlay Actions on Hover/Touch */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setLightboxPhoto(photoUrl)}
                className="p-1.5 rounded-xl bg-white/90 text-zinc-900 hover:bg-white transition-colors cursor-pointer"
                title="Ampliar foto"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleRemovePhoto(idx)}
                className="p-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition-colors cursor-pointer"
                title="Remover foto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {/* Index label */}
            <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-[9px] font-mono text-white">
              #{idx + 1}
            </div>
          </div>
        ))}

        {/* Add photo dropzone card */}
        {canAddMore && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-3 text-center transition-all ${
              isDragOver
                ? 'border-emerald-500 bg-emerald-50/50'
                : 'border-gray-200 bg-zinc-50/80 hover:bg-zinc-100 hover:border-gray-300'
            }`}
          >
            {isCompressing ? (
              <div className="space-y-1">
                <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <span className="text-[10px] font-bold text-zinc-600">A comprimir...</span>
              </div>
            ) : (
              <div className="space-y-2 w-full flex flex-col items-center justify-center">
                <div className="flex items-center gap-1.5">
                  {allowCamera && (
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="p-2 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 transition cursor-pointer shadow-xs"
                      title="Tirar foto com câmara"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-xl bg-white border border-gray-200 text-zinc-700 hover:bg-zinc-100 transition cursor-pointer shadow-xs"
                    title="Carregar ficheiro do computador"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-[10px] text-zinc-500">
                  <span className="font-semibold text-zinc-800">Câmara</span> ou <span className="font-semibold text-zinc-800">Ficheiro</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={maxPhotos > 1}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Offline Camera Modal */}
      <OfflineCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        title="Fotografar para Anexo Offline"
        subtitle="Imagem processada e gravada localmente sem conexão de internet"
      />

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div 
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-3xl max-h-[90vh] rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800">
              <span className="text-xs font-mono text-zinc-400">Visualização de Foto Offline</span>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black">
              <img
                src={lightboxPhoto}
                alt="Foto ampliada"
                className="max-h-[75vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
