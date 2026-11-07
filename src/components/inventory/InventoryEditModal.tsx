import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Barcode, 
  DollarSign, 
  Boxes, 
  Tag, 
  Building2, 
  MapPin, 
  Calendar, 
  Check, 
  AlertCircle, 
  TrendingUp, 
  Image as ImageIcon,
  RotateCcw,
  RefreshCw,
  Plus,
  Scan
} from 'lucide-react';
import { Product, ProductStatus } from '../../types';
import { formatKz } from '../../utils/formatters';
import { SmartProductImageUpload } from '../SmartProductImageUpload';
import { hardwareService } from '../../services/hardwareIntegration';

interface InventoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<Product>, isEditing: boolean) => void;
  productToEdit?: Product | null;
  mode?: 'create' | 'edit';
}

const COMMON_CATEGORIES = [
  'Medicamentos',
  'Bebidas',
  'Alimentação',
  'Higiene & Cuidados',
  'Snacks & Doces',
  'Limpeza',
  'Acessórios',
  'Outros'
];

export const InventoryEditModal: React.FC<InventoryEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  mode = 'create',
}) => {
  const isEditing = mode === 'edit' && !!productToEdit;

  // Default future date (+6 months)
  const getDefaultExpiryDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0];
  };

  const [activeTab, setActiveTab] = useState<'details' | 'pricing' | 'stock' | 'image'>('details');

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'Medicamentos',
    supplier: '',
    batch: '',
    saleType: 'Unidade (un)',
    costPrice: '',
    salePrice: '',
    stock: '10',
    minStock: '5',
    expirationDate: getDefaultExpiryDate(),
    notes: '',
    unit: 'un',
    imageUrl: '',
  });

  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const [scannerFeedback, setScannerFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = hardwareService.onScan((scannedBarcode) => {
      setFormData(prev => ({ ...prev, barcode: scannedBarcode }));
      setScannerFeedback(`Código de fábrica capturado: ${scannedBarcode}`);
      hardwareService.playBeep('success');
      setTimeout(() => setScannerFeedback(null), 3500);
    });
    return () => unsubscribe();
  }, [isOpen]);

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name || '',
        sku: productToEdit.sku || '',
        barcode: productToEdit.barcode || '',
        category: productToEdit.category || 'Medicamentos',
        supplier: productToEdit.supplier || '',
        batch: productToEdit.batch || '',
        saleType: productToEdit.saleType || 'Unidade (un)',
        costPrice: productToEdit.costPrice !== undefined ? productToEdit.costPrice.toString() : '',
        salePrice: productToEdit.salePrice !== undefined ? productToEdit.salePrice.toString() : '',
        stock: productToEdit.stock !== undefined ? productToEdit.stock.toString() : '10',
        minStock: productToEdit.minStock !== undefined ? productToEdit.minStock.toString() : '5',
        expirationDate: productToEdit.expirationDate || getDefaultExpiryDate(),
        notes: productToEdit.notes || '',
        unit: productToEdit.unit || 'un',
        imageUrl: productToEdit.imageUrl || '',
      });
    } else {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const randomSku = `MSK-${randomSuffix}`;
      const randomBatch = `L-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

      setFormData({
        name: '',
        sku: randomSku,
        barcode: '', // Não é mais gerado pelo sistema: depende integralmente da embalagem de fábrica
        category: 'Medicamentos',
        supplier: '',
        batch: randomBatch,
        saleType: 'Unidade (un)',
        costPrice: '',
        salePrice: '',
        stock: '10',
        minStock: '5',
        expirationDate: getDefaultExpiryDate(),
        notes: '',
        unit: 'un',
        imageUrl: '',
      });
    }
    setActiveTab('details');
    setValidationErrors({});
    setScannerFeedback(null);
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  // Real-time Margin & Profit calculations
  const cost = parseFloat(formData.costPrice) || 0;
  const sale = parseFloat(formData.salePrice) || 0;
  const unitProfit = sale - cost;
  const profitMarginPercent = sale > 0 ? ((unitProfit / sale) * 100).toFixed(1) : '0';
  const markupPercent = cost > 0 ? (((sale - cost) / cost) * 100).toFixed(1) : '0';

  const validate = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'O nome do produto é obrigatório.';
    }
    if (!formData.barcode.trim()) {
      errors.barcode = 'O código de barras é obrigatório.';
    }
    const costVal = parseFloat(formData.costPrice);
    if (isNaN(costVal) || costVal < 0) {
      errors.costPrice = 'Insira um preço de custo válido (≥ 0 Kz).';
    }
    const saleVal = parseFloat(formData.salePrice);
    if (isNaN(saleVal) || saleVal <= 0) {
      errors.salePrice = 'Insira um preço de venda válido (> 0 Kz).';
    }
    const stockQty = parseInt(formData.stock);
    if (isNaN(stockQty) || stockQty < 0) {
      errors.stock = 'Quantidade de estoque inválida.';
    }
    const minStockQty = parseInt(formData.minStock);
    if (isNaN(minStockQty) || minStockQty < 0) {
      errors.minStock = 'Quantidade mínima inválida.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const costVal = parseFloat(formData.costPrice) || 0;
    const saleVal = parseFloat(formData.salePrice) || 0;
    const stockQty = parseInt(formData.stock) || 0;
    const minQty = parseInt(formData.minStock) || 0;

    let status: ProductStatus = 'active';
    if (stockQty === 0) status = 'out_of_stock';
    else if (stockQty <= minQty) status = 'low_stock';

    const productPayload: Partial<Product> = {
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      barcode: formData.barcode.trim(),
      category: formData.category,
      supplier: formData.supplier.trim(),
      batch: formData.batch.trim(),
      expirationDate: formData.expirationDate,
      notes: formData.notes.trim(),
      saleType: formData.saleType,
      costPrice: costVal,
      salePrice: saleVal,
      stock: stockQty,
      minStock: minQty,
      unit: formData.unit || 'un',
      status,
      imageUrl: formData.imageUrl || '',
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSave(productPayload, isEditing);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900">
              {isEditing ? <Boxes size={20} /> : <Plus size={22} className="stroke-[3]" />}
            </div>
            <div>
              <h2 className="text-base font-black text-zinc-900">
                {isEditing ? `Editar Artigo: ${productToEdit?.name}` : 'Cadastrar Novo Produto & Artigo'}
              </h2>
              <p className="text-xs text-zinc-500">
                {isEditing ? 'Atualize preços, lotes, validades e dados do estoque' : 'Preencha as informações para registrar no catálogo'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-[var(--line)] bg-[var(--surface-subtle)] shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-[var(--radius-control)] transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'details'
                ? 'border-[var(--ink)] text-[var(--ink)] bg-white font-bold'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--ink)]'
            }`}
          >
            <Tag size={13} />
            <span>Dados Principais</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-[var(--radius-control)] transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'pricing'
                ? 'border-[var(--ink)] text-[var(--ink)] bg-white font-bold'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--ink)]'
            }`}
          >
            <DollarSign size={13} />
            <span>Preço & Margem</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-[var(--radius-control)] transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'stock'
                ? 'border-[var(--ink)] text-[var(--ink)] bg-white font-bold'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--ink)]'
            }`}
          >
            <Boxes size={13} />
            <span>Estoque & Lote</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-[var(--radius-control)] transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'image'
                ? 'border-[var(--ink)] text-[var(--ink)] bg-white font-bold'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--ink)]'
            }`}
          >
            <Sparkles size={13} />
            <span>Foto & Imagem</span>
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
          
          {/* TAB 1: DADOS PRINCIPAIS */}
          {activeTab === 'details' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Nome do Produto */}
              <div>
                <label className="text-xs font-bold text-zinc-700 mb-1.5 block">
                  Nome do Produto / Artigo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Paracetamol 500mg Caixa 20 Comprimidos"
                  className={`w-full bg-zinc-50 focus:bg-white border rounded-2xl px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 ${
                    validationErrors.name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-zinc-300'
                  }`}
                  required
                />
                {validationErrors.name && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {validationErrors.name}
                  </p>
                )}
              </div>

              {/* Categoria & Unidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 mb-1.5 block">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
                  >
                    {COMMON_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 mb-1.5 block">
                    Unidade de Medida
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
                  >
                    <option value="un">Unidade (un)</option>
                    <option value="cx">Caixa (cx)</option>
                    <option value="pct">Pacote (pct)</option>
                    <option value="fr">Frasco (fr)</option>
                    <option value="kg">Quilograma (kg)</option>
                    <option value="l">Litro (l)</option>
                  </select>
                </div>
              </div>

              {/* SKU & Código de Barras de Fábrica */}
              <div className="space-y-3">
                {/* Código de Barras de Fábrica (com captura do aparelho de bipar) */}
                <div className="bg-[var(--surface-subtle)] p-3.5 rounded-[var(--radius-control)] border border-[var(--line)] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scan size={15} className="text-[var(--text-secondary)]" />
                      <label className="text-xs font-semibold text-[var(--ink)]">
                        Código de Barras de Fábrica (Embalagem) *
                      </label>
                    </div>
                    <span className="badge">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink)] mr-1" />
                      Leitor Ativo
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="Aponte o leitor para o código na embalagem ou digite..."
                      className={`flex-1 bg-white border rounded-[var(--radius-control)] px-3.5 py-2 text-xs font-mono font-bold text-[var(--ink)] focus:outline-none focus:border-[var(--line-strong)] ${
                        validationErrors.barcode ? 'border-[var(--danger)] ring-1 ring-[var(--danger)]' : 'border-[var(--line)]'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const code = prompt('Simulação / Digitação do Leitor de Barras:');
                        if (code && code.trim()) {
                          setFormData(prev => ({ ...prev, barcode: code.trim() }));
                          hardwareService.playBeep('success');
                          setScannerFeedback(`Código de fábrica capturado: ${code.trim()}`);
                        }
                      }}
                      className="btn--secondary h-9"
                    >
                      <Scan size={13} />
                      <span>Bipar</span>
                    </button>
                  </div>

                  {scannerFeedback ? (
                    <p className="text-[11px] font-semibold text-[var(--success-text)] bg-[var(--success-soft)] p-2 rounded-[var(--radius-control)] flex items-center gap-1.5">
                      <Check size={13} /> {scannerFeedback}
                    </p>
                  ) : (
                    <p className="text-[10px] text-[var(--text-secondary)]">
                      O sistema não gera códigos de barras. Utilize o código de barras original impresso de fábrica no produto.
                    </p>
                  )}

                  {validationErrors.barcode && (
                    <p className="text-[11px] text-[var(--danger-text)] mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {validationErrors.barcode}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 mb-1.5 block">
                    Código SKU Interno (Identificador de Artigo)
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="MSK-1001"
                    className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 rounded-2xl px-3.5 py-2 text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
                  />
                </div>
              </div>

              {/* Localização / Prateleira */}
              <div>
                <label className="text-xs font-bold text-zinc-700 mb-1.5 block">
                  Localização / Observação de Prateleira
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ex: Prateleira B3, Gaveta 2, Corredor Principal"
                  className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 rounded-2xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
                />
              </div>
            </div>
          )}

          {/* TAB 2: PREÇO & MARGEM */}
          {activeTab === 'pricing' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Preço de Custo */}
                <div>
                  <label className="text-xs font-bold text-zinc-700 mb-1.5 block">
                    Preço de Custo (Kz) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 rounded-2xl pl-3.5 pr-10 py-2.5 text-sm font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">
                      Kz
                    </span>
                  </div>
                  {validationErrors.costPrice && (
                    <p className="text-[11px] text-rose-600 mt-1">{validationErrors.costPrice}</p>
                  )}
                </div>

                {/* Preço de Venda */}
                <div>
                  <label className="text-xs font-bold text-zinc-700 mb-1.5 block">
                    Preço de Venda ao Público (Kz) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formData.salePrice}
                      onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 rounded-2xl pl-3.5 pr-10 py-2.5 text-sm font-mono font-bold text-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">
                      Kz
                    </span>
                  </div>
                  {validationErrors.salePrice && (
                    <p className="text-[11px] text-rose-600 mt-1">{validationErrors.salePrice}</p>
                  )}
                </div>
              </div>

              {/* Painel de Cálculo em Tempo Real de Lucro e Margem */}
              <div className="bg-zinc-50 rounded-3xl p-4 border border-zinc-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-600 flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-emerald-600" />
                    <span>Simulação de Lucro & Margem Bruta</span>
                  </span>
                  <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                    parseFloat(profitMarginPercent) >= 30 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : parseFloat(profitMarginPercent) > 0 
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    Margem: {profitMarginPercent}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-white p-3 rounded-2xl border border-zinc-200">
                    <span className="text-[10px] text-zinc-500 block">Lucro Bruto Unitário</span>
                    <p className="text-sm font-black text-emerald-600 mt-0.5">{formatKz(unitProfit)}</p>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-zinc-200">
                    <span className="text-[10px] text-zinc-500 block">Markup sobre Custo</span>
                    <p className="text-sm font-black text-zinc-900 mt-0.5">+{markupPercent}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ESTOQUE & LOTE */}
          {activeTab === 'stock' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 mb-1.5 block">
                    Quantidade em Estoque *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 rounded-2xl px-3.5 py-2.5 text-sm font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 mb-1.5 block">
                    Estoque Mínimo de Alerta *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 rounded-2xl px-3.5 py-2.5 text-sm font-mono font-bold text-amber-700 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
                    required
                  />
                </div>
              </div>

              {/* Lote & Validade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 mb-1.5 block">
                    Número do Lote
                  </label>
                  <input
                    type="text"
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    placeholder="Ex: L-2026-99"
                    className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 mb-1.5 block">
                    Data de Validade (Expiração)
                  </label>
                  <input
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
                  />
                </div>
              </div>

              {/* Fornecedor */}
              <div>
                <label className="text-xs font-bold text-zinc-700 mb-1.5 block">
                  Fornecedor / Distribuidor
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Ex: Distribuidora Nacional de Medicamentos Lda"
                  className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 rounded-2xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
                />
              </div>
            </div>
          )}

          {/* TAB 4: FOTO & IA */}
          {activeTab === 'image' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-zinc-50 p-4 rounded-3xl border border-zinc-200">
                <SmartProductImageUpload
                  initialImageUrl={formData.imageUrl}
                  onImageProcessed={(processedUrl) => {
                    setFormData(prev => ({ ...prev, imageUrl: processedUrl }));
                  }}
                />
              </div>
            </div>
          )}

          {/* Modal Actions Footer */}
          <div className="pt-4 border-t border-[var(--line)] flex items-center justify-between gap-3 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="btn--secondary"
            >
              Cancelar
            </button>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="btn--primary"
              >
                <Check size={14} />
                <span>{isEditing ? 'Salvar Alterações' : 'Cadastrar Produto'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
