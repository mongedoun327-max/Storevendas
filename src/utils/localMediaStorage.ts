import Dexie, { type Table } from 'dexie';

export interface LocalMediaItem {
  id: string;
  entityType: 'product' | 'order' | 'expense' | 'general';
  entityId: string;
  dataUrl: string; // WebP compressed data URL
  mimeType: string;
  sizeKb: number;
  width: number;
  height: number;
  caption?: string;
  createdAt: string;
}

class POSMediaDatabase extends Dexie {
  media!: Table<LocalMediaItem, string>;

  constructor() {
    super('WorscoiPOS_MediaDB');
    this.version(1).stores({
      media: 'id, entityType, entityId, createdAt',
    });
  }
}

export const mediaDb = new POSMediaDatabase();

if (typeof window !== "undefined") {
  mediaDb.open().catch((err) => {
    console.warn("[Database] WorscoiPOS_MediaDB initial open notice (handled safely):", err);
  });
}

/**
 * Client-Side Canvas WebP Compression Engine
 * 100% offline, zero network, zero external libraries.
 * Resizes proportional to maxDimension (default 800px) and converts to WebP.
 */
export async function compressImageToWebP(
  source: File | Blob | string,
  maxDimension: number = 800,
  quality: number = 0.82
): Promise<{ dataUrl: string; blob: Blob; sizeKb: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    let objectUrl: string | null = null;
    if (typeof source === 'string') {
      img.src = source;
    } else {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    }

    img.onerror = (err) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('Falha ao processar imagem para compressão.'));
    };

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Falha ao obter contexto 2D do Canvas.');
        }

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Try webp first, with jpeg fallback if webp unsupported
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        canvas.toBlob(
          (blob) => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            if (!blob) {
              reject(new Error('Falha ao gerar blob comprimido.'));
              return;
            }
            const sizeKb = Math.round((blob.size / 1024) * 10) / 10;
            resolve({
              dataUrl,
              blob,
              sizeKb,
              width,
              height,
            });
          },
          'image/webp',
          quality
        );
      } catch (err) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };
  });
}

/**
 * Save attachment to IndexedDB
 */
export async function saveMediaAttachment(
  entityType: 'product' | 'order' | 'expense' | 'general',
  entityId: string,
  compressed: { dataUrl: string; sizeKb: number; width: number; height: number },
  caption?: string
): Promise<LocalMediaItem> {
  const item: LocalMediaItem = {
    id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    entityType,
    entityId,
    dataUrl: compressed.dataUrl,
    mimeType: 'image/webp',
    sizeKb: compressed.sizeKb,
    width: compressed.width,
    height: compressed.height,
    caption: caption || '',
    createdAt: new Date().toISOString(),
  };

  await mediaDb.media.put(item);
  return item;
}

/**
 * Get all media attachments for a specific entity
 */
export async function getMediaAttachments(
  entityType: 'product' | 'order' | 'expense' | 'general',
  entityId: string
): Promise<LocalMediaItem[]> {
  try {
    return await mediaDb.media
      .where('entityId')
      .equals(entityId)
      .and((item) => item.entityType === entityType)
      .reverse()
      .sortBy('createdAt');
  } catch (err) {
    console.warn('Erro ao buscar mídia no IndexedDB:', err);
    return [];
  }
}

/**
 * Delete a media attachment by ID
 */
export async function deleteMediaAttachment(id: string): Promise<void> {
  try {
    await mediaDb.media.delete(id);
  } catch (err) {
    console.warn('Erro ao apagar mídia do IndexedDB:', err);
  }
}

/**
 * Get total media statistics
 */
export async function getMediaStats(): Promise<{ count: number; totalSizeKb: number }> {
  try {
    const all = await mediaDb.media.toArray();
    const count = all.length;
    const totalSizeKb = Math.round(all.reduce((sum, item) => sum + (item.sizeKb || 0), 0) * 10) / 10;
    return { count, totalSizeKb };
  } catch (err) {
    return { count: 0, totalSizeKb: 0 };
  }
}

/**
 * Export all media items for system backup (.json)
 */
export async function getAllMediaForBackup(): Promise<LocalMediaItem[]> {
  try {
    return await mediaDb.media.toArray();
  } catch (err) {
    console.warn('Erro ao ler todas as mídias para backup:', err);
    return [];
  }
}

/**
 * Restore media items from backup
 */
export async function restoreMediaFromBackup(items: LocalMediaItem[]): Promise<void> {
  try {
    if (Array.isArray(items) && items.length > 0) {
      await mediaDb.media.bulkPut(items);
    }
  } catch (err) {
    console.warn('Erro ao restaurar mídias no IndexedDB:', err);
  }
}

/**
 * Clear all media (for clean slate / reset)
 */
export async function clearAllMedia(): Promise<void> {
  try {
    await mediaDb.media.clear();
  } catch (err) {
    console.warn('Erro ao limpar mídias do IndexedDB:', err);
  }
}
