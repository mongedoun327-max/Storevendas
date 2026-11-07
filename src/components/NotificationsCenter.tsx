import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, AlertTriangle, Clock, AlertCircle, 
  CheckCircle, ChevronRight, X, Package, RefreshCw 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export interface AlertItem {
  id: string;
  name: string;
  category: string;
  type: 'STOCK_CRITICAL' | 'EXPIRING_SOON' | 'EXPIRED';
  message: string;
  detail: string;
}

interface NotificationsCenterProps {
  onNavigateToProducts?: () => void;
}

export default function NotificationsCenter({ onNavigateToProducts }: NotificationsCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAlerts();

    // Sincronização em tempo real quando produtos forem atualizados (canal com ID único para evitar colisão entre instâncias)
    const channelName = `realtime-notifications-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchAlerts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, category, stock, min_stock, expiration_date');

      if (error || !products) {
        setLoading(false);
        return;
      }

      const compiledAlerts: AlertItem[] = [];
      const today = new Date();
      const alertThresholdDate = new Date();
      alertThresholdDate.setDate(today.getDate() + 30); // 30 dias de aviso prévio

      products.forEach((prod) => {
        const currentStock = prod.stock ?? 0;
        const minStock = prod.min_stock ?? 5;

        // 1. Verificação de Estoque Crítico
        if (currentStock <= minStock) {
          compiledAlerts.push({
            id: `${prod.id}-stock`,
            name: prod.name,
            category: prod.category || 'Geral',
            type: 'STOCK_CRITICAL',
            message: 'Estoque Mínimo Atingido',
            detail: `Apenas ${currentStock} unidade(s) em estoque (Mínimo: ${minStock})`
          });
        }

        // 2. Verificação de Validade
        if (prod.expiration_date) {
          const expDate = new Date(prod.expiration_date);

          if (expDate < today) {
            compiledAlerts.push({
              id: `${prod.id}-expired`,
              name: prod.name,
              category: prod.category || 'Geral',
              type: 'EXPIRED',
              message: 'Produto Vencido',
              detail: `Venceu em ${expDate.toLocaleDateString('pt-PT')}`
            });
          } else if (expDate <= alertThresholdDate) {
            const daysRemaining = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
            compiledAlerts.push({
              id: `${prod.id}-expiring`,
              name: prod.name,
              category: prod.category || 'Geral',
              type: 'EXPIRING_SOON',
              message: 'Validade Próxima do Fim',
              detail: `Vence em ${daysRemaining} dia(s) (${expDate.toLocaleDateString('pt-PT')})`
            });
          }
        }
      });

      setAlerts(compiledAlerts);
    } catch (err) {
      console.warn('Erro ao verificar alertas de estoque/validade:', err);
    } finally {
      setLoading(false);
    }
  };

  const criticalCount = alerts.filter(a => a.type === 'STOCK_CRITICAL' || a.type === 'EXPIRED').length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão Gatilho com Badge de Notificação */}
      <button
        type="button"
        id="btn-notifications-center"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative p-2.5 bg-white border border-gray-200 rounded-2xl hover:bg-zinc-50 transition shadow-xs flex items-center justify-center cursor-pointer"
        title="Central de Alertas"
      >
        <div className="transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-12">
          <Bell size={18} className="text-zinc-700" />
        </div>
        {alerts.length > 0 && (
          <span className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-white ${
            criticalCount > 0 ? 'bg-red-600 animate-pulse' : 'bg-amber-500'
          }`}>
            {alerts.length}
          </span>
        )}
      </button>

      {/* Drawer / Popup de Notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-gray-100 rounded-3xl shadow-2xl z-50 overflow-hidden text-zinc-950 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Cabeçalho */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-zinc-50/70">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              <h3 className="font-bold text-sm text-zinc-900">Alertas de Estoque & Validade</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={fetchAlerts}
                className="group p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg transition-colors cursor-pointer"
                title="Recarregar alertas"
              >
                <div className="transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-12">
                  <RefreshCw size={14} className={loading ? 'animate-spin text-zinc-950' : ''} />
                </div>
              </button>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="group p-1.5 text-zinc-400 hover:text-zinc-950 rounded-lg transition-colors cursor-pointer"
                title="Fechar"
              >
                <div className="transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-12">
                  <X size={16} />
                </div>
              </button>
            </div>
          </div>

          {/* Lista de Alertas */}
          <div className="max-h-[380px] overflow-y-auto p-3 space-y-2">
            {loading ? (
              <p className="text-center py-8 text-xs text-zinc-400 font-medium">A analisar estoque e validades...</p>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <CheckCircle size={32} className="text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-zinc-800">Tudo em dia!</p>
                <p className="text-[11px] text-zinc-400">Nenhum produto em nível crítico ou próximo do vencimento.</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => {
                    if (onNavigateToProducts) {
                      onNavigateToProducts();
                      setIsOpen(false);
                    }
                  }}
                  className={`p-3 rounded-2xl border text-xs flex items-start gap-3 transition-colors ${
                    onNavigateToProducts ? 'cursor-pointer hover:shadow-xs' : ''
                  } ${
                    alert.type === 'EXPIRED' 
                      ? 'bg-rose-50 border-rose-100 text-rose-900 hover:bg-rose-100/60' 
                      : alert.type === 'STOCK_CRITICAL' 
                      ? 'bg-amber-50 border-amber-100 text-amber-900 hover:bg-amber-100/60' 
                      : 'bg-orange-50 border-orange-100 text-orange-900 hover:bg-orange-100/60'
                  }`}
                >
                  <div className="p-2 rounded-xl shrink-0 mt-0.5 bg-white/80 shadow-xs">
                    {alert.type === 'STOCK_CRITICAL' && <Package size={16} className="text-amber-600" />}
                    {alert.type === 'EXPIRING_SOON' && <Clock size={16} className="text-orange-600" />}
                    {alert.type === 'EXPIRED' && <AlertCircle size={16} className="text-rose-600" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[10px] uppercase tracking-wider opacity-80">
                        {alert.message}
                      </span>
                      <span className="text-[9px] bg-white/80 px-2 py-0.5 rounded-md font-bold truncate">
                        {alert.category}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs truncate mt-0.5 text-zinc-950">{alert.name}</h4>
                    <p className="text-[11px] mt-0.5 font-medium opacity-90">{alert.detail}</p>
                  </div>

                  {onNavigateToProducts && (
                    <ChevronRight size={14} className="opacity-40 self-center shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Rodapé */}
          <div className="p-3 border-t border-gray-100 bg-zinc-50/60 text-center flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 font-medium">
              Sincronizado via Supabase Realtime
            </span>
            {onNavigateToProducts && alerts.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onNavigateToProducts();
                  setIsOpen(false);
                }}
                className="group text-[11px] font-bold text-zinc-900 hover:underline cursor-pointer"
              >
                <span className="inline-block transition-transform duration-200 group-hover:scale-105 group-hover:-rotate-3">
                  Gerir Estoque
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { NotificationsCenter };
