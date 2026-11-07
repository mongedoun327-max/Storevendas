import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Search, 
  AlertTriangle, 
  Edit, 
  Trash2, 
  Barcode, 
  Boxes, 
  X, 
  RotateCcw, 
  Check, 
  Tag, 
  PackageOpen, 
  FilterX,
  Layers,
  Calendar,
  CalendarX,
  Hourglass,
  Wallet,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Lock,
  Eye,
  ShieldCheck,
  Printer,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  LayoutGrid,
  List,
  Download,
  ArrowUpDown,
  SlidersHorizontal,
  ChevronDown,
  RefreshCw,
  Copy,
  FolderTree,
  Upload
} from 'lucide-react';
import { Product, ProductStatus } from '../../types';
import { formatKz } from '../../utils/formatters';
import { supabaseService } from '../../services/supabaseService';
import { useAuth } from '../../contexts/AuthContext';
import { PermissionMatrixModal } from '../auth/PermissionMatrixModal';
import { ProductLabelPrintModal } from '../ProductLabelPrintModal';
import { InventoryProductCard } from '../inventory/InventoryProductCard';
import { InventoryDetailDrawer } from '../inventory/InventoryDetailDrawer';
import { InventoryEditModal } from '../inventory/InventoryEditModal';
import { InventoryQuickStockModal } from '../inventory/InventoryQuickStockModal';
import { InventoryBatchBar } from '../inventory/InventoryBatchBar';
import { exportInventoryToExcel } from '../../utils/exportInventory';
import { CategoriesSubscreenPage } from '../CategoriesSubscreenPage';
import { ConfirmModal } from '../ui/ConfirmModal';
import { toast } from 'sonner';
import { useTrash } from '../../contexts/TrashContext';
import { InlinePageUndoBanner } from '../ui/InlinePageUndoBanner';
import { KpiCard } from '../ui/KpiCard';
import { Badge } from '../ui/Badge';

interface ProductsViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export interface StockToast {
  id: string;
  type: 'critical_stock' | 'out_of_stock' | 'success' | 'warning' | 'info';
  title: string;
  message: string;
  productName?: string;
  currentStock?: number;
  minStock?: number;
  unit?: string;
  actionLabel?: string;
  onAction?: () => void;
}

