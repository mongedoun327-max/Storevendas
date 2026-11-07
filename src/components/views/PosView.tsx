import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Barcode, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  Send, 
  User, 
  UserPlus,
  CheckCircle2, 
  Printer, 
  X,
  Receipt,
  Percent,
  Keyboard,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Building2,
  Smartphone,
  Check,
  Tag,
  SlidersHorizontal,
  Package,
  RotateCcw,
  ShieldAlert,
  Flame,
  LayoutGrid,
  List,
  PauseCircle,
  Coins,
  History,
  Volume2,
  VolumeX,
  Layers,
  ArrowRight,
  Clock,
  Scan,
  ChevronDown,
  MoreHorizontal,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { Product, CartItem, PaymentMethod, SaleTransaction, Customer, CompanySettings } from '../../types';
import { formatKz, formatDateTime } from '../../utils/formatters';
import { supabaseService } from '../../services/supabaseService';
import { loadStoredSettings } from '../../utils/storage';
import { subscribeToSyncQueue } from '../../services/syncQueue';
import { syncAllWithSupabase } from '../../services/syncEngine';
import { ThermalReceipt } from '../ThermalReceipt';
import SaleFeedbackModal from '../SaleFeedbackModal';
import CrossSellBanner, { SuggestedProduct } from '../CrossSellBanner';
import { useAuth } from '../../contexts/AuthContext';
import { ManagerAuthModal } from '../auth/ManagerAuthModal';
import { TopProductsCarousel } from './TopProductsCarousel';
import { PosShortcutsModal } from '../pdv/PosShortcutsModal';
import { PosHeldSalesDrawer, HeldSale } from '../pdv/PosHeldSalesDrawer';
import { PosRecentSalesDrawer } from '../pdv/PosRecentSalesDrawer';
import { PosQuickCustomerModal } from '../pdv/PosQuickCustomerModal';
import { PosQuickMovementModal } from '../pdv/PosQuickMovementModal';
import { hardwareService } from '../../services/hardwareIntegration';
import { HardwareDevicesModal } from '../pdv/HardwareDevicesModal';
import { NotificationsCenter } from '../NotificationsCenter';
import { PWAInstallButton } from '../pdv/PWAInstallButton';

interface PosViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  sales: SaleTransaction[];
  setSales: React.Dispatch<React.SetStateAction<SaleTransaction[]>>;
  customers: Customer[];
  setCustomers?: React.Dispatch<React.SetStateAction<Customer[]>>;
  settings?: CompanySettings;
  setActiveTab?: (tab: any) => void;
}

// Web Audio API scanner beep synthesizer for authentic POS feedback
function playPosAudio(type: 'beep' | 'success' | 'cash' | 'error' = 'beep') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'beep') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } else if (type === 'success' || type === 'cash') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    }
  } catch {
    // Audio might be blocked until user gesture
  }
}

