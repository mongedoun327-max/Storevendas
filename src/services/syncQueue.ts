export type SyncOperationType =
  | 'PRODUCT_UPSERT'
  | 'PRODUCT_DELETE'
  | 'SALE_INSERT'
  | 'SALE_CANCEL'
  | 'EXPENSE_UPSERT'
  | 'EXPENSE_DELETE'
  | 'WORK_ORDER_UPSERT'
  | 'CASH_SESSION_OPEN'
  | 'CASH_SESSION_CLOSE'
  | 'CASH_MOVEMENT';

export interface SyncQueueItem {
  id: string;
  type: SyncOperationType;
  payload: any;
  timestamp: string;
  attempts: number;
  lastError?: string;
}

const SYNC_QUEUE_KEY = 'masakula_offline_sync_queue_v1';
const SYNC_EVENT_NAME = 'masakula:sync-queue-updated';

export function getSyncQueue(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Erro ao ler fila de sincronização offline:', err);
  }
  return [];
}

export function getSyncQueueCount(): number {
  return getSyncQueue().length;
}

function notifyQueueUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, { detail: { count: getSyncQueueCount() } }));
  }
}

export function addToSyncQueue(operation: Omit<SyncQueueItem, 'id' | 'timestamp' | 'attempts'>): SyncQueueItem {
  const queue = getSyncQueue();
  const newItem: SyncQueueItem = {
    ...operation,
    id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    attempts: 0,
  };

  // If there's an existing upsert for the same product or expense, update or append
  const updatedQueue = [...queue, newItem];
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));
  } catch (err) {
    console.warn('Erro ao salvar item na fila de sincronização:', err);
  }
  notifyQueueUpdated();
  return newItem;
}

export function removeSyncQueueItem(id: string): void {
  const queue = getSyncQueue();
  const filtered = queue.filter(item => item.id !== id);
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Erro ao remover item da fila de sincronização:', err);
  }
  notifyQueueUpdated();
}

export function updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): void {
  const queue = getSyncQueue();
  const updated = queue.map(item => item.id === id ? { ...item, ...updates } : item);
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Erro ao atualizar item na fila de sincronização:', err);
  }
  notifyQueueUpdated();
}

export function clearSyncQueue(): void {
  try {
    localStorage.removeItem(SYNC_QUEUE_KEY);
  } catch (err) {
    console.warn('Erro ao limpar fila de sincronização:', err);
  }
  notifyQueueUpdated();
}

export function subscribeToSyncQueue(callback: (count: number) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback(getSyncQueueCount());
  window.addEventListener(SYNC_EVENT_NAME, handler);
  // Initial call
  callback(getSyncQueueCount());
  return () => window.removeEventListener(SYNC_EVENT_NAME, handler);
}