type SortOption = 'name_asc' | 'name_desc' | 'stock_asc' | 'stock_desc' | 'price_desc' | 'price_asc' | 'expiry_asc';

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  setProducts,
}) => {
  const { hasRole } = useAuth();
  const isManager = hasRole(['GERENTE']);
  const { trash } = useTrash();

  // Filters & View State
  const [productSubTab, setProductSubTab] = useState<'inventory' | 'categories'>('inventory');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeQuickFilter, setActiveQuickFilter] = useState<'all' | 'lowStock' | 'expiring' | 'outOfStock' | 'highMargin'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');

  // Multi-Selection State
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Modals & Drawers State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalMode, setEditModalMode] = useState<'create' | 'edit'>('create');
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);

  const [isQuickStockModalOpen, setIsQuickStockModalOpen] = useState(false);
  const [printingLabelProduct, setPrintingLabelProduct] = useState<Product | null>(null);

  // Deletion Modal States
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string; clickPos?: { clientX: number; clientY: number } } | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  const [activeToasts, setActiveToasts] = useState<StockToast[]>([]);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [restrictedActionAlert, setRestrictedActionAlert] = useState<string | null>(null);
  const [copiedSkuId, setCopiedSkuId] = useState<string | null>(null);

  // Ref to track products that already triggered critical stock alert
  const initialAlertTriggeredRef = useRef(false);
  const lastKnownStockMapRef = useRef<Map<string, number>>(new Map());

  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener (/ to focus search, N for new product, E for quick entry, G for grid, T for table)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when inside inputs or textareas
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if ((e.key === 'n' || e.key === 'N') && isManager) {
        e.preventDefault();
        handleOpenCreateModal();
      } else if ((e.key === 'e' || e.key === 'E') && isManager) {
        e.preventDefault();
        setIsQuickStockModalOpen(true);
      } else if (e.key === 'g' || e.key === 'G') {
        setViewMode('grid');
      } else if (e.key === 't' || e.key === 'T') {
        setViewMode('table');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isManager]);

  // Handler: Load Example Products for testing/demo
  const handleLoadExampleProducts = () => {
    const demoItems: Product[] = [
      {
        id: `demo-p1-${Date.now()}`,
        name: 'Óleo Alimentar Saúde 1L',
        barcode: '5601234567891',
        sku: 'OLE-SAU-01',
        category: 'Alimentação',
        costPrice: 5800,
        salePrice: 7500,
        stock: 45,
        minStock: 15,
        unit: 'un',
        status: 'active',
        batch: 'LT-2026-A1',
        supplier: 'Distribuidora Luanda Sul',
        expirationDate: '2026-12-31',
        updatedAt: new Date().toISOString().split('T')[0],
      },
      {
        id: `demo-p2-${Date.now()}`,
        name: 'Arroz Agulha Tio Lucas 5kg',
        barcode: '5601234567892',
        sku: 'ARR-LUC-05',
        category: 'Alimentação',
        costPrice: 9500,
        salePrice: 12200,
        stock: 30,
        minStock: 10,
        unit: 'un',
        status: 'active',
        batch: 'LT-2026-B2',
        supplier: 'Agro Angola Lda',
        expirationDate: '2027-04-15',
        updatedAt: new Date().toISOString().split('T')[0],
      },
      {
        id: `demo-p3-${Date.now()}`,
        name: 'Leite em Pó Ninho 400g',
        barcode: '5601234567893',
        sku: 'LEI-NIN-40',
        category: 'Laticínios',
        costPrice: 3800,
        salePrice: 4800,
        stock: 4,
        minStock: 8,
        unit: 'un',
        status: 'low_stock',
        batch: 'LT-2026-C3',
        supplier: 'Importadora Central',
        expirationDate: '2026-11-20',
        updatedAt: new Date().toISOString().split('T')[0],
      },
      {
        id: `demo-p4-${Date.now()}`,
        name: 'Cerveja Cuca Lata 330ml',
        barcode: '5601234567894',
        sku: 'CER-CUC-33',
        category: 'Bebidas',
        costPrice: 480,
        salePrice: 650,
        stock: 120,
        minStock: 24,
        unit: 'un',
        status: 'active',
        batch: 'LT-2026-D4',
        supplier: 'Cuca BFA',
        expirationDate: '2026-09-30',
        updatedAt: new Date().toISOString().split('T')[0],
      },
      {
        id: `demo-p5-${Date.now()}`,
        name: 'Sabão em Barra Luanda 200g',
        barcode: '5601234567895',
        sku: 'SAB-LUA-20',
        category: 'Higiene & Limpeza',
        costPrice: 320,
        salePrice: 450,
        stock: 0,
        minStock: 20,
        unit: 'un',
        status: 'out_of_stock',
        batch: 'LT-2026-E5',
        supplier: 'Química Geral',
        updatedAt: new Date().toISOString().split('T')[0],
      },
      {
        id: `demo-p6-${Date.now()}`,
        name: 'Água Mineral Chela 1.5L',
        barcode: '5601234567896',
        sku: 'AGU-CHE-15',
        category: 'Bebidas',
        costPrice: 220,
        salePrice: 350,
        stock: 60,
        minStock: 20,
        unit: 'un',
        status: 'active',
        batch: 'LT-2026-F6',
        supplier: 'Águas de Angola',
        expirationDate: '2027-01-10',
        updatedAt: new Date().toISOString().split('T')[0],
      }
    ];

    setProducts(demoItems);
    showToast('6 artigos de exemplo carregados no inventário.', 'success');
  };

  // Handler: Import products from CSV
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
        if (lines.length <= 1) {
          toast.error('O ficheiro CSV está vazio ou contém apenas o cabeçalho.');
          return;
        }

        const delimiter = lines[0].includes(';') ? ';' : ',';
        const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/["']/g, ''));

        const parsedProducts: Product[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
          if (cols.length < 2) continue;

          const getCol = (keyCandidates: string[]) => {
            const idx = headers.findIndex(h => keyCandidates.some(k => h.includes(k)));
            return idx >= 0 && cols[idx] !== undefined ? cols[idx] : '';
          };

          const name = getCol(['nome', 'name', 'produto', 'artigo', 'descricao']) || `Artigo ${i}`;
          const salePrice = parseFloat(getCol(['preco', 'preço', 'venda', 'price', 'saleprice']).replace(',', '.')) || 0;
          const costPrice = parseFloat(getCol(['custo', 'cost', 'compra']).replace(',', '.')) || 0;
          const stock = parseInt(getCol(['stock', 'estoque', 'quantidade', 'qty', 'qtd']), 10) || 0;
          const minStock = parseInt(getCol(['min', 'minimo', 'mínimo']), 10) || 5;
          const barcode = getCol(['barcode', 'barra', 'codigo', 'código', 'ean']) || `GEN-${Date.now().toString().slice(-6)}-${i}`;
          const category = getCol(['categoria', 'category', 'grupo']) || 'Geral';
          const unit = getCol(['unidade', 'unit', 'un']) || 'un';

          parsedProducts.push({
            id: `prod-csv-${Date.now()}-${i}`,
            name,
            barcode,
            sku: barcode,
            category,
            salePrice,
            costPrice,
            stock,
            minStock,
            unit,
            status: stock === 0 ? 'out_of_stock' : stock <= minStock ? 'low_stock' : 'active',
            updatedAt: new Date().toISOString().split('T')[0],
          });
        }

        if (parsedProducts.length > 0) {
          setProducts(prev => [...prev, ...parsedProducts]);
          toast.success(`${parsedProducts.length} produtos importados com sucesso!`);
        } else {
          toast.error('Nenhum artigo pôde ser lido do CSV.');
        }
      } catch (err) {
        console.error('Erro ao importar CSV:', err);
        toast.error('Falha ao processar ficheiro CSV.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const categories = useMemo(() => {
    return ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  }, [products]);

  const removeToast = (id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  };

  const showToast = (
    message: string, 
    type: 'success' | 'info' | 'warning' = 'success',
    title?: string
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: StockToast = {
      id,
      type,
      title: title || (type === 'success' ? 'Operação Concluída' : 'Aviso'),
      message,
    };
    setActiveToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const showCriticalStockToast = (
    productName: string,
    stock: number,
    minStock: number,
    unit: string = 'un',
    targetProduct?: Product
  ) => {
    const isOut = stock <= 0;
    const id = `critical-toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: StockToast = {
      id,
      type: isOut ? 'out_of_stock' : 'critical_stock',
      title: isOut ? '🚨 Estoque Esgotado' : '⚠️ Nível Crítico de Estoque',
      message: isOut
        ? `O artigo "${productName}" esgotou completamente (0 ${unit}).`
        : `O artigo "${productName}" atingiu o nível crítico definido (${stock} de mín. ${minStock} ${unit}).`,
      productName,
      currentStock: stock,
      minStock,
      unit,
      actionLabel: isManager ? 'Repor Estoque' : 'Ver na Lista',
      onAction: () => {
        if (targetProduct) {
          handleViewDetails(targetProduct);
        } else {
          setActiveQuickFilter('lowStock');
          setSearchTerm(productName);
        }
        removeToast(id);
      }
    };

    setActiveToasts(prev => {
      const filtered = prev.filter(t => t.productName !== productName);
      return [...filtered, newToast];
    });

    setTimeout(() => {
      removeToast(id);
    }, 7000);
  };

  // Helper: Days until expiration
  const getDaysToExpiry = (expiryDateStr?: string): number | null => {
    if (!expiryDateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expiryDateStr);
    if (isNaN(expDate.getTime())) return null;
    expDate.setHours(0, 0, 0, 0);
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Helper: Format Date to DD/MM/YYYY
  const formatDateDisplay = (dateStr?: string): string => {
    if (!dateStr) return 'Sem validade';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  // Critical Stock Monitoring
  useEffect(() => {
    if (!products || products.length === 0) return;

    const criticalProducts = products.filter(p => p.stock <= p.minStock);

    if (!initialAlertTriggeredRef.current) {
      initialAlertTriggeredRef.current = true;
      products.forEach(p => lastKnownStockMapRef.current.set(p.id, p.stock));

      if (criticalProducts.length > 0) {
        if (criticalProducts.length === 1) {
          const single = criticalProducts[0];
          showCriticalStockToast(single.name, single.stock, single.minStock, single.unit || 'un', single);
        } else {
          const id = `critical-summary-${Date.now()}`;
          const summaryToast: StockToast = {
            id,
            type: 'critical_stock',
            title: '⚠️ Alerta de Estoque Crítico',
            message: `Existem ${criticalProducts.length} artigos que atingiram ou estão abaixo da quantidade mínima!`,
            actionLabel: 'Ver Artigos Críticos',
            onAction: () => {
              setActiveQuickFilter('lowStock');
              removeToast(id);
            }
          };
          setActiveToasts(prev => [...prev, summaryToast]);
          setTimeout(() => removeToast(id), 7000);
        }
      }
      return;
    }

    products.forEach(p => {
      const prevStock = lastKnownStockMapRef.current.get(p.id);
      const isNowCritical = p.stock <= p.minStock;
      const wasPreviouslyHigher = prevStock !== undefined && prevStock > p.minStock;

      if (isNowCritical && (wasPreviouslyHigher || prevStock === undefined)) {
        showCriticalStockToast(p.name, p.stock, p.minStock, p.unit || 'un', p);
      }

      lastKnownStockMapRef.current.set(p.id, p.stock);
    });
  }, [products]);

  // Metrics Calculation
  const metrics = useMemo(() => {
    let totalItems = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;
    let totalValue = 0;
    let totalCost = 0;

    products.forEach(p => {
      totalItems += p.stock;
      totalValue += (p.stock * p.salePrice);
      totalCost += (p.stock * (p.costPrice || 0));

      if (p.stock === 0) {
        outOfStockCount++;
      } else if (p.stock <= p.minStock) {
        lowStockCount++;
      }

      const days = getDaysToExpiry(p.expirationDate);
      if (days !== null) {
        if (days <= 0) {
          expiredCount++;
        } else if (days <= 30) {
          expiringCount++;
        }
      }
    });

    const averageMargin = totalValue > 0 ? Math.round(((totalValue - totalCost) / totalValue) * 100) : 0;

    return {
      totalArticles: products.length,
      totalItems,
      lowStockCount,
      outOfStockCount,
      expiringCount,
      expiredCount,
      totalExpiringAlerts: expiringCount + expiredCount,
      totalValue,
      totalCost,
      potentialProfit: totalValue - totalCost,
      averageMargin
    };
  }, [products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = 
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.barcode.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        (p.batch && p.batch.toLowerCase().includes(term)) ||
        (p.supplier && p.supplier.toLowerCase().includes(term)) ||
        (p.notes && p.notes.toLowerCase().includes(term));
        
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

      let matchesQuickFilter = true;
      if (activeQuickFilter === 'lowStock') {
        matchesQuickFilter = p.stock > 0 && p.stock <= p.minStock;
      } else if (activeQuickFilter === 'outOfStock') {
        matchesQuickFilter = p.stock <= 0;
      } else if (activeQuickFilter === 'expiring') {
        const days = getDaysToExpiry(p.expirationDate);
        matchesQuickFilter = days !== null && days <= 30;
      } else if (activeQuickFilter === 'highMargin') {
        const margin = p.salePrice > 0 ? ((p.salePrice - (p.costPrice || 0)) / p.salePrice) : 0;
        matchesQuickFilter = margin >= 0.35;
      }

      return matchesSearch && matchesCategory && matchesQuickFilter;
    });

    // Sort list
    return list.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'stock_asc':
          return a.stock - b.stock;
        case 'stock_desc':
          return b.stock - a.stock;
        case 'price_desc':
          return b.salePrice - a.salePrice;
        case 'price_asc':
          return a.salePrice - b.salePrice;
        case 'expiry_asc': {
          const daysA = getDaysToExpiry(a.expirationDate) ?? 9999;
          const daysB = getDaysToExpiry(b.expirationDate) ?? 9999;
          return daysA - daysB;
        }
        default:
          return 0;
      }
    });
  }, [products, searchTerm, selectedCategory, activeQuickFilter, sortBy]);

  // Handlers for Modals & Actions
  const handleOpenCreateModal = () => {
    if (!isManager) {
      setRestrictedActionAlert('O cadastro de novos artigos e catálogo requer perfil GERENTE.');
      return;
    }
    setEditModalMode('create');
    setProductToEdit(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    if (!isManager) {
      setRestrictedActionAlert('Alteração de preços e dados de produtos requer perfil GERENTE.');
      return;
    }
    setEditModalMode('edit');
    setProductToEdit(product);
    setIsEditModalOpen(true);
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProductForDetail(product);
    setIsDetailDrawerOpen(true);
  };

  const handleSaveProduct = async (productPayload: Partial<Product>, isEditing: boolean) => {
    if (!isManager) {
      setRestrictedActionAlert('Operação restrita a Gerente.');
      return;
    }

    if (isEditing && productToEdit) {
      const updated: Product = {
        ...productToEdit,
        ...productPayload,
      } as Product;

      setProducts(prev => prev.map(p => p.id === productToEdit.id ? updated : p));
      
      if (selectedProductForDetail?.id === productToEdit.id) {
        setSelectedProductForDetail(updated);
      }

      showToast(`Artigo "${updated.name}" atualizado com sucesso.`);
      supabaseService.insertProduct(updated).catch(err => console.warn('Supabase sync:', err));
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: productPayload.name || 'Novo Artigo',
        sku: productPayload.sku || `MSK-${Math.floor(1000 + Math.random() * 9000)}`,
        barcode: productPayload.barcode || `560${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        category: productPayload.category || 'Medicamentos',
        saleType: productPayload.saleType || 'Unidade',
        supplier: productPayload.supplier || '',
        batch: productPayload.batch || '',
        expirationDate: productPayload.expirationDate || '',
        notes: productPayload.notes || '',
        costPrice: productPayload.costPrice || 0,
        salePrice: productPayload.salePrice || 0,
        stock: productPayload.stock || 0,
        minStock: productPayload.minStock !== undefined ? productPayload.minStock : 5,
        unit: productPayload.unit || 'un',
        status: productPayload.status || 'active',
        imageUrl: productPayload.imageUrl || '',
        updatedAt: new Date().toISOString().split('T')[0],
      };

      setProducts(prev => [newProd, ...prev]);
      showToast(`Novo artigo "${newProd.name}" cadastrado.`);
      supabaseService.insertProduct(newProd).catch(err => console.warn('Supabase sync:', err));
    }
  };

  const handleDeleteProduct = (id: string, name: string, clickPos?: { clientX: number; clientY: number }) => {
    if (!isManager) {
      setRestrictedActionAlert('Remoção de artigos requer perfil GERENTE.');
      return;
    }
    setProductToDelete({ id, name, clickPos });
  };

  const confirmDeleteProduct = async (e?: React.MouseEvent) => {
    if (!productToDelete) return;
    const { id, name } = productToDelete;
    const targetProduct = products.find(p => p.id === id);
    const clickCoords = productToDelete.clickPos || (e ? { clientX: e.clientX, clientY: e.clientY } : undefined);
    setIsDeletingProduct(true);
    try {
      setProducts(prev => prev.filter(p => p.id !== id));
      if (selectedProductForDetail?.id === id) {
        setIsDetailDrawerOpen(false);
      }
      setSelectedProductIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      if (targetProduct) {
        trash({
          id: targetProduct.id,
          name: targetProduct.name,
          type: 'product',
          typeLabel: 'Artigo',
          data: targetProduct,
          onRestore: (restored: Product) => {
            setProducts(prev => [restored, ...prev]);
            supabaseService.insertProduct(restored).catch(err => console.warn('Supabase sync:', err));
          },
          onPermanentDelete: (item: Product) => {
            supabaseService.deleteProduct(item.id).catch(err => console.warn('Supabase delete:', err));
          },
        }, clickCoords);
      }

      toast.success(`Artigo "${name}" movido para a lixeira.`);
    } finally {
      setIsDeletingProduct(false);
      setProductToDelete(null);
    }
  };

  const confirmBatchDelete = async () => {
    if (selectedProductIds.size === 0) return;
    setIsBatchDeleting(true);
    const count = selectedProductIds.size;
    const itemsToDelete = products.filter(p => selectedProductIds.has(p.id));
    try {
      setProducts(prev => prev.filter(p => !selectedProductIds.has(p.id)));
      if (selectedProductForDetail && selectedProductIds.has(selectedProductForDetail.id)) {
        setIsDetailDrawerOpen(false);
      }
      setSelectedProductIds(new Set());

      itemsToDelete.forEach((prod) => {
        trash({
          id: prod.id,
          name: prod.name,
          type: 'product',
          typeLabel: 'Artigo',
          data: prod,
          onRestore: (restored: Product) => {
            setProducts(prev => [restored, ...prev]);
            supabaseService.insertProduct(restored).catch(err => console.warn('Supabase sync:', err));
          },
          onPermanentDelete: (item: Product) => {
            supabaseService.deleteProduct(item.id).catch(err => console.warn('Supabase delete:', err));
          },
        });
      });

      toast.success(`${count} artigos movidos para a lixeira.`);
    } finally {
      setIsBatchDeleting(false);
      setIsBatchDeleteModalOpen(false);
    }
  };

  const handleQuickStockAdjust = (product: Product, delta: number) => {
    if (!isManager) {
      setRestrictedActionAlert('Ajuste de estoque requer perfil GERENTE.');
      return;
    }

    const newStock = Math.max(0, product.stock + delta);
    const updated: Product = {
      ...product,
      stock: newStock,
      status: newStock === 0 ? 'out_of_stock' : newStock <= product.minStock ? 'low_stock' : 'active',
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setProducts(prev => prev.map(p => p.id === product.id ? updated : p));
    if (selectedProductForDetail?.id === product.id) {
      setSelectedProductForDetail(updated);
    }

    showToast(
      delta > 0 
        ? `+${delta} ${product.unit} adicionado a "${product.name}". (Total: ${newStock})` 
        : `-${Math.abs(delta)} ${product.unit} retirado de "${product.name}". (Total: ${newStock})`,
      'info'
    );
    supabaseService.insertProduct(updated).catch(err => console.warn('Supabase sync:', err));
  };

  const handleDrawerStockAdjust = (product: Product, newStock: number, reason: string) => {
    if (!isManager) {
      setRestrictedActionAlert('Ajuste de estoque requer perfil GERENTE.');
      return;
    }

    const diff = newStock - product.stock;
    const updated: Product = {
      ...product,
      stock: newStock,
      status: newStock === 0 ? 'out_of_stock' : newStock <= product.minStock ? 'low_stock' : 'active',
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setProducts(prev => prev.map(p => p.id === product.id ? updated : p));
    setSelectedProductForDetail(updated);

    showToast(`Estoque de "${product.name}" atualizado para ${newStock} (${reason}).`);
    supabaseService.insertProduct(updated).catch(err => console.warn('Supabase sync:', err));
  };

  const handleApplyQuickStockEntry = (
    productId: string, 
    qtyAdded: number, 
    reason: string, 
    newSupplier?: string, 
    newBatch?: string
  ) => {
    const target = products.find(p => p.id === productId);
    if (!target) return;

    const newStock = target.stock + qtyAdded;
    const updated: Product = {
      ...target,
      stock: newStock,
      supplier: newSupplier || target.supplier,
      batch: newBatch || target.batch,
      status: newStock <= target.minStock ? 'low_stock' : 'active',
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setProducts(prev => prev.map(p => p.id === productId ? updated : p));
    showToast(`Entrada de +${qtyAdded} ${target.unit} confirmada para "${target.name}".`);
    supabaseService.insertProduct(updated).catch(err => console.warn('Supabase sync:', err));
  };

  // Multi-select handlers
  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedProductIds(new Set(filteredProducts.map(p => p.id)));
  };

  const handleClearSelection = () => {
    setSelectedProductIds(new Set());
  };

  const handleBatchPrintLabels = () => {
    const selectedList = products.filter(p => selectedProductIds.has(p.id));
    if (selectedList.length > 0) {
      setPrintingLabelProduct(selectedList[0]);
      showToast(`Preparando etiquetas para ${selectedList.length} artigos.`);
    }
  };

  const handleBatchExport = () => {
    const selectedList = products.filter(p => selectedProductIds.has(p.id));
    exportInventoryToExcel(selectedList.length > 0 ? selectedList : filteredProducts);
    showToast(`Inventário exportado com sucesso para Excel.`);
  };

  const handleCopySku = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSkuId(id);
    setTimeout(() => setCopiedSkuId(null), 1800);
  };

  const hasActiveFilters = searchTerm !== '' || selectedCategory !== 'all' || activeQuickFilter !== 'all';

  return (
    <div id="view-products" className="workspace-view space-y-6 animate-in fade-in duration-200 relative pb-16">
      
      {/* Toast Notification Container */}
      <div 
        id="products-toast-container" 
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        {activeToasts.map((toast) => {
          const isCritical = toast.type === 'critical_stock' || toast.type === 'out_of_stock';
          const isSuccess = toast.type === 'success';

          return (
            <div
              key={toast.id}
              id={`toast-${toast.id}`}
              className={`pointer-events-auto rounded-3xl p-4 shadow-2xl border transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-2.5 bg-zinc-950/95 backdrop-blur-md ${
                toast.type === 'out_of_stock'
                  ? 'text-white border-rose-800 shadow-rose-950/50'
                  : isCritical
                  ? 'text-white border-amber-800 shadow-amber-950/50'
                  : isSuccess
                  ? 'text-white border-emerald-800 shadow-emerald-950/40'
                  : 'text-white border-zinc-800 shadow-zinc-950/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-2xl shrink-0 mt-0.5 ${
                    toast.type === 'out_of_stock'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : isCritical
                      ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                      : isSuccess
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {toast.type === 'out_of_stock' ? (
                      <AlertOctagon size={18} />
                    ) : isCritical ? (
                      <AlertTriangle size={18} />
                    ) : isSuccess ? (
                      <Check size={18} />
                    ) : (
                      <Boxes size={18} />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">
                        {toast.title}
                      </span>
                      {isCritical && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          toast.type === 'out_of_stock'
                            ? 'bg-rose-500 text-white'
                            : 'bg-amber-400 text-black'
                        }`}>
                          {toast.type === 'out_of_stock' ? 'Zero Estoque' : 'Crítico'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {toast.message}
                    </p>
                    {toast.currentStock !== undefined && toast.minStock !== undefined && (
                      <div className="flex items-center gap-2 pt-1 font-mono text-[11px]">
                        <span className="bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded-lg text-amber-300">
                          Estoque: {toast.currentStock} {toast.unit}
                        </span>
                        <span className="text-zinc-500">
                          Mín: {toast.minStock} {toast.unit}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                >
                  <X size={14} />
                </button>
              </div>

              {toast.onAction && toast.actionLabel && (
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800/80">
                  <button
                    type="button"
                    onClick={toast.onAction}
                    className="workspace-primary-action min-h-10 px-3 text-xs cursor-pointer"
                  >
                    <span>{toast.actionLabel}</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* BANNER DE UNDO NA PRÓPRIA PÁGINA (aparece instantaneamente aqui quando se apaga um artigo) */}
      <InlinePageUndoBanner pageType="product" />

      {/* ======= CABEÇALHO DA PÁGINA (fora do card, com ações alinhadas) ======= */}
      <section className="page-head">
        <div>
          <h1>Inventário</h1>
          <p>Controlo determinístico de catálogo, lotes, validade e precificação — funciona 100% offline.</p>
        </div>

        <div className="actions">
          {/* Segmento: Inventário vs Categorias */}
          <div className="seg" role="group" aria-label="Secção">
            <button
              type="button"
              aria-pressed={productSubTab === 'inventory'}
              onClick={() => setProductSubTab('inventory')}
            >
              <Boxes size={15} />
              <span>Inventário</span>
            </button>
            <button
              type="button"
              aria-pressed={productSubTab === 'categories'}
              onClick={() => setProductSubTab('categories')}
            >
              <FolderTree size={15} />
              <span>Categorias</span>
            </button>
          </div>

          {/* Segmento: Visualização Grade vs Tabela */}
          {productSubTab === 'inventory' && (
            <div className="seg" role="group" aria-label="Visualização">
              <button
                type="button"
                aria-pressed={viewMode === 'grid'}
                onClick={() => setViewMode('grid')}
                title="Modo Grade [G]"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                aria-pressed={viewMode === 'table'}
                onClick={() => setViewMode('table')}
                title="Modo Tabela [T]"
              >
                <List size={15} />
              </button>
            </div>
          )}

          <span className="divider-v"></span>

          {/* Exportar com só ícone */}
          <button
            type="button"
            className="btn btn--icon"
            title="Exportar dados para Excel (.xlsx)"
            onClick={() => {
              exportInventoryToExcel(filteredProducts);
              showToast('Planilha Excel gerada com sucesso.');
            }}
          >
            <Download size={16} />
          </button>

          {/* Entrada rápida */}
          {isManager && (
            <button
              type="button"
              className="btn"
              onClick={() => setIsQuickStockModalOpen(true)}
              title="Entrada rápida de mercadoria / reposição [E]"
            >
              <Boxes size={16} />
              <span>Entrada rápida</span>
            </button>
          )}

          {/* Ação Primária Única: Novo produto */}
          {isManager && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleOpenCreateModal}
              title="Cadastrar novo produto [N]"
            >
              <Plus size={16} />
              <span>Novo produto</span>
            </button>
          )}
        </div>
      </section>

      {productSubTab === 'categories' ? (
        <CategoriesSubscreenPage 
          inventoryProducts={products}
          onSelectCategoryFilter={(catName) => {
            setSelectedCategory(catName);
            setProductSubTab('inventory');
            showToast(`Filtrado por categoria: ${catName}`);
          }}
        />
      ) : (
        <>
          {/* ======= KPIs ======= */}
          <section className="kpis">
            {/* Card 1: Hero Total em Catálogo */}
            <article 
              className={`kpi kpi--hero cursor-pointer transition-transform ${activeQuickFilter === 'all' && selectedCategory === 'all' ? 'ring-2 ring-neutral-400' : ''}`}
              onClick={() => {
                setActiveQuickFilter('all');
                setSelectedCategory('all');
              }}
              title="Filtrar todos os produtos"
            >
              <div className="kpi__top">
                <span className="kpi__label">Total em catálogo</span>
                <span className="kpi__icon">
                  <Boxes size={16} />
                </span>
              </div>
              <div className="kpi__value" data-numeric="true">
                {metrics.totalArticles} <span>artigos</span>
              </div>
              <div className="bar">
                <i style={{ width: metrics.totalArticles > 0 ? '100%' : '0%' }}></i>
              </div>
              <div className="kpi__foot">
                <span>{isManager ? `Valoração ${formatKz(metrics.totalValue)}` : 'Catálogo ativo'}</span>
                <span data-numeric="true">{metrics.totalItems.toLocaleString('pt-AO')} un em stock</span>
              </div>
            </article>

            {/* Card 2: Abaixo do Mínimo */}
            <article 
              className={`kpi cursor-pointer ${activeQuickFilter === 'lowStock' ? 'ring-2 ring-neutral-900' : ''}`}
              onClick={() => setActiveQuickFilter(activeQuickFilter === 'lowStock' ? 'all' : 'lowStock')}
              title="Filtrar produtos abaixo do mínimo"
            >
              <div className="kpi__top">
                <span className="kpi__label">Abaixo do mínimo</span>
                <span className="kpi__icon">
                  <AlertTriangle size={16} />
                </span>
              </div>
              <div className="kpi__value" data-numeric="true">
                {metrics.lowStockCount} <span>artigos</span>
              </div>
              <div className="kpi__foot">
                <span>Requer reposição</span>
                {metrics.lowStockCount === 0 && metrics.outOfStockCount === 0 ? (
                  <span className="tag tag--ok">Tudo ok</span>
                ) : (
                  <span className="tag tag--warn">
                    {metrics.lowStockCount} críticos {metrics.outOfStockCount > 0 ? `+ ${metrics.outOfStockCount} zero` : ''}
                  </span>
                )}
              </div>
            </article>

            {/* Card 3: Validade Próxima */}
            <article 
              className={`kpi cursor-pointer ${activeQuickFilter === 'expiring' ? 'ring-2 ring-neutral-900' : ''}`}
              onClick={() => setActiveQuickFilter(activeQuickFilter === 'expiring' ? 'all' : 'expiring')}
              title="Filtrar lotes próximos da validade"
            >
              <div className="kpi__top">
                <span className="kpi__label">Validade próxima</span>
                <span className="kpi__icon">
                  <Clock size={16} />
                </span>
              </div>
              <div className="kpi__value" data-numeric="true">
                {metrics.totalExpiringAlerts} <span>lotes</span>
              </div>
              <div className="kpi__foot">
                <span>Prazo ≤ 30 dias</span>
                {metrics.totalExpiringAlerts === 0 ? (
                  <span className="tag tag--ok">Sem risco</span>
                ) : metrics.expiredCount > 0 ? (
                  <span className="tag tag--danger">{metrics.expiredCount} vencidos</span>
                ) : (
                  <span className="tag tag--warn">{metrics.expiringCount} a expirar</span>
                )}
              </div>
            </article>

            {/* Card 4: Margem Média (Gerente) ou Prontos para Venda (Atendente) */}
            {isManager ? (
              <article 
                className={`kpi cursor-pointer ${activeQuickFilter === 'highMargin' ? 'ring-2 ring-neutral-900' : ''}`}
                onClick={() => setActiveQuickFilter(activeQuickFilter === 'highMargin' ? 'all' : 'highMargin')}
                title="Filtrar produtos com alta margem (≥35%)"
              >
                <div className="kpi__top">
                  <span className="kpi__label">Margem média</span>
                  <span className="kpi__icon">
                    <TrendingUp size={16} />
                  </span>
                </div>
                <div className="kpi__value" data-numeric="true">
                  +{metrics.averageMargin}<span>%</span>
                </div>
                <div className="kpi__foot">
                  <span>Lucro potencial</span>
                  <span className="font-semibold text-neutral-800" data-numeric="true">{formatKz(metrics.potentialProfit)}</span>
                </div>
              </article>
            ) : (
              <article 
                className="kpi"
                title="Artigos com estoque disponível para venda imediata"
              >
                <div className="kpi__top">
                  <span className="kpi__label">Prontos para venda</span>
                  <span className="kpi__icon">
                    <Boxes size={16} />
                  </span>
                </div>
                <div className="kpi__value" data-numeric="true">
                  {Math.max(0, metrics.totalArticles - metrics.outOfStockCount)} <span>artigos</span>
                </div>
                <div className="kpi__foot">
                  <span>Catálogo de balcão</span>
                  <span className="tag tag--ok">Disponíveis</span>
                </div>
              </article>
            )}
          </section>

          {/* ======= FILTROS (um só bloco, duas linhas lógicas) ======= */}
          <section className="card-surface">
            <div className="toolbar-wrap">
              <div className="search-wrap">
                <Search size={16} />
                <input
                  ref={searchInputRef}
                  id="search-products-input"
                  type="search"
                  placeholder="Pesquisar por nome, código de barras, lote ou fornecedor… (/)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="chips-row" role="group" aria-label="Filtros rápidos">
                <button
                  type="button"
                  className="chip-btn"
                  aria-pressed={activeQuickFilter === 'all'}
                  onClick={() => setActiveQuickFilter('all')}
                >
                  Todos <b>{products.length}</b>
                </button>

                <button
                  type="button"
                  className="chip-btn"
                  aria-pressed={activeQuickFilter === 'lowStock'}
                  onClick={() => setActiveQuickFilter('lowStock')}
                >
                  <span className="dot dot--warn"></span>
                  Abaixo do mínimo <b>{metrics.lowStockCount}</b>
                </button>

                <button
                  type="button"
                  className="chip-btn"
                  aria-pressed={activeQuickFilter === 'outOfStock'}
                  onClick={() => setActiveQuickFilter('outOfStock')}
                >
                  <span className="dot dot--danger"></span>
                  Esgotados <b>{metrics.outOfStockCount}</b>
                </button>

                <button
                  type="button"
                  className="chip-btn"
                  aria-pressed={activeQuickFilter === 'expiring'}
                  onClick={() => setActiveQuickFilter('expiring')}
                >
                  <span className="dot dot--ok"></span>
                  Validade <b>{metrics.totalExpiringAlerts}</b>
                </button>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setActiveQuickFilter('all');
                    }}
                    title="Limpar todos os filtros"
                    className="chip-btn text-rose-600 hover:text-rose-700"
                  >
                    <FilterX size={13} />
                    <span>Limpar</span>
                  </button>
                )}
              </div>

              <div className="select-wrap" style={{ marginLeft: 'auto' }}>
                <label htmlFor="ord">Ordenar</label>
                <select
                  id="ord"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                >
                  <option value="name_asc">Nome (A–Z)</option>
                  <option value="name_desc">Nome (Z–A)</option>
                  <option value="stock_asc">Stock (menor primeiro)</option>
                  <option value="stock_desc">Stock (maior primeiro)</option>
                  <option value="expiry_asc">Validade (mais próxima)</option>
                  <option value="price_desc">Margem / Preço (maior primeiro)</option>
                  <option value="price_asc">Preço (menor primeiro)</option>
                </select>
              </div>
            </div>

            <div className="toolbar-row2">
              <span className="label-xs">Categorias</span>
              <div className="scroll-x-wrap">
                <button
                  type="button"
                  className="chip-btn"
                  aria-pressed={selectedCategory === 'all'}
                  onClick={() => setSelectedCategory('all')}
                >
                  Todas <b>{products.length}</b>
                </button>

                {categories.filter(c => c !== 'all').map((cat) => {
                  const count = products.filter(p => p.category === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      className="chip-btn"
                      aria-pressed={selectedCategory === cat}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      <span>{cat}</span>
                      <b>{count}</b>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setProductSubTab('categories')}
                  className="chip-btn btn--sm"
                  style={{ borderStyle: 'dashed', color: 'var(--muted)' }}
                  title="Gerir e criar categorias"
                >
                  + Criar categoria
                </button>
              </div>
            </div>
          </section>

          {/* Hidden File Input for CSV Import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,application/vnd.ms-excel"
            onChange={handleCsvFileUpload}
            className="hidden"
          />

          {/* ======= CONTEÚDO / ESTADO VAZIO ======= */}
          {products.length === 0 ? (
            <section className="empty-wrap card-surface">
              <div className="empty-box">
                <div className="empty-art">
                  <Boxes size={30} />
                </div>
                <h3>Nenhum produto cadastrado</h3>
                <p>Cadastre o primeiro artigo para começar o controlo de stock, preços e validades — ou importe um ficheiro existente.</p>
                <div className="empty-cta">
                  {isManager && (
                    <button
                      type="button"
                      onClick={handleOpenCreateModal}
                      className="btn btn--primary"
                    >
                      <Plus size={16} />
                      <span>Novo produto</span>
                    </button>
                  )}
                  {isManager && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn"
                    >
                      <Upload size={15} />
                      <span>Importar CSV</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleLoadExampleProducts}
                    className="btn btn--ghost"
                  >
                    <span>Ver exemplo</span>
                  </button>
                </div>
                <div className="empty-hints">
                  <span><kbd>N</kbd> novo produto</span>
                  <span><kbd>/</kbd> pesquisar</span>
                  <span><kbd>E</kbd> entrada rápida</span>
                </div>
              </div>
            </section>
          ) : filteredProducts.length === 0 ? (
            /* No search results */
            <div className="card-surface py-16 px-6 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 mb-3">
                <Search size={26} />
              </div>
              <h3 className="font-bold text-sm text-zinc-900">Nenhum resultado encontrado</h3>
              <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-4">
                Nenhum artigo corresponde à busca "{searchTerm}" ou aos filtros selecionados.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setActiveQuickFilter('all');
                }}
                className="btn btn--sm"
              >
                <RotateCcw size={13} />
                <span>Redefinir Filtros</span>
              </button>
            </div>
          ) : viewMode === 'grid' ? (
        /* GRID VIEW (VISUAL CARDS) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product, idx) => (
            <InventoryProductCard
              key={product.id}
              product={product}
              index={idx}
              isManager={isManager}
              isSelected={selectedProductIds.has(product.id)}
              onToggleSelect={handleToggleSelectProduct}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteProduct}
              onPrintLabel={(p) => setPrintingLabelProduct(p)}
              onViewDetails={handleViewDetails}
              onQuickStockAdjust={handleQuickStockAdjust}
            />
          ))}
        </div>
      ) : (
        /* TABLE VIEW (HIGH-DENSITY COMPACT) */
        <div className="workspace-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="workspace-table-head border-b border-zinc-200 font-semibold tracking-normal text-xs">
                  <th className="py-3.5 px-4 w-10 text-center">
                    {isManager && (
                      <input
                        type="checkbox"
                        checked={selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0}
                        onChange={() => {
                          if (selectedProductIds.size === filteredProducts.length) {
                            handleClearSelection();
                          } else {
                            handleSelectAll();
                          }
                        }}
                        className="w-4 h-4 rounded bg-zinc-100 border-zinc-300 text-zinc-900 accent-zinc-900 cursor-pointer"
                      />
                    )}
                  </th>
                  <th className="py-3.5 px-4">Produto / SKU</th>
                  <th className="py-3.5 px-4">Lote & Fornecedor</th>
                  <th className="py-3.5 px-4 text-center">Qtd Atual</th>
                  <th className="py-3.5 px-4 text-center">Est. Mínimo</th>
                  <th className="py-3.5 px-4">Validade</th>
                  <th className="py-3.5 px-4 text-right">Preço Venda</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {filteredProducts.map((p, idx) => {
                  const days = getDaysToExpiry(p.expirationDate);
                  const isOut = p.stock <= 0;
                  const isLow = p.stock > 0 && p.stock <= p.minStock;
                  const isExp = days !== null && days <= 0;
                  const isExpSoon = days !== null && days > 0 && days <= 30;

                  return (
                    <motion.tr 
                      key={p.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        duration: 0.22, 
                        delay: Math.min(idx * 0.03, 0.35),
                        ease: 'easeOut'
                      }}
                      className={`hover:bg-zinc-50/80 transition-colors group ${
                        selectedProductIds.has(p.id) ? 'bg-zinc-50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        {isManager && (
                          <input
                            type="checkbox"
                            checked={selectedProductIds.has(p.id)}
                            onChange={() => handleToggleSelectProduct(p.id)}
                            className="w-4 h-4 rounded bg-zinc-100 border-zinc-300 text-zinc-900 accent-zinc-900 cursor-pointer"
                          />
                        )}
                      </td>

                      {/* Produto / SKU */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div 
                            onClick={() => handleViewDetails(p)}
                            className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0 p-1 overflow-hidden cursor-pointer hover:border-zinc-400 transition-colors"
                          >
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                referrerPolicy="no-referrer"
                                className="max-h-8 w-auto object-contain"
                              />
                            ) : (
                              <span className="font-black text-xs text-zinc-400">
                                {p.name ? p.name.charAt(0).toUpperCase() : 'P'}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div 
                              onClick={() => handleViewDetails(p)}
                              className="font-bold text-zinc-900 text-xs hover:text-emerald-700 transition-colors truncate max-w-xs cursor-pointer"
                            >
                              {p.name}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-0.5">
                              <button
                                type="button"
                                onClick={() => handleCopySku(p.id, p.sku || p.barcode)}
                                className="font-mono text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
                                title="Copiar SKU"
                              >
                                <span>{p.sku}</span>
                                {copiedSkuId === p.id ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                              </button>
                              <span>•</span>
                              <span className="text-zinc-600">{p.category}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Lote & Fornecedor */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-zinc-800 text-xs">
                          {p.supplier || 'Fornecedor Padrão'}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5 font-mono">
                          {p.batch && (
                            <span className="text-zinc-700 bg-zinc-100 border border-zinc-200 px-1.5 py-0.2 rounded">
                              {p.batch}
                            </span>
                          )}
                          {p.notes && <span className="truncate max-w-[100px]">{p.notes}</span>}
                        </div>
                      </td>

                      {/* Qtd Atual com Ajuste Rápido */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 bg-zinc-50 border border-zinc-200 px-2 py-1 rounded-xl">
                          {isManager && (
                            <button
                              type="button"
                              onClick={() => handleQuickStockAdjust(p, -1)}
                              disabled={p.stock <= 0}
                              className="text-zinc-400 hover:text-zinc-900 disabled:opacity-30 cursor-pointer p-0.5"
                              title="Subtrair 1"
                            >
                              -
                            </button>
                          )}
                          <span className={`font-mono font-black text-xs px-1 ${
                            isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-zinc-900'
                          }`}>
                            {p.stock} <span className="text-[10px] text-zinc-500 font-normal">{p.unit}</span>
                          </span>
                          {isManager && (
                            <button
                              type="button"
                              onClick={() => handleQuickStockAdjust(p, 1)}
                              className="text-zinc-400 hover:text-zinc-900 cursor-pointer p-0.5"
                              title="Adicionar 1"
                            >
                              +
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Estoque Mínimo */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono text-xs text-zinc-600">
                        {p.minStock} {p.unit}
                      </td>

                      {/* Validade */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className={`font-mono text-xs font-semibold ${
                          isExp ? 'text-rose-600' : isExpSoon ? 'text-amber-600' : 'text-zinc-700'
                        }`}>
                          {formatDateDisplay(p.expirationDate)}
                        </div>
                        {days !== null && (
                          <div className="text-[10px] text-zinc-500">
                            {days < 0 ? `Vencido` : days === 0 ? 'Vence hoje' : `${days}d restantes`}
                          </div>
                        )}
                      </td>

                      {/* Preço de Venda */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-black text-zinc-950 text-xs">
                          {formatKz(p.salePrice)}
                        </div>
                        {p.costPrice > 0 && (
                          <div className="text-[10px] text-zinc-500 font-mono">
                            Custo: {formatKz(p.costPrice)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isExp ? (
                          <Badge variant="danger" label="Vencido" />
                        ) : isExpSoon ? (
                          <Badge variant="warning" label={`Vence em ${days}d`} />
                        ) : isOut ? (
                          <Badge variant="danger" label="Esgotado" />
                        ) : isLow ? (
                          <Badge variant="warning" label="Estoque Baixo" />
                        ) : (
                          <Badge variant="neutral" label="Normal" />
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleViewDetails(p)}
                            className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 border border-zinc-200 transition-colors cursor-pointer"
                            title="Raio-X / Detalhes"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setPrintingLabelProduct(p)}
                            className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 border border-zinc-200 transition-colors cursor-pointer"
                            title="Imprimir Etiqueta"
                          >
                            <Printer size={14} />
                          </button>

                          {isManager && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(p)}
                                className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 border border-zinc-200 transition-colors cursor-pointer"
                                title="Editar Artigo"
                              >
                                <Edit size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleDeleteProduct(p.id, p.name, { clientX: e.clientX, clientY: e.clientY })}
                                className="p-1.5 rounded-xl bg-zinc-100 hover:bg-rose-50 text-zinc-600 hover:text-rose-600 border border-zinc-200 hover:border-rose-200 transition-colors cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. MULTI-SELECT FLOATING BATCH ACTION BAR */}
      <InventoryBatchBar
        selectedCount={selectedProductIds.size}
        totalCount={filteredProducts.length}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onBatchPrintLabels={handleBatchPrintLabels}
        onBatchExport={handleBatchExport}
        onBatchDelete={() => setIsBatchDeleteModalOpen(true)}
      />

      {/* 6. MODAL UNIFICADO DE CRIAÇÃO / EDIÇÃO DE PRODUTO */}
      <InventoryEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
        mode={editModalMode}
      />

      {/* 7. DRAWER DE INSPEÇÃO / RAIO-X DO PRODUTO */}
      <InventoryDetailDrawer
        product={selectedProductForDetail}
        isOpen={isDetailDrawerOpen}
        isManager={isManager}
        onClose={() => setIsDetailDrawerOpen(false)}
        onEdit={(p) => {
          setIsDetailDrawerOpen(false);
          handleOpenEditModal(p);
        }}
        onDelete={handleDeleteProduct}
        onPrintLabel={(p) => setPrintingLabelProduct(p)}
        onStockAdjust={handleDrawerStockAdjust}
      />

      {/* 8. MODAL DE ENTRADA RÁPIDA DE ESTOQUE */}
      <InventoryQuickStockModal
        isOpen={isQuickStockModalOpen}
        products={products}
        onClose={() => setIsQuickStockModalOpen(false)}
        onApplyStockEntry={handleApplyQuickStockEntry}
      />

      {/* 9. MODAL DE IMPRESSÃO DE ETIQUETAS COM CÓDIGO DE BARRAS */}
      <ProductLabelPrintModal
        product={printingLabelProduct ? {
          name: printingLabelProduct.name,
          price: printingLabelProduct.salePrice,
          code: printingLabelProduct.barcode || printingLabelProduct.sku || `MSK-${printingLabelProduct.id.slice(0, 6)}`
        } : null}
        isOpen={!!printingLabelProduct}
        onClose={() => setPrintingLabelProduct(null)}
      />

      {/* 10. MODAL DE ALERTA DE ACESSO RESTRITO */}
      {restrictedActionAlert && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4 animate-in zoom-in-95 duration-150 text-xs text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
              <Lock size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-zinc-900">Ação Restrita a Gerente</h3>
              <p className="text-zinc-500 text-xs">
                {restrictedActionAlert}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-left text-[11px] text-zinc-700 space-y-1.5">
              <p className="font-bold text-zinc-900 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Matriz de Permissões Masakula:</span>
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-zinc-600">
                <li><strong>Consulta de Estoque:</strong> Caixa (👁️ Apenas Leitura)</li>
                <li><strong>Entrada / Ajuste / Preços:</strong> Gerente (✅ Permissão Total)</li>
              </ul>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRestrictedActionAlert(null);
                  setIsMatrixOpen(true);
                }}
                className="px-4 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold cursor-pointer border border-zinc-200 transition"
              >
                Ver Matriz de Acessos
              </button>
              <button
                type="button"
                onClick={() => setRestrictedActionAlert(null)}
                className="px-5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold cursor-pointer transition shadow-sm"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. MODAL DA MATRIZ DE PERMISSÕES */}
      <PermissionMatrixModal
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
      />

      {/* 12. MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE PRODUTO */}
      <ConfirmModal
        isOpen={!!productToDelete}
        title="Eliminar Artigo do Catálogo"
        description={`Tem a certeza de que deseja eliminar o artigo "${productToDelete?.name}"? Esta ação removerá o produto do catálogo e do inventário.`}
        confirmText="Sim, Eliminar Artigo"
        cancelText="Cancelar"
        isDestructive={true}
        isLoading={isDeletingProduct}
        onConfirm={confirmDeleteProduct}
        onClose={() => setProductToDelete(null)}
      />

      {/* 13. MODAL DE CONFIRMAÇÃO DE EXCLUSÃO EM MASSA */}
      <ConfirmModal
        isOpen={isBatchDeleteModalOpen}
        title="Eliminar Artigos Selecionados"
        description={`Tem a certeza de que deseja eliminar os ${selectedProductIds.size} artigos selecionados do catálogo?`}
        confirmText={`Sim, Eliminar ${selectedProductIds.size} Artigos`}
        cancelText="Cancelar"
        isDestructive={true}
        isLoading={isBatchDeleting}
        onConfirm={confirmBatchDelete}
        onClose={() => setIsBatchDeleteModalOpen(false)}
      />
      </>
      )}

    </div>
  );
};