export const PosView: React.FC<PosViewProps> = ({
  products,
  setProducts,
  sales,
  setSales,
  customers,
  setCustomers,
  settings,
  setActiveTab,
}) => {
  const companySettings = useMemo(() => settings || loadStoredSettings(), [settings]);

  // Input search & barcode scanner state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showHighlights, setShowHighlights] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => companySettings.soundAlerts !== false);

  // Offline / Real-time Sync State
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const unsub = subscribeToSyncQueue((count) => setPendingSyncCount(count));
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsub();
    };
  }, []);

  const handlePosManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncAllWithSupabase();
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.info(res.message);
      }
    } catch {
      toast.error('Erro ao sincronizar.');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (companySettings.soundAlerts !== undefined) {
      setSoundEnabled(companySettings.soundAlerts);
    }
  }, [companySettings.soundAlerts]);

  // Active Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerNif, setCustomerNif] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');

  // Held (Parked) Sales State
  const [heldSales, setHeldSales] = useState<HeldSale[]>(() => {
    try {
      const saved = localStorage.getItem('masakula_pos_held_sales');
      if (saved) return JSON.parse(saved);
    } catch {
      //
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('masakula_pos_held_sales', JSON.stringify(heldSales));
    } catch {
      //
    }
  }, [heldSales]);

  // Modals & Drawers State
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isHeldSalesOpen, setIsHeldSalesOpen] = useState(false);
  const [isRecentSalesOpen, setIsRecentSalesOpen] = useState(false);
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [isQuickMovementOpen, setIsQuickMovementOpen] = useState(false);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [isCaixaMenuOpen, setIsCaixaMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isCustomerSelectOpen, setIsCustomerSelectOpen] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);

  // Toast Banner
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Sale Feedback Modal (Happy/Sad Bag)
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    type: 'SUCCESS' | 'CANCELED' | null;
    totalAmount: number;
    changeAmount: number;
  }>({
    isOpen: false,
    type: null,
    totalAmount: 0,
    changeAmount: 0,
  });

  // Card click micro-animations & image error handlers
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Record<string, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Checkout & Payment Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [paymentDocRef, setPaymentDocRef] = useState<string>('');
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitCashAmount, setSplitCashAmount] = useState<string>('');
  const [splitSecondaryMethod, setSplitSecondaryMethod] = useState<'multicaixa' | 'express' | 'transfer'>('multicaixa');

  const [lastCompletedSale, setLastCompletedSale] = useState<SaleTransaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Authentication & Refund Protection State
  const { profile } = useAuth();
  const [isManagerAuthOpen, setIsManagerAuthOpen] = useState(false);
  const [pendingRefundSale, setPendingRefundSale] = useState<SaleTransaction | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);

  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Search Input Ref
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus barcode input
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Sound helper
  const triggerAudio = (type: 'beep' | 'success' | 'cash' | 'error') => {
    if (soundEnabled) {
      playPosAudio(type);
    }
  };

  // Toast feedback helper
  const showFeedback = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedbackToast({ message, type });
    const timer = setTimeout(() => setFeedbackToast(null), 3000);
    return () => clearTimeout(timer);
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered products catalog
  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      if (!matchesCategory) return false;

      if (stockFilter === 'in_stock' && p.stock <= 0) return false;
      if (stockFilter === 'low_stock' && (p.stock <= 0 || p.stock > p.minStock)) return false;

      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.barcode.includes(term) ||
        (p.category && p.category.toLowerCase().includes(term))
      );
    });
  }, [products, searchTerm, selectedCategory, stockFilter]);

  // Add Product to Cart
  const addToCart = (product: Product, quantityToAdd: number = 1) => {
    if (product.stock <= 0) {
      triggerAudio('error');
      showFeedback(`Produto "${product.name}" sem stock em armazém!`, 'error');
      return false;
    }

    let addedSuccessfully = true;

    setCart((prev) => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const nextQty = existing.quantity + quantityToAdd;
        if (!companySettings.allowNegativeStock && nextQty > product.stock) {
          triggerAudio('error');
          showFeedback(`Limite de stock atingido (${product.stock} ${product.unit}).`, 'error');
          addedSuccessfully = false;
          return prev;
        }
        triggerAudio('beep');
        showFeedback(`+1 "${product.name}" no carrinho (Total: ${nextQty})`, 'success');
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: nextQty } 
            : item
        );
      }
      if (!companySettings.allowNegativeStock && product.stock <= 0) {
        triggerAudio('error');
        showFeedback(`Artigo "${product.name}" sem estoque disponível no momento.`, 'error');
        addedSuccessfully = false;
        return prev;
      }
      triggerAudio('beep');
      showFeedback(`"${product.name}" adicionado ao carrinho!`, 'success');
      return [...prev, { product, quantity: quantityToAdd }];
    });

    if (addedSuccessfully) {
      setRecentlyAddedIds(prev => ({ ...prev, [product.id]: true }));
      setTimeout(() => {
        setRecentlyAddedIds(prev => ({ ...prev, [product.id]: false }));
      }, 1200);
    }

    return addedSuccessfully;
  };

  // Escuta permanente do Aparelho de Bipar (Scanner de Código de Barras Físico)
  useEffect(() => {
    const unsubscribe = hardwareService.onScan((scannedCode) => {
      setLastScannedBarcode(scannedCode);
      const code = scannedCode.trim();
      if (!code) return;

      // Localiza produto pelo código de barras de fábrica exato contido no produto
      const match = products.find(p => p.barcode === code) ||
                    products.find(p => p.sku && p.sku.toLowerCase() === code.toLowerCase());

      if (match) {
        addToCart(match);
        showFeedback(`Bip capturado: "${match.name}" adicionado ao carrinho!`, 'success');
      } else {
        triggerAudio('error');
        showFeedback(`Código de fábrica "${code}" não encontrado no catálogo.`, 'error');
      }
    });

    return () => unsubscribe();
  }, [products]);
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (!companySettings.allowNegativeStock && newQty > item.product.stock) {
            triggerAudio('error');
            showFeedback(`Stock disponível: apenas ${item.product.stock} ${item.product.unit}`, 'error');
            return item;
          }
          triggerAudio('beep');
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  // Direct Quantity Change
  const setDirectQuantity = (productId: string, qty: number) => {
    setCart((prev) => {
      return prev.map(item => {
        if (item.product.id === productId) {
          if (qty <= 0) return null;
          const cappedQty = Math.min(qty, item.product.stock);
          if (qty > item.product.stock) {
            triggerAudio('error');
            showFeedback(`Ajustado para o máximo em stock (${item.product.stock})`, 'info');
          }
          return { ...item, quantity: cappedQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  // Remove from Cart
  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Hold (Park) Current Sale
  const handleHoldCurrentSale = () => {
    if (cart.length === 0) {
      showFeedback('Adicione itens ao carrinho antes de colocar a venda em espera.', 'info');
      return;
    }

    const newHeld: HeldSale = {
      id: `held-${Date.now()}`,
      heldAt: new Date().toISOString(),
      customerName: customerName.trim() || 'Consumidor Final',
      customerNif: customerNif.trim() || undefined,
      items: [...cart],
      subtotal,
      discount: discountAmount,
      total: totalPayable,
    };

    setHeldSales(prev => [newHeld, ...prev]);
    setCart([]);
    setCustomerName('');
    setCustomerNif('');
    setSelectedCustomerId(null);
    setGlobalDiscount(0);
    triggerAudio('success');
    showFeedback(`Venda de ${formatKz(totalPayable)} colocada em espera com sucesso!`, 'info');
    searchInputRef.current?.focus();
  };

  // Resume Held Sale
  const handleResumeHeldSale = (held: HeldSale) => {
    if (cart.length > 0) {
      if (!window.confirm('Existe um carrinho em aberto. Deseja substituir pelo atendimento em espera?')) {
        return;
      }
    }

    setCart(held.items);
    setCustomerName(held.customerName === 'Consumidor Final' ? '' : held.customerName);
    setCustomerNif(held.customerNif || '');
    setGlobalDiscount(held.discount > 0 ? (held.discount / held.subtotal) * 100 : 0);
    setHeldSales(prev => prev.filter(h => h.id !== held.id));
    setIsHeldSalesOpen(false);
    triggerAudio('success');
    showFeedback(`Venda de ${held.customerName} retomada no caixa!`, 'success');
  };

  // Delete Held Sale
  const handleDeleteHeldSale = (heldId: string) => {
    setHeldSales(prev => prev.filter(h => h.id !== heldId));
    showFeedback('Venda em espera removida.', 'info');
  };

  // Quick Customer Selection
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setCustomerName(customer.name);
    setCustomerNif(customer.nifOrBi || '');
    showFeedback(`Cliente "${customer.name}" associado à venda.`, 'success');
  };

  const handleClearCustomer = () => {
    setSelectedCustomerId(null);
    setCustomerName('');
    setCustomerNif('');
  };

  const handleSaveQuickCustomer = (newCust: Customer) => {
    if (setCustomers) {
      setCustomers(prev => [newCust, ...prev]);
    }
    handleSelectCustomer(newCust);
  };

  // Cancel Current Sale Before Payment
  const handleCancelOrderBeforeSale = () => {
    if (cart.length === 0 && !isCheckoutOpen) return;
    const currentTotal = totalPayable;
    setCart([]);
    setIsCheckoutOpen(false);
    setCashGiven('');
    setPaymentDocRef('');
    setIsSplitPayment(false);
    setGlobalDiscount(0);
    handleClearCustomer();

    setFeedbackModal({
      isOpen: true,
      type: 'CANCELED',
      totalAmount: currentTotal,
      changeAmount: 0,
    });
    triggerAudio('error');
    showFeedback('Atendimento cancelado e caixa pronto para nova venda.', 'info');
    searchInputRef.current?.focus();
  };

  const clearCart = handleCancelOrderBeforeSale;

  // Post-Sale Refund with Manager Authorization
  const handleRequestRefund = (sale: SaleTransaction) => {
    if (sale.status === 'canceled') {
      showFeedback('Esta venda já se encontra cancelada / estornada.', 'error');
      return;
    }

    if (profile?.role === 'GERENTE') {
      if (window.confirm(`Confirma o estorno da venda ${sale.invoiceNumber}? Os produtos serão devolvidos ao estoque e a venda marcada como CANCELED no banco de dados.`)) {
        executeRefund(sale);
      }
    } else {
      setPendingRefundSale(sale);
      setIsManagerAuthOpen(true);
    }
  };

  const executeRefund = async (sale: SaleTransaction) => {
    setIsRefunding(true);
    try {
      // 1. Return stock locally
      setProducts(prevProducts => {
        return prevProducts.map(prod => {
          const soldItem = sale.items.find(item => item.product.id === prod.id);
          if (soldItem) {
            const newStock = prod.stock + soldItem.quantity;
            return {
              ...prod,
              stock: newStock,
              status: (newStock <= 0 ? 'out_of_stock' : newStock <= prod.minStock ? 'low_stock' : 'active') as any
            };
          }
          return prod;
        });
      });

      // 2. Mark as canceled locally
      setSales(prevSales => prevSales.map(s => s.id === sale.id ? { ...s, status: 'canceled' } : s));

      if (lastCompletedSale && lastCompletedSale.id === sale.id) {
        setLastCompletedSale(prev => prev ? { ...prev, status: 'canceled' } : null);
      }

      // 3. Sync with Supabase
      await supabaseService.cancelOrRefundSale(
        sale.id,
        sale.items.map(item => ({ productId: item.product.id, quantity: item.quantity })),
        `Estorno autorizado por ${profile?.full_name || 'Gerente'}`
      );

      triggerAudio('success');
      showFeedback(`Estorno da Venda ${sale.invoiceNumber} efetuado com sucesso! Estoque reposto.`, 'success');
    } catch (err) {
      console.error('Erro ao processar estorno:', err);
      showFeedback('Erro ao comunicar estorno com o banco de dados.', 'error');
    } finally {
      setIsRefunding(false);
      setPendingRefundSale(null);
      setIsManagerAuthOpen(false);
    }
  };

  // Barcode / Enter Handler in Search Field
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = searchTerm.trim();
      if (!code) return;

      // 1. Check exact barcode match
      const exactBarcode = products.find(p => p.barcode === code);
      if (exactBarcode) {
        addToCart(exactBarcode);
        setSearchTerm('');
        return;
      }

      // 2. Check exact SKU match
      const exactSku = products.find(p => p.sku.toLowerCase() === code.toLowerCase());
      if (exactSku) {
        addToCart(exactSku);
        setSearchTerm('');
        return;
      }

      // 3. Top filtered match
      if (filteredProducts.length > 0) {
        addToCart(filteredProducts[0]);
        setSearchTerm('');
      } else {
        triggerAudio('error');
        showFeedback(`Código ou produto "${code}" não encontrado.`, 'error');
      }
    }
  };

  // Global Keyboard Shortcuts (F1 to F10, ESC) & Deterministic HID Barcode Wedge
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = 0;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. Process Hardware Barcode Scanner Wedge (Burst input < 50ms)
      const now = Date.now();
      const interval = now - lastKeyTime;
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 3 && interval < 60) {
          const code = barcodeBuffer.trim();
          barcodeBuffer = '';
          const match = products.find(p => p.barcode === code) ||
                        products.find(p => p.sku && p.sku.toLowerCase() === code.toLowerCase());
          if (match) {
            e.preventDefault();
            addToCart(match);
            showFeedback(`Artigo "${match.name}" lido via leitor [${code}]!`, 'success');
            return;
          }
        }
        barcodeBuffer = '';
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (interval > 60) {
          barcodeBuffer = e.key;
        } else {
          barcodeBuffer += e.key;
        }
      }

      // F1: Ajuda / Guia de Atalhos
      if (e.key === 'F1') {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
        return;
      }

      // F2 ou F3: Focar campo de Busca e Leitor de Código de Barras
      if (e.key === 'F2' || e.key === 'F3') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        showFeedback('Leitor de código de barras focado [F2]', 'info');
        return;
      }

      // F4: Cliente Rápido / Selecionar Cliente
      if (e.key === 'F4') {
        e.preventDefault();
        setIsCustomerSelectOpen(true);
        return;
      }

      // F6 ou F7: Focar Campo de Desconto
      if (e.key === 'F6' || e.key === 'F7') {
        e.preventDefault();
        const discInput = document.getElementById('pos-discount-input') as HTMLInputElement | null;
        if (discInput) {
          discInput.focus();
          discInput.select();
          showFeedback('Campo de desconto selecionado [F7]', 'info');
        }
        return;
      }

      // F8: Venda em Espera (Se houver carrinho coloca em espera; senão abre gaveta)
      if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) {
          handleHoldCurrentSale();
        } else {
          setIsHeldSalesOpen(prev => !prev);
        }
        return;
      }

      // F9 ou Ctrl+Espaço: Cobrar (Ação primária de checkout)
      if (e.key === 'F9' || (e.ctrlKey && e.code === 'Space')) {
        e.preventDefault();
        if (cart.length > 0 && !isCheckoutOpen && !lastCompletedSale) {
          setIsCheckoutOpen(true);
        } else if (cart.length === 0) {
          showFeedback('Adicione produtos ao carrinho antes de cobrar [F9].', 'error');
        }
        return;
      }

      // F10: Histórico de Vendas Recentes
      if (e.key === 'F10') {
        e.preventDefault();
        setIsRecentSalesOpen(prev => !prev);
        return;
      }

      // ESC: Fechar janelas modais / Limpar foco
      if (e.key === 'Escape') {
        if (isCustomerSelectOpen) {
          setIsCustomerSelectOpen(false);
        } else if (isCaixaMenuOpen) {
          setIsCaixaMenuOpen(false);
        } else if (isMoreMenuOpen) {
          setIsMoreMenuOpen(false);
        } else if (isCheckoutOpen) {
          setIsCheckoutOpen(false);
          searchInputRef.current?.focus();
        } else if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
        } else if (isHeldSalesOpen) {
          setIsHeldSalesOpen(false);
        } else if (isRecentSalesOpen) {
          setIsRecentSalesOpen(false);
        } else if (isQuickCustomerOpen) {
          setIsQuickCustomerOpen(false);
        } else if (isQuickMovementOpen) {
          setIsQuickMovementOpen(false);
        } else if (lastCompletedSale) {
          setLastCompletedSale(null);
          searchInputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [cart, isCheckoutOpen, lastCompletedSale, isShortcutsOpen, isHeldSalesOpen, isRecentSalesOpen, isQuickCustomerOpen, isQuickMovementOpen, isCustomerSelectOpen, isCaixaMenuOpen, isMoreMenuOpen, products]);

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.salePrice * item.quantity), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      return (subtotal * globalDiscount) / 100;
    }
    return Math.min(subtotal, globalDiscount);
  }, [subtotal, globalDiscount, discountType]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = 0; // Regime de Exclusão / Sem IVA
  const totalPayable = taxableAmount;

  const cashGivenNum = parseFloat(cashGiven) || 0;
  const splitCashNum = parseFloat(splitCashAmount) || 0;
  const splitRemainingDue = Math.max(0, totalPayable - splitCashNum);

  const changeDue = isSplitPayment 
    ? Math.max(0, cashGivenNum - splitCashNum) 
    : Math.max(0, cashGivenNum - totalPayable);

  const isCashInsufficient = !isSplitPayment 
    ? (selectedPayment === 'cash' && cashGivenNum > 0 && cashGivenNum < totalPayable)
    : (cashGivenNum > 0 && cashGivenNum < splitCashNum);

  // Preset quick cash denominations (Kz)
  const quickCashPresets = [
    { label: 'Exato', value: isSplitPayment ? splitCashNum : totalPayable },
    { label: '+500 Kz', add: 500 },
    { label: '+1.000 Kz', add: 1000 },
    { label: '+2.000 Kz', add: 2000 },
    { label: '+5.000 Kz', add: 5000 },
    { label: '+10.000 Kz', add: 10000 },
    { label: '+20.000 Kz', add: 20000 },
  ];

  // Dynamic Cross-Sell Suggestion
  const crossSellSuggestion: SuggestedProduct | null = useMemo(() => {
    if (cart.length === 0) return null;
    const cartProductIds = new Set(cart.map((item) => item.product.id));
    
    const candidate = products.find(
      (p) => !cartProductIds.has(p.id) && p.stock > 0
    );

    if (!candidate) return null;

    return {
      id: candidate.id,
      name: candidate.name,
      price: candidate.salePrice,
    };
  }, [cart, products]);

  const handleAddCrossSell = (suggested: SuggestedProduct) => {
    const productToAdd = products.find((p) => p.id === suggested.id);
    if (productToAdd) {
      addToCart(productToAdd, 1);
    }
  };

  // Complete Sale & Process Transaction
  const handleCompleteSale = async () => {
    if (cart.length === 0 || isSubmitting) return;

    if (!isSplitPayment && selectedPayment === 'cash' && cashGivenNum < totalPayable) {
      triggerAudio('error');
      alert('O valor entregue em dinheiro é inferior ao total da venda!');
      return;
    }

    if (isSplitPayment && splitCashNum + splitRemainingDue < totalPayable) {
      triggerAudio('error');
      alert('O somatório do pagamento dividido não cobre o valor total da venda!');
      return;
    }

    setIsSubmitting(true);

    const nextInvoiceNum = `FT MAS26/${String(sales.length + 485).padStart(5, '0')}`;
    
    const newSale: SaleTransaction = {
      id: `sale-${Date.now()}`,
      invoiceNumber: nextInvoiceNum,
      customerName: customerName.trim() || 'Consumidor Final',
      customerNif: customerNif.trim() || undefined,
      items: [...cart],
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total: totalPayable,
      paymentMethod: isSplitPayment ? 'mixed' : selectedPayment,
      cashierName: profile?.full_name || 'Adilson Silva (Operador 01)',
      createdAt: new Date().toISOString(),
      status: 'paid',
    };

    // 1. Deduct stock locally
    const updatedProducts = products.map(prod => {
      const soldItem = cart.find(ci => ci.product.id === prod.id);
      if (soldItem) {
        const newStock = Math.max(0, prod.stock - soldItem.quantity);
        supabaseService.updateProductStock(prod.id, newStock).catch(err => console.warn('Supabase stock sync:', err));
        return {
          ...prod,
          stock: newStock,
          status: (newStock === 0 ? 'out_of_stock' : newStock <= prod.minStock ? 'low_stock' : 'active') as any,
        };
      }
      return prod;
    });

    setProducts(updatedProducts);
    setSales(prev => [newSale, ...prev]);

    // Atualiza compras e valor gasto do cliente
    if (setCustomers) {
      setCustomers(prevCustomers => {
        let matched = false;
        const targetName = customerName.trim().toLowerCase();
        const targetNif = customerNif.trim().toLowerCase();

        const updated = prevCustomers.map(cust => {
          const isMatch = (selectedCustomerId && cust.id === selectedCustomerId) ||
            (targetNif && cust.nifOrBi && cust.nifOrBi.trim().toLowerCase() === targetNif) ||
            (targetName && targetName !== 'consumidor final' && cust.name.trim().toLowerCase() === targetName);
          
          if (isMatch) {
            matched = true;
            return {
              ...cust,
              totalOrders: (cust.totalOrders || 0) + 1,
              totalSpent: (cust.totalSpent || 0) + totalPayable,
              lastPurchaseDate: new Date().toISOString().split('T')[0],
            };
          }
          return cust;
        });

        // Se for cliente nominal que ainda não existia no cadastro, cria-o automaticamente
        if (!matched && targetName && targetName !== 'consumidor final') {
          const newCustomer: Customer = {
            id: `cust-${Date.now()}`,
            name: customerName.trim(),
            nifOrBi: customerNif.trim() || '',
            email: '',
            phone: '',
            city: 'Luanda',
            totalOrders: 1,
            totalSpent: totalPayable,
            status: 'active',
            lastPurchaseDate: new Date().toISOString().split('T')[0],
          };
          return [newCustomer, ...updated];
        }

        return updated;
      });
    }

    // 2. Sync sale to Supabase
    supabaseService.insertSale(newSale, {
      amountPaid: selectedPayment === 'cash' ? (cashGivenNum || totalPayable) : totalPayable,
      changeGiven: selectedPayment === 'cash' ? changeDue : 0,
    }).catch(err => console.warn('Supabase sale insert:', err));

    // 3. Finalize UI
    triggerAudio('cash');
    setLastCompletedSale(newSale);
    setFeedbackModal({
      isOpen: true,
      type: 'SUCCESS',
      totalAmount: totalPayable,
      changeAmount: selectedPayment === 'cash' ? changeDue : 0,
    });
    setCart([]);
    setIsCheckoutOpen(false);
    setCashGiven('');
    setPaymentDocRef('');
    setIsSplitPayment(false);
    setGlobalDiscount(0);
    handleClearCustomer();
    setIsSubmitting(false);

    showFeedback(`Venda finalizada com sucesso (${newSale.invoiceNumber})`, 'success');
  };

  // Payment methods
  const paymentMethods: { id: PaymentMethod; label: string; sub: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: 'cash', label: 'Dinheiro', sub: 'Numerário Kz', icon: Banknote },
    { id: 'multicaixa', label: 'Multicaixa TPA', sub: 'Cartão de Débito', icon: CreditCard },
    { id: 'express', label: 'Multicaixa Express', sub: 'Telemóvel / App', icon: Smartphone },
    { id: 'transfer', label: 'Transferência', sub: 'IBAN Bancário', icon: Building2 },
  ];

  return (
    <div id="view-pos" className="flex flex-1 flex-col h-screen overflow-hidden bg-[#F6F6F7] select-none animate-in fade-in duration-200">
      {/* Dynamic Notification Toast */}
      {feedbackToast && (
        <div 
          className={`fixed top-4 right-8 z-50 px-4 py-2.5 rounded-2xl shadow-xl border text-xs font-black flex items-center gap-2 animate-in slide-in-from-top-3 duration-150 ${
            feedbackToast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : feedbackToast.type === 'info'
              ? 'bg-zinc-950 border-zinc-800 text-white'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}
        >
          {feedbackToast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* 1. BARRA SUPERIOR (56px, tudo numa linha fundida com o header) */}
      <header className="h-14 px-4 bg-white border-b border-neutral-200/80 flex items-center justify-between shrink-0 select-none z-20">
        {/* Esquerda: ⬛ Vendas & PDV + Metadados da Caixa (13px, clicável) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-black text-xs shadow-xs">
              M
            </div>
            <h1 className="text-sm font-bold text-neutral-900 tracking-tight">Vendas & PDV</h1>
          </div>

          <span className="text-neutral-300">|</span>

          {/* Estado da Caixa como metadado de 13px clicável */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCaixaMenuOpen(prev => !prev)}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-neutral-100 text-[13px] text-neutral-700 transition-colors cursor-pointer group"
              title="Gerir Caixa (Sangria, Suprimento, Fecho, Periféricos)"
            >
              <span className="font-semibold text-neutral-900">Caixa 01 · Balcão</span>
              <span className="text-neutral-300">·</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Sincronizado
              </span>
              <span className="text-neutral-300">·</span>
              <span className="font-mono text-neutral-500 text-xs" data-numeric="true">
                {currentTime.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <ChevronDown size={14} className="text-neutral-400 group-hover:text-neutral-800 transition-transform" />
            </button>

            {/* Menu Dropdown da Caixa */}
            {isCaixaMenuOpen && (
              <div className="absolute left-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-neutral-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                <div className="px-3 py-2 border-b border-neutral-100 bg-neutral-50/50">
                  <p className="font-bold text-neutral-900">Sessão de Caixa Ativa</p>
                  <p className="text-[11px] text-neutral-500">Terminal 01 · Operador em serviço</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsQuickMovementOpen(true); setIsCaixaMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-50 flex items-center gap-2 text-neutral-700 font-medium cursor-pointer"
                >
                  <Coins size={14} className="text-neutral-500" />
                  <span>Sangria / Suprimento</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setIsHardwareModalOpen(true); setIsCaixaMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-50 flex items-center gap-2 text-neutral-700 font-medium cursor-pointer"
                >
                  <Printer size={14} className="text-neutral-500" />
                  <span>Periféricos & Impressoras</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowHighlights(prev => !prev); setIsCaixaMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-50 flex items-center gap-2 text-neutral-700 font-medium cursor-pointer"
                >
                  <Sparkles size={14} className="text-neutral-500" />
                  <span>Top Mais Vendidos</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab?.('cash_session'); setIsCaixaMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 font-semibold flex items-center gap-2 border-t border-neutral-100 cursor-pointer"
                >
                  <RotateCcw size={14} className="text-red-500" />
                  <span>Fechar Caixa / Turno</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Direita: Sincronização + 📥 Instalar App PWA + ⌨ F1 e 🔔 Notificações */}
        <div className="flex items-center gap-2">
          {/* Status Offline / Online e Sincronização */}
          {!isOnline ? (
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border bg-amber-50 text-amber-800 border-amber-200"
              title="Operando 100% offline no PDV. Todas as vendas estão salvas no dispositivo."
            >
              <WifiOff size={13} className="text-amber-600" />
              <span>Offline</span>
              {pendingSyncCount > 0 && (
                <span className="font-bold text-[10px] bg-amber-200/90 px-1.5 py-0.2 rounded font-mono">
                  {pendingSyncCount}
                </span>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={handlePosManualSync}
              disabled={isSyncing}
              title="Sincronizar vendas e catálogo em tempo real com os outros terminais"
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700 transition cursor-pointer"
            >
              <RefreshCw size={12} className={isSyncing ? "animate-spin text-emerald-600" : "text-neutral-500"} />
              {isSyncing ? (
                <span>A sincronizar...</span>
              ) : pendingSyncCount > 0 ? (
                <span className="text-amber-700 font-semibold">{pendingSyncCount} por sincronizar</span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="hidden xl:inline">Sincronizado</span>
                </span>
              )}
            </button>
          )}

          <PWAInstallButton variant="compact" />
          <button
            type="button"
            onClick={() => setIsShortcutsOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 text-xs font-medium cursor-pointer transition-colors"
            title="Guia de Atalhos [F1]"
          >
            <Keyboard size={15} />
            <kbd className="text-[11px] font-mono bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded border border-neutral-200">F1</kbd>
          </button>
          <NotificationsCenter onNavigateToProducts={() => setActiveTab?.('products')} />
        </div>
      </header>

      {/* TOP HIGHLIGHTS CAROUSEL (Expandable on click) */}
      {showHighlights && (
        <div className="p-3 bg-white border-b border-neutral-100 animate-in fade-in slide-in-from-top-2 duration-200 shrink-0">
          <TopProductsCarousel onAddToCart={(productId) => {
            const found = products.find(p => p.id === productId);
            if (found) addToCart(found);
          }} />
        </div>
      )}

      {/* 2. CORPO PRINCIPAL COM 3 ZONAS E ALTURA FIXA DE ECRÃ */}
      <main className="flex flex-1 gap-4 overflow-hidden p-4 min-h-0">
        {/* =========================================================================
            ZONA ESQUERDA: CATÁLOGO = UMA SUPERFÍCIE SÓ (SEM BORDA WIREFRAME)
           ========================================================================= */}
        <section className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-xs">
          {/* Header Sticky: Pesquisa + Filtros + Linha de Categorias Reais */}
          <div className="sticky top-0 space-y-2.5 border-b border-neutral-100 p-4 bg-white z-10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  id="pos-search-input"
                  ref={searchInputRef}
                  type="text"
                  placeholder="Pesquisar por nome, código interno ou EAN... (F2)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full h-10 pl-10 pr-9 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white rounded-xl text-xs font-medium text-neutral-900 placeholder:text-neutral-400 border border-neutral-200/60 focus:border-neutral-900 transition-all outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Segmented Stock Filter */}
              <div className="flex items-center bg-neutral-100 p-0.5 rounded-xl shrink-0 text-xs">
                <button
                  type="button"
                  onClick={() => setStockFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    stockFilter === 'all' ? 'bg-white text-neutral-950 shadow-2xs' : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('in_stock')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    stockFilter === 'in_stock' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Em Stock
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('low_stock')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    stockFilter === 'low_stock' ? 'bg-white text-amber-800 shadow-2xs' : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Baixo Stock
                </button>
              </div>
            </div>

            {/* Linha de Categorias Reais (scroll horizontal sem redundância) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-neutral-900 text-white font-semibold'
                      : 'bg-neutral-100/80 text-neutral-600 hover:bg-neutral-200/70 hover:text-neutral-900'
                  }`}
                >
                  {cat === 'all' ? 'Todos' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grelha de Produtos: A ÚNICA ZONA COM SCROLL NA ESQUERDA */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-0">
            {filteredProducts.length === 0 ? (
              searchTerm ? (
                <div className="h-44 flex flex-col items-center justify-center text-center p-4">
                  <Search size={32} className="text-neutral-300 mb-2 stroke-[1.5]" />
                  <p className="text-xs text-[#6B7280]">
                    Nenhum artigo encontrado para "<span className="font-semibold text-neutral-900">{searchTerm}</span>"
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setStockFilter('all');
                      searchInputRef.current?.focus();
                    }}
                    className="mt-2 text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                  >
                    Limpar pesquisa
                  </button>
                </div>
              ) : (
                <div className="h-44 flex flex-col items-center justify-center text-center p-4">
                  <Package size={32} className="text-neutral-300 mb-2 stroke-[1.5]" />
                  <p className="text-xs text-[#6B7280]">Nenhum produto cadastrado no catálogo</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab?.('products')}
                    className="mt-2 text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                  >
                    Cadastrar artigos
                  </button>
                </div>
              )
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 pb-2">
                {filteredProducts.map((product) => {
                  const isOut = product.stock <= 0;
                  const isLow = product.stock <= product.minStock;
                  const inCartItem = cart.find(ci => ci.product.id === product.id);
                  const isJustAdded = !!recentlyAddedIds[product.id];
                  const hasImageError = !!imageErrors[product.id];
                  const imageSrc = !hasImageError && product.imageUrl ? product.imageUrl : null;

                  return (
                    <div
                      key={product.id}
                      onClick={() => !isOut && addToCart(product)}
                      className={`group relative p-3 rounded-xl transition-all duration-150 flex flex-col justify-between select-none min-h-[128px] cursor-pointer ${
                        isOut
                          ? 'bg-neutral-50/60 opacity-50 cursor-not-allowed'
                          : isJustAdded
                          ? 'bg-red-50/60 ring-2 ring-red-500/40 shadow-xs scale-[0.98]'
                          : inCartItem
                          ? 'bg-neutral-50 ring-1 ring-neutral-300 shadow-2xs hover:shadow-xs active:scale-[0.98]'
                          : 'bg-white hover:bg-neutral-50 shadow-2xs hover:shadow-xs active:scale-[0.98]'
                      }`}
                    >
                      {/* Badge de quantidade no carrinho */}
                      {inCartItem && (
                        <span className="absolute -top-1.5 -right-1.5 bg-neutral-900 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs z-10">
                          {inCartItem.quantity}
                        </span>
                      )}

                      {/* Topo do Card: Imagem/Inicial 1:1 e Stock Badge discreta */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center overflow-hidden shrink-0">
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt=""
                              className="w-full h-full object-contain p-1"
                              onError={() => setImageErrors(prev => ({ ...prev, [product.id]: true }))}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="font-bold text-neutral-400 text-sm">
                              {product.name ? product.name.charAt(0).toUpperCase() : 'P'}
                            </span>
                          )}
                        </div>

                        {/* Badge de stock discreta no canto */}
                        <span
                          className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                            isOut ? 'bg-red-500' : isLow ? 'bg-amber-400' : 'bg-emerald-500'
                          }`}
                          title={`Stock: ${product.stock} ${product.unit || 'un'}`}
                        />
                      </div>

                      {/* Conteúdo: Nome em 2 linhas máx. + Preço a Bold como elemento mais forte */}
                      <div className="flex-1 flex flex-col justify-between">
                        <h4 className="text-[13px] font-medium text-neutral-800 line-clamp-2 leading-snug">
                          {product.name}
                        </h4>
                        <div className="mt-1.5 flex items-baseline justify-between">
                          <span className="text-[14px] font-extrabold text-neutral-950 tracking-tight" data-numeric="true">
                            {formatKz(product.salePrice)}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {product.stock} {product.unit || 'un'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* MODO TABELA DENSA */
              <div className="rounded-xl overflow-hidden border border-neutral-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 border-b border-neutral-100 text-neutral-500 font-semibold text-[11px]">
                    <tr>
                      <th className="p-2.5">Artigo</th>
                      <th className="p-2.5">Código</th>
                      <th className="p-2.5">Categoria</th>
                      <th className="p-2.5 text-right">Stock</th>
                      <th className="p-2.5 text-right">Preço</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredProducts.map((product) => {
                      const isOut = product.stock <= 0;
                      const isLow = product.stock <= product.minStock;
                      const inCartItem = cart.find(ci => ci.product.id === product.id);

                      return (
                        <tr
                          key={product.id}
                          onClick={() => !isOut && addToCart(product)}
                          className={`transition-colors cursor-pointer ${
                            isOut
                              ? 'opacity-50 bg-neutral-50/50'
                              : inCartItem
                              ? 'bg-neutral-100/60 hover:bg-neutral-100'
                              : 'hover:bg-neutral-50'
                          }`}
                        >
                          <td className="p-2.5 font-medium text-neutral-900 flex items-center gap-2">
                            <span className="truncate max-w-xs">{product.name}</span>
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-neutral-400">{product.barcode || product.sku}</td>
                          <td className="p-2.5 text-neutral-500">{product.category || 'Geral'}</td>
                          <td className="p-2.5 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isOut ? 'bg-red-100 text-red-700' : isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {product.stock} {product.unit}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-extrabold text-neutral-950">{formatKz(product.salePrice)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Rodapé do Catálogo: Ações Secundárias + Barra de Atalhos Fixa */}
          <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-2.5 bg-white shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsHeldSalesOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer"
                title="Vendas Pausadas em Espera [F8]"
              >
                <PauseCircle size={14} className="text-neutral-500" />
                <span>Em espera ({heldSales.length})</span>
                <kbd className="text-[10px] font-mono bg-white text-neutral-500 px-1 py-0.2 rounded border border-neutral-200">F8</kbd>
              </button>

              <button
                type="button"
                onClick={() => setIsRecentSalesOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer"
                title="Histórico de Vendas [F10]"
              >
                <History size={14} className="text-neutral-500" />
                <span>Últimas vendas</span>
                <kbd className="text-[10px] font-mono bg-white text-neutral-500 px-1 py-0.2 rounded border border-neutral-200">F10</kbd>
              </button>

              <button
                type="button"
                onClick={() => setIsQuickMovementOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer"
                title="Sangria ou Suprimento Rápido"
              >
                <Coins size={14} className="text-neutral-500" />
                <span>Sangria / Suprimento</span>
              </button>

              {/* Menu Overflow ⋯ Mais */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsMoreMenuOpen(prev => !prev)}
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                  title="Mais ações"
                >
                  <MoreHorizontal size={18} />
                </button>

                {isMoreMenuOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-52 bg-white rounded-xl shadow-xl border border-neutral-100 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={() => { setShowHighlights(prev => !prev); setIsMoreMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles size={14} className="text-neutral-500" />
                      <span>Top mais vendidos</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsHardwareModalOpen(true); setIsMoreMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Printer size={14} className="text-neutral-500" />
                      <span>Periféricos & Impressoras</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setViewMode(prev => prev === 'grid' ? 'table' : 'grid'); setIsMoreMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LayoutGrid size={14} className="text-neutral-500" />
                      <span>Alternar grelha / lista</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsShortcutsOpen(true); setIsMoreMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 border-t border-neutral-100 cursor-pointer"
                    >
                      <Keyboard size={14} className="text-neutral-500" />
                      <span>Guia de atalhos (F1)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Barra de Atalhos Fixa em 11px */}
            <div className="hidden lg:flex items-center gap-3 text-[11px] text-neutral-400 font-medium">
              <span><kbd className="font-mono text-neutral-500 bg-neutral-100 px-1 py-0.5 rounded border border-neutral-200">F2</kbd> Pesquisa</span>
              <span><kbd className="font-mono text-neutral-500 bg-neutral-100 px-1 py-0.5 rounded border border-neutral-200">F4</kbd> Cliente</span>
              <span><kbd className="font-mono text-neutral-500 bg-neutral-100 px-1 py-0.5 rounded border border-neutral-200">F7</kbd> Desconto</span>
              <span><kbd className="font-mono text-neutral-500 bg-neutral-100 px-1 py-0.5 rounded border border-neutral-200">F9</kbd> Cobrar</span>
            </div>
          </div>
        </section>

        {/* =========================================================================
        {/* =========================================================================
            ZONA DIREITA: TALÃO (A COLUNA QUE VENDE) - SUPERFÍCIE ELEVADA
           ========================================================================= */}
        <aside className="flex w-[400px] 2xl:w-[440px] flex-col overflow-hidden rounded-2xl bg-white shadow-lg shrink-0">
          {/* Header do Talão */}
          <div className="px-5 pt-4 pb-3 border-b border-neutral-100 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-neutral-900 tracking-wide uppercase">
                  TALÃO #{String(sales.length + 485).padStart(4, '0')}
                </h2>
                <span className="text-[11px] text-neutral-500 font-medium" data-numeric="true">
                  ({cart.reduce((acc, ci) => acc + ci.quantity, 0)} {cart.length === 1 ? 'item' : 'itens'})
                </span>
              </div>

              {cart.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleHoldCurrentSale}
                    className="text-xs font-semibold text-neutral-600 hover:text-neutral-950 px-2 py-1 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                    title="Pausar venda [F8]"
                  >
                    Pausar
                  </button>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    title="Limpar talão"
                  >
                    Limpar
                  </button>
                </div>
              )}
            </div>

            {/* Linha Compacta do Cliente: 👤 Consumidor final · Alterar */}
            <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-neutral-50 text-neutral-700">
              <div className="flex items-center gap-2 truncate">
                <User size={14} className="text-neutral-400 shrink-0" />
                <span className="font-semibold text-neutral-900 truncate">
                  {customerName ? customerName : 'Consumidor final'}
                </span>
                {customerNif && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200/70 font-mono text-neutral-600 shrink-0">
                    NIF: {customerNif}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerSelectOpen(true)}
                className="text-[11px] font-bold text-neutral-600 hover:text-neutral-950 hover:underline cursor-pointer shrink-0 ml-2"
                title="Alterar cliente [F4]"
              >
                Alterar
              </button>
            </div>
          </div>

          {/* Itens do Talão: A ÚNICA ZONA COM SCROLL NA DIREITA */}
          <ul className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5 custom-scrollbar min-h-0">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#6B7280]">
                <Receipt size={36} className="text-neutral-300 mb-2 stroke-[1.5]" />
                <h4 className="text-[13px] font-bold text-neutral-800">Talão vazio</h4>
                <p className="text-[11px] text-[#6B7280] mt-1 max-w-[210px] leading-relaxed">
                  Leia um código de barras com o leitor ou selecione artigos no catálogo.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <li
                  key={item.product.id}
                  className="p-2 rounded-xl bg-neutral-50/70 hover:bg-neutral-100/70 transition-colors flex items-center justify-between gap-2.5 text-xs"
                >
                  {/* Thumbnail / Inicial 1:1 */}
                  <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 border border-neutral-100 overflow-hidden shadow-2xs">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="max-h-7 w-auto object-contain pointer-events-none"
                      />
                    ) : (
                      <span className="font-bold text-xs text-neutral-400">
                        {item.product.name ? item.product.name.charAt(0).toUpperCase() : 'P'}
                      </span>
                    )}
                  </div>

                  {/* Nome e Preço Unitário */}
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-neutral-900 truncate leading-snug">{item.product.name}</h5>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                      <span data-numeric="true">{formatKz(item.product.salePrice)}</span>
                      <span>·</span>
                      <span className="font-mono text-[10px]">{item.product.unit || 'un'}</span>
                    </div>
                  </div>

                  {/* Quantidade Stepper */}
                  <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-lg border border-neutral-200/80 shadow-2xs shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-5 h-5 flex items-center justify-center text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="font-black text-neutral-950 px-1 text-xs" data-numeric="true">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-5 h-5 flex items-center justify-center text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                    >
                      <Plus size={11} />
                    </button>
                  </div>

                  {/* Total da Linha */}
                  <div className="text-right shrink-0 min-w-[65px]">
                    <span className="font-extrabold text-neutral-950 block text-xs" data-numeric="true">
                      {formatKz(item.product.salePrice * item.quantity)}
                    </span>
                  </div>

                  {/* Remover Item */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-neutral-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                    title="Remover artigo"
                  >
                    <X size={13} />
                  </button>
                </li>
              ))
            )}
          </ul>

          {/* Cross Sell Banner discreto */}
          {cart.length > 0 && crossSellSuggestion && (
            <div className="px-4 pb-1 shrink-0">
              <CrossSellBanner
                suggestion={crossSellSuggestion}
                onAddToCart={handleAddCrossSell}
              />
            </div>
          )}

          {/* Rodapé Ancorado: Subtotal, Desconto [%|Kz], TOTAL a 32px e Botão Cobrar (F9) a 56px */}
          <footer className="mt-auto border-t border-neutral-100 p-5 bg-white shrink-0 space-y-3">
            <div className="space-y-1.5">
              {/* Subtotal a 13px cinza */}
              <div className="flex justify-between items-center text-[13px] text-[#6B7280]">
                <span>Subtotal</span>
                <span className="font-semibold text-neutral-800" data-numeric="true">{formatKz(subtotal)}</span>
              </div>

              {/* Desconto: Rótulo + [%|Kz] + Input Alinhado à Direita + Valor em Kz */}
              <div className="flex justify-between items-center text-[13px] text-[#6B7280]">
                <div className="flex items-center gap-1.5">
                  <span>Desconto</span>
                  <div className="inline-flex rounded-lg bg-neutral-100 p-0.5">
                    <button
                      type="button"
                      onClick={() => setDiscountType('percent')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                        discountType === 'percent' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'
                      }`}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('fixed')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                        discountType === 'fixed' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'
                      }`}
                    >
                      Kz
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="pos-discount-input"
                    type="number"
                    min="0"
                    max={discountType === 'percent' ? 100 : subtotal}
                    value={globalDiscount || ''}
                    placeholder="0"
                    onChange={(e) => {
                      const val = Math.max(0, parseFloat(e.target.value) || 0);
                      setGlobalDiscount(discountType === 'percent' ? Math.min(100, val) : val);
                    }}
                    className="w-16 h-7 px-2 text-right rounded-lg bg-neutral-100 text-neutral-900 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-neutral-400"
                  />
                  <span className="font-semibold text-neutral-700 min-w-[70px] text-right" data-numeric="true">
                    {discountAmount > 0 ? `- ${formatKz(discountAmount)}` : '0,00 Kz'}
                  </span>
                </div>
              </div>

              {/* Total a Pagar a 32px BOLD */}
              <div className="pt-2.5 border-t border-neutral-100 flex justify-between items-baseline">
                <span className="text-xs uppercase font-bold text-neutral-500 tracking-wider">Total a pagar</span>
                <span className="text-[32px] font-black text-neutral-950 tracking-tight leading-none" data-numeric="true">
                  {formatKz(totalPayable)}
                </span>
              </div>
            </div>

            {/* Botão Cobrar a 56px com cor de marca (o vermelho do logo) */}
            <button
              id="btn-pos-checkout"
              type="button"
              disabled={cart.length === 0}
              onClick={() => setIsCheckoutOpen(true)}
              className={`h-14 w-full rounded-xl text-base font-semibold transition-all flex items-center justify-between px-6 cursor-pointer ${
                cart.length === 0
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none'
                  : 'bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white shadow-md'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>Cobrar</span>
                <kbd className="px-1.5 py-0.5 text-xs bg-black/20 rounded font-mono font-normal">F9</kbd>
              </span>
              <span className="font-extrabold text-lg" data-numeric="true">
                {totalPayable > 0 ? formatKz(totalPayable) : '0,00 Kz'}
              </span>
            </button>
          </footer>
        </aside>
      </main>

      {/* =========================================================================
          MODAL DE SELEÇÃO E ALTERAÇÃO DO CLIENTE NO TALÃO (F4)
         ========================================================================= */}
      {isCustomerSelectOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Identificação do Cliente</h3>
                <p className="text-[11px] text-neutral-500">Defina o cliente a constar no talão / fatura AGT</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerSelectOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Opção Consumidor Final */}
            <button
              type="button"
              onClick={() => {
                handleClearCustomer();
                setIsCustomerSelectOpen(false);
                showFeedback('Cliente definido como Consumidor Final', 'info');
              }}
              className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                !customerName
                  ? 'border-neutral-900 bg-neutral-50 font-bold text-neutral-950'
                  : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User size={16} className="text-neutral-500" />
                <div>
                  <span className="text-xs font-bold block">Consumidor Final (Padrão)</span>
                  <span className="text-[10px] text-neutral-500 font-normal">Sem NIF associado</span>
                </div>
              </div>
              {!customerName && <Check size={16} className="text-neutral-900" />}
            </button>

            {/* Campos Nome e NIF */}
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <div>
                <label className="text-[11px] font-semibold text-neutral-700 block mb-1">Nome do Cliente / Razão Social</label>
                <input
                  type="text"
                  placeholder="Ex: João Baptista ou Empresa ABC"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (selectedCustomerId) setSelectedCustomerId(null);
                  }}
                  className="w-full h-9 px-3 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 font-medium focus:bg-white focus:outline-none focus:border-neutral-900"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-neutral-700 block mb-1">NIF (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: 5417082910"
                  value={customerNif}
                  onChange={(e) => setCustomerNif(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 font-mono focus:bg-white focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            {/* Lista Rápida de Clientes Cadastrados */}
            {customers.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                <label className="text-[11px] font-semibold text-neutral-700 block">Clientes Cadastrados</label>
                <div className="max-h-36 overflow-y-auto space-y-1 custom-scrollbar">
                  {customers.slice(0, 8).map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        handleSelectCustomer(c);
                        setIsCustomerSelectOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        selectedCustomerId === c.id ? 'bg-neutral-100 font-bold text-neutral-900' : 'hover:bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      {c.nifOrBi && <span className="text-[10px] text-neutral-400 font-mono ml-2 shrink-0">{c.nifOrBi}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  setIsCustomerSelectOpen(false);
                  setIsQuickCustomerOpen(true);
                }}
                className="text-xs font-semibold text-neutral-600 hover:text-neutral-950 hover:underline cursor-pointer flex items-center gap-1"
              >
                <UserPlus size={13} />
                <span>Novo Cliente</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCustomerSelectOpen(false)}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE FINALIZAÇÃO DE VENDA & CHECKOUT (MULTIPAGAMENTO & TROCO)
         ========================================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="workspace-panel max-w-lg w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 text-sm">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="font-black text-base text-zinc-950">Finalizar Venda & Cobrança</h3>
                <p className="text-[11px] text-zinc-400">
                  Cliente: <span className="font-bold text-zinc-800">{customerName || 'Consumidor Final'}</span> {customerNif && `(NIF: ${customerNif})`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
                title="Fechar [ESC]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Total Card */}
            <div className="p-4 rounded-2xl bg-zinc-950 text-white text-center space-y-1 shadow-inner">
              <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider">Total a Cobrar</span>
              <div className="text-3xl font-black text-emerald-400">{formatKz(totalPayable)}</div>
              <div className="text-[11px] text-zinc-400">
                Subtotal: {formatKz(subtotal)} {discountAmount > 0 && `• Desconto: -${formatKz(discountAmount)}`}
              </div>
            </div>

            {/* Split Payment Toggle */}
            <div className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-2xl border border-zinc-200/60">
              <span className="font-bold text-zinc-800 text-xs flex items-center gap-1.5">
                <Layers size={14} className="text-zinc-500" />
                Pagamento Dividido / Misto (Dinheiro + TPA)
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsSplitPayment(prev => !prev);
                  if (!isSplitPayment) {
                    setSplitCashAmount(String(Math.floor(totalPayable / 2)));
                  }
                }}
                className={`px-3 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                  isSplitPayment ? 'bg-zinc-950 text-white' : 'bg-zinc-200 text-zinc-700'
                }`}
              >
                {isSplitPayment ? 'Ativo' : 'Ativar'}
              </button>
            </div>

            {/* Payment Method Selector (Single Mode) */}
            {!isSplitPayment ? (
              <div className="space-y-2">
                <label className="font-bold text-zinc-700 block text-xs">Forma de Pagamento</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {paymentMethods.map((m) => {
                    const Icon = m.icon;
                    const isSelected = selectedPayment === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedPayment(m.id)}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-950 text-white border-zinc-950 shadow-md scale-102'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300'
                        }`}
                      >
                        <Icon size={18} className={isSelected ? 'text-emerald-400' : 'text-zinc-600'} />
                        <div>
                          <span className="font-bold text-xs block leading-tight">{m.label}</span>
                          <span className="text-[9px] text-zinc-400 block">{m.sub}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* SPLIT PAYMENT CONTROLS */
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-zinc-800 text-xs block mb-1">1. Parcela em Dinheiro (Kz)</label>
                    <input
                      type="number"
                      value={splitCashAmount}
                      onChange={(e) => setSplitCashAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl font-black text-sm text-zinc-950 focus:ring-1 focus:ring-zinc-950"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-zinc-800 text-xs block mb-1">2. Restante em Cartão/Outro (Kz)</label>
                    <div className="w-full px-3 py-2 bg-zinc-200/80 border border-zinc-300 rounded-xl font-black text-sm text-zinc-950">
                      {formatKz(splitRemainingDue)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cash Given & Change Calculation */}
            {(selectedPayment === 'cash' || isSplitPayment) && (
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-zinc-800 text-xs">Valor Entregue pelo Cliente em Cédulas (Kz)</label>
                    <span className="text-[10px] text-zinc-400">Notas em Kwanzas</span>
                  </div>
                  <input
                    type="number"
                    autoFocus
                    placeholder={`Ex: ${isSplitPayment ? splitCashNum : totalPayable}`}
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (!isCashInsufficient || cashGivenNum >= totalPayable)) {
                        handleCompleteSale();
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-zinc-300 text-zinc-950 font-black text-base focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  />
                </div>

                {/* Quick Presets Buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {quickCashPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (preset.value !== undefined) {
                          setCashGiven(String(preset.value));
                        } else if (preset.add !== undefined) {
                          const current = parseFloat(cashGiven) || 0;
                          setCashGiven(String(current + preset.add));
                        }
                      }}
                      className="px-2.5 py-1 rounded-xl bg-white hover:bg-zinc-200 border border-zinc-200 text-zinc-800 font-bold text-[11px] transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Change Warning/Box */}
                {isCashInsufficient ? (
                  <div className="p-2.5 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-between text-rose-800 font-bold text-xs">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle size={14} />
                      Valor insuficiente
                    </span>
                    <span>Faltam {formatKz((isSplitPayment ? splitCashNum : totalPayable) - cashGivenNum)}</span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-100/80 border border-emerald-200 flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-900 flex items-center gap-1.5">
                      <Check size={14} />
                      Troco a Devolver:
                    </span>
                    <span className="text-emerald-950 font-black text-sm">{formatKz(changeDue)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCancelOrderBeforeSale}
                className="px-3.5 py-2.5 rounded-2xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-black flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Cancelar atendimento, limpar itens e resetar formulário"
              >
                <Trash2 size={14} />
                <span>Cancelar Atendimento</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold cursor-pointer"
                >
                  Voltar [ESC]
                </button>

                <button
                  id="btn-confirm-pos-sale"
                  type="button"
                  disabled={isSubmitting || (!isSplitPayment && selectedPayment === 'cash' && cashGivenNum < totalPayable)}
                  onClick={handleCompleteSale}
                  className={`px-5 py-2.5 rounded-2xl font-black shadow-sm flex items-center gap-2 transition-all cursor-pointer ${
                    isSubmitting || (!isSplitPayment && selectedPayment === 'cash' && cashGivenNum < totalPayable)
                      ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-zinc-950 active:scale-98'
                  }`}
                >
                  <CheckCircle2 size={16} />
                  <span>{isSubmitting ? 'A Registar...' : 'Confirmar & Emitir Talão'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE CONFIRMAÇÃO & TALÃO TÉRMICO CERTIFICADO AGT (80mm)
         ========================================================================= */}
      {lastCompletedSale && (
        <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="workspace-panel max-w-sm w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 text-sm">
            <div className="text-center space-y-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm ${
                lastCompletedSale.status === 'canceled'
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-emerald-100 text-emerald-600'
              }`}>
                {lastCompletedSale.status === 'canceled' ? <RotateCcw size={24} /> : <CheckCircle2 size={24} />}
              </div>
              <h3 className="font-black text-base text-zinc-950">
                {lastCompletedSale.status === 'canceled' ? 'Venda Estornada / Cancelada' : 'Venda Registada com Sucesso!'}
              </h3>
              <p className="text-zinc-500 text-[11px]">
                {lastCompletedSale.status === 'canceled'
                  ? 'Estoque devolvido e venda anulada no sistema fiscal'
                  : 'Talão emitido e transmitido para a AGT'}
              </p>
            </div>

            {/* Thermal Receipt Preview (80mm standard format) */}
            <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 font-mono text-[10px] text-zinc-800 space-y-2.5 shadow-inner relative">
              {lastCompletedSale.status === 'canceled' && (
                <div className="absolute inset-0 bg-rose-50/80 backdrop-blur-[1px] rounded-2xl flex items-center justify-center pointer-events-none">
                  <span className="border-2 border-rose-600 text-rose-600 font-black text-base px-4 py-1 rounded-xl rotate-[-12deg] uppercase tracking-widest">
                    ANULADO / ESTORNO
                  </span>
                </div>
              )}
              <div className="text-center border-b border-dashed border-zinc-300 pb-2 space-y-0.5">
                <p className="font-black text-zinc-950 text-[11px] uppercase">
                  {companySettings.tradingName || companySettings.companyName || 'MASAKULA TECH & RETAIL'}
                </p>
                {companySettings.tradingName && companySettings.companyName && (
                  <p className="text-[9px] text-zinc-500 font-medium">{companySettings.companyName}</p>
                )}
                <p className="font-bold">
                  {companySettings.nif ? `NIF: ${companySettings.nif}` : 'NIF: Consumidor Final'}
                </p>
                {companySettings.address && (
                  <p>{companySettings.address}{companySettings.city ? ` • ${companySettings.city}` : ''}</p>
                )}
                {companySettings.phone && (
                  <p>Tel: {companySettings.phone}</p>
                )}
                {companySettings.email && (
                  <p>Email: {companySettings.email}</p>
                )}
                {companySettings.regimeIva && (
                  <p className="text-[9px] text-zinc-500 font-semibold">{companySettings.regimeIva}</p>
                )}
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between font-bold text-zinc-950">
                  <span>DOC: {lastCompletedSale.invoiceNumber}</span>
                  <span>{formatDateTime(lastCompletedSale.createdAt)}</span>
                </div>
                <div>Cliente: <span className="font-semibold">{lastCompletedSale.customerName}</span></div>
                {lastCompletedSale.customerNif && <div>NIF: {lastCompletedSale.customerNif}</div>}
                <div>Operador: {lastCompletedSale.cashierName}</div>
              </div>

              {/* Items List */}
              <div className="border-t border-b border-dashed border-zinc-300 py-1.5 space-y-1">
                {lastCompletedSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate max-w-[170px]">{item.quantity}x {item.product.name}</span>
                    <span className="font-semibold">{formatKz(item.product.salePrice * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-0.5 text-right font-medium">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatKz(lastCompletedSale.subtotal)}</span>
                </div>
                {lastCompletedSale.discount > 0 && (
                  <div className="flex justify-between text-rose-700">
                    <span>Desconto:</span>
                    <span>-{formatKz(lastCompletedSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-xs text-zinc-950 pt-1 border-t border-zinc-300">
                  <span>TOTAL KZ:</span>
                  <span>{formatKz(lastCompletedSale.total)}</span>
                </div>
                <div className="flex justify-between text-[9px] text-zinc-500 pt-0.5">
                  <span>Meio de Pagamento:</span>
                  <span className="uppercase font-bold">{lastCompletedSale.paymentMethod}</span>
                </div>
              </div>

              {/* AGT Certification Footer */}
              <div className="text-center text-[9px] text-zinc-400 pt-2 border-t border-dashed border-zinc-300 space-y-0.5">
                <p>
                  {companySettings.agtCertificateNumber 
                    ? `${companySettings.agtCertificateNumber} • Software Certificado AGT` 
                    : 'AGT-CERT/2026/8920 • Software Certificado'}
                </p>
                <p className="font-bold text-zinc-600">Obrigado pela preferência!</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (lastCompletedSale) {
                      const printResult = await hardwareService.printReceipt({
                        companyName: companySettings.tradingName || companySettings.companyName || 'MASAKULA TECH',
                        nif: companySettings.nif,
                        invoiceNumber: lastCompletedSale.invoiceNumber,
                        date: formatDateTime(lastCompletedSale.createdAt),
                        operatorName: lastCompletedSale.cashierName,
                        customerName: lastCompletedSale.customerName,
                        customerNif: lastCompletedSale.customerNif,
                        items: lastCompletedSale.items.map(it => ({
                          name: it.product.name,
                          quantity: it.quantity,
                          price: it.product.salePrice,
                          subtotal: it.product.salePrice * it.quantity,
                        })),
                        subtotal: lastCompletedSale.subtotal,
                        discount: lastCompletedSale.discount,
                        total: lastCompletedSale.total,
                        paymentMethod: lastCompletedSale.paymentMethod === 'cash' ? 'Dinheiro' : lastCompletedSale.paymentMethod === 'multicaixa' ? 'Multicaixa TPA' : lastCompletedSale.paymentMethod,
                        amountPaid: lastCompletedSale.paymentMethod === 'cash' ? (cashGivenNum || lastCompletedSale.total) : lastCompletedSale.total,
                        changeGiven: lastCompletedSale.paymentMethod === 'cash' ? changeDue : 0,
                      });
                      if (printResult.success) {
                        toast.success(printResult.message);
                      }
                    }
                  }}
                  className="flex-1 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Printer size={15} className="text-emerald-400" aria-hidden="true" />
                  <span>Imprimir na Maquininha</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLastCompletedSale(null);
                    searchInputRef.current?.focus();
                  }}
                  className="flex-1 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold transition-colors cursor-pointer"
                >
                  Nova Venda [ESC]
                </button>
              </div>

              {/* Refund Action (Manager Role Protected) */}
              {lastCompletedSale.status !== 'canceled' && (
                <button
                  type="button"
                  disabled={isRefunding}
                  onClick={() => handleRequestRefund(lastCompletedSale)}
                  className="w-full py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Devolver itens ao estoque e cancelar a venda (Requer Gerente)"
                >
                  <RotateCcw size={13} />
                  <span>{isRefunding ? 'A Processar Estorno...' : 'Estornar Venda (Requer Gerente)'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Held Sales Drawer */}
      <PosHeldSalesDrawer
        isOpen={isHeldSalesOpen}
        onClose={() => setIsHeldSalesOpen(false)}
        heldSales={heldSales}
        onResumeSale={handleResumeHeldSale}
        onDeleteHeldSale={handleDeleteHeldSale}
      />

      {/* Recent Sales Drawer */}
      <PosRecentSalesDrawer
        isOpen={isRecentSalesOpen}
        onClose={() => setIsRecentSalesOpen(false)}
        sales={sales}
        onReprintSale={(sale) => {
          setLastCompletedSale(sale);
          setIsRecentSalesOpen(false);
        }}
        onRequestRefund={(sale) => {
          setIsRecentSalesOpen(false);
          handleRequestRefund(sale);
        }}
      />

      {/* Quick Customer Modal */}
      <PosQuickCustomerModal
        isOpen={isQuickCustomerOpen}
        onClose={() => setIsQuickCustomerOpen(false)}
        onSaveCustomer={handleSaveQuickCustomer}
      />

      {/* Quick Movement Modal */}
      <PosQuickMovementModal
        isOpen={isQuickMovementOpen}
        onClose={() => setIsQuickMovementOpen(false)}
        onSubmitMovement={async (type, amount, reason) => {
          try {
            await supabaseService.insertCashMovement({
              session_id: 'active-session-01',
              type,
              amount,
              reason,
            });
            triggerAudio('cash');
            showFeedback(`${type === 'SANGRIA' ? 'Sangria' : 'Suprimento'} de ${formatKz(amount)} registado!`, 'success');
          } catch (e) {
            showFeedback('Erro ao comunicar movimento com o banco.', 'error');
          }
        }}
      />

      {/* Keyboard Shortcuts Modal */}
      <PosShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Feedback Modal (Venda Feita / Pagamento Cancelado) */}
      <SaleFeedbackModal
        isOpen={feedbackModal.isOpen}
        type={feedbackModal.type}
        totalAmount={feedbackModal.totalAmount}
        changeAmount={feedbackModal.changeAmount}
        onPrintReceipt={() => {
          if (lastCompletedSale) {
            hardwareService.printReceipt({
              companyName: companySettings.companyName || companySettings.tradingName || 'Masakula ERP & PDV',
              nif: companySettings.nif,
              invoiceNumber: lastCompletedSale.invoiceNumber,
              date: formatDateTime(lastCompletedSale.createdAt),
              operatorName: lastCompletedSale.cashierName || 'Operador',
              customerName: lastCompletedSale.customerName,
              customerNif: lastCompletedSale.customerNif,
              items: lastCompletedSale.items.map(item => ({
                name: item.product.name,
                quantity: item.quantity,
                price: item.product.salePrice,
                subtotal: item.product.salePrice * item.quantity,
              })),
              subtotal: lastCompletedSale.subtotal,
              discount: lastCompletedSale.discount,
              total: lastCompletedSale.total,
              paymentMethod: lastCompletedSale.paymentMethod === 'cash' ? 'Dinheiro' : lastCompletedSale.paymentMethod === 'multicaixa' ? 'TPA / Multicaixa' : 'Transferência',
              amountPaid: lastCompletedSale.total + (selectedPayment === 'cash' ? changeDue : 0),
              changeGiven: selectedPayment === 'cash' ? changeDue : 0,
            });
          }
        }}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Manager Authentication Modal for Protected Operations (Estorno) */}
      <ManagerAuthModal
        isOpen={isManagerAuthOpen}
        title="Autorização para Estorno de Venda"
        description="Esta operação fiscal anulará o documento de venda e devolverá todos os produtos automaticamente ao estoque no Supabase."
        onSuccess={() => {
          if (pendingRefundSale) {
            executeRefund(pendingRefundSale);
          }
        }}
        onCancel={() => {
          setIsManagerAuthOpen(false);
          setPendingRefundSale(null);
        }}
      />

      {/* Hidden printable receipt container for direct thermal printing */}
      {lastCompletedSale && (
        <ThermalReceipt
          data={{
            saleId: lastCompletedSale.id,
            invoiceNumber: lastCompletedSale.invoiceNumber,
            date: formatDateTime(lastCompletedSale.createdAt),
            customerName: lastCompletedSale.customerName,
            customerNif: lastCompletedSale.customerNif,
            items: lastCompletedSale.items.map(item => ({
              product_name: item.product.name,
              quantity: item.quantity,
              unit_price: formatKz(item.product.salePrice),
              subtotal: formatKz(item.product.salePrice * item.quantity),
            })),
            subtotal: formatKz(lastCompletedSale.subtotal),
            discount: lastCompletedSale.discount > 0 ? formatKz(lastCompletedSale.discount) : undefined,
            tax: formatKz(lastCompletedSale.tax),
            total: formatKz(lastCompletedSale.total),
            paymentMethod: lastCompletedSale.paymentMethod === 'cash' ? 'Dinheiro' : lastCompletedSale.paymentMethod === 'multicaixa' ? 'TPA / Multicaixa' : lastCompletedSale.paymentMethod === 'express' ? 'Multicaixa Express' : lastCompletedSale.paymentMethod === 'mixed' ? 'Pagamento Misto' : 'Transferência',
            amountPaid: formatKz(lastCompletedSale.total + (selectedPayment === 'cash' ? changeDue : 0)),
            changeGiven: formatKz(selectedPayment === 'cash' ? changeDue : 0),
          }}
          width="80mm"
        />
      )}

      {/* Modal de Periféricos & Hardware POS (Leitor de Códigos de Barras e Maquininha Térmica) */}
      <HardwareDevicesModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
        onSimulateScan={(code) => {
          const match = products.find(p => p.barcode === code) ||
                        products.find(p => p.sku && p.sku.toLowerCase() === code.toLowerCase());
          if (match) {
            addToCart(match);
            showFeedback(`Artigo "${match.name}" adicionado ao carrinho!`, 'success');
          }
        }}
      />
    </div>
  );
};
export default PosView;
