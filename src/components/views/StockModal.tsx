import React, { useState, useEffect } from 'react';
import { 
  X, 
  Barcode, 
  Sparkles, 
  Boxes, 
  DollarSign, 
  Tag, 
  Layers, 
  AlertCircle, 
  Check, 
  Percent,
  Calendar,
  Truck,
  MapPin,
  PackageCheck,
  Image as ImageIcon,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { Product, ProductStatus } from '../../types';
import { formatKz } from '../../utils/formatters';
import { BorderParticles } from '../admin/BorderParticles';

interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<Product>, isEditing: boolean) => void;
  productToEdit?: Product | null;
  mode?: 'create' | 'edit' | 'stock_entry';
}

export const StockModal: React.FC<StockModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  mode = 'stock_entry',
}) => {
  // Default future date (+6 months)
  const getDefaultExpiryDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0];
  };

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

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const triggerParticles = () => {
    setShowParticles(true);
    setTimeout(() => {
      setShowParticles(false);
    }, 2800);
  };

  const processImageFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    setImageFile(file);
    triggerParticles();

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPreviewUrl(base64);
      setFormData(prev => ({ ...prev, imageUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processImageFile(file);
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
    processImageFile(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setShowParticles(false);
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

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
        costPrice: productToEdit.costPrice ? productToEdit.costPrice.toString() : '',
        salePrice: productToEdit.salePrice ? productToEdit.salePrice.toString() : '',
        stock: productToEdit.stock !== undefined ? productToEdit.stock.toString() : '10',
        minStock: productToEdit.minStock !== undefined ? productToEdit.minStock.toString() : '5',
        expirationDate: productToEdit.expirationDate || getDefaultExpiryDate(),
        notes: productToEdit.notes || '',
        unit: productToEdit.unit || 'un',
        imageUrl: productToEdit.imageUrl || '',
      });
      setPreviewUrl(productToEdit.imageUrl || null);
    } else {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const randomBarcode = `560${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const randomSku = `MSK-${randomSuffix}`;
      const randomBatch = `L-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

      setFormData({
        name: '',
        sku: randomSku,
        barcode: randomBarcode,
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
      setPreviewUrl(null);
    }
    setImageFile(null);
    setShowParticles(false);
    setValidationErrors({});
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const generateAutomaticCodes = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const randomBarcode = `560${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const randomSku = `MSK-${randomSuffix}`;
    const randomBatch = `L-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    setFormData(prev => ({
      ...prev,
      sku: randomSku,
      barcode: randomBarcode,
      batch: randomBatch,
    }));
  };

  const validate = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'O nome do produto é obrigatório.';
    }
    if (!formData.barcode.trim()) {
      errors.barcode = 'O código de barras é obrigatório.';
    }
    const cost = parseFloat(formData.costPrice);
    if (isNaN(cost) || cost < 0) {
      errors.costPrice = 'Insira um preço de custo válido (≥ 0 Kz).';
    }
    const sale = parseFloat(formData.salePrice);
    if (isNaN(sale) || sale <= 0) {
      errors.salePrice = 'Insira um preço de venda válido (> 0 Kz).';
    } else if (!isNaN(cost) && sale < cost) {
      errors.salePrice = 'Aviso: Preço de venda inferior ao custo.';
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
    return Object.keys(errors).length === 0 || (Object.keys(errors).length === 1 && errors.salePrice?.startsWith('Aviso'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const cost = parseFloat(formData.costPrice) || 0;
    const sale = parseFloat(formData.salePrice) || 0;
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
      costPrice: cost,
      salePrice: sale,
      stock: stockQty,
      minStock: minQty,
      unit: formData.unit,
      status,
      imageUrl: previewUrl || formData.imageUrl || undefined,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSave(productPayload, !!productToEdit);
    onClose();
  };

  // Live Profit Margin Calculation
  const costNum = parseFloat(formData.costPrice) || 0;
  const saleNum = parseFloat(formData.salePrice) || 0;
  const profitKz = saleNum - costNum;
  const marginPercent = saleNum > 0 ? ((profitKz / saleNum) * 100).toFixed(1) : '0';

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-zinc-950 text-white">
                <Boxes size={20} className="text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-zinc-950">
                  {mode === 'stock_entry' 
                    ? 'Registrar Entrada de Estoque' 
                    : productToEdit 
                    ? 'Editar Artigo e Imagem' 
                    : 'Novo Artigo / Entrada'}
                </h3>
                <p className="text-xs text-zinc-400">
                  Preencha as informações de lote, validade, foto do produto e valores em Kwanzas (Kz)
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Seção de Foto do Artigo com Partículas Verdes */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700">Foto do Produto (PNG Transparente / WebP / JPG)</label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={showParticles ? { animation: 'borderGlowPulse 1.8s ease-in-out infinite' } : undefined}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-4 transition-all duration-300 relative overflow-visible ${
                showParticles || previewUrl
                  ? 'border-[#32D583] bg-emerald-50/20'
                  : isDragging
                  ? 'border-[#E1FB15] bg-lime-50/50 scale-[0.99]'
                  : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100/80'
              }`}
            >
              <BorderParticles active={showParticles} count={28} />

              {previewUrl ? (
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full py-1">
                  <div className="relative w-24 h-24 flex items-center justify-center bg-white rounded-xl p-2 border border-zinc-200 shadow-xs shrink-0">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="max-h-20 w-auto object-contain drop-shadow-md pointer-events-none animate-in zoom-in-75 duration-300"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      title="Eliminar Foto"
                      className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 shadow-md transition-colors cursor-pointer z-10"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div>
                      <span className="font-bold text-zinc-900 text-xs block">Imagem Cadastrada</span>
                      <span className="text-[11px] text-zinc-500">Exibida nos cards do PDV e nas etiquetas</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold cursor-pointer transition shadow-xs">
                        <RefreshCw size={13} className="text-[#32D583]" />
                        <span>Trocar Imagem</span>
                        <input
                          type="file"
                          accept="image/png,image/webp,image/jpeg"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold cursor-pointer transition"
                      >
                        <Trash2 size={13} />
                        <span>Eliminar Foto</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center cursor-pointer py-3 w-full text-center">
                  <div className="w-10 h-10 rounded-xl bg-zinc-200/70 flex items-center justify-center text-zinc-500 mb-1.5">
                    <ImageIcon size={20} className="text-zinc-600" />
                  </div>
                  <span className="text-xs font-bold text-zinc-800">Carregar Foto do Produto</span>
                  <span className="text-[11px] text-zinc-400 mt-0.5">Arraste para esta área ou clique para selecionar</span>
                  <span className="text-[10px] text-emerald-600 font-semibold mt-1">Recomendado: Fundo Transparente (PNG/WebP)</span>
                  <input
                    type="file"
                    accept="image/png,image/webp,image/jpeg"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Linha 1: Nome do Produto & SKU */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-zinc-700">
                  Nome do Produto <span className="text-rose-500">*</span>
                </label>
                {validationErrors.name && (
                  <span className="text-[10px] font-semibold text-rose-500">{validationErrors.name}</span>
                )}
              </div>
              <input
                type="text"
                required
                placeholder="Ex: Soro Fisiológico 500ml, Amoxicilina 500mg..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none transition-all ${
                  validationErrors.name ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">SKU / Código</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Ex: MSK-1092"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-mono text-xs focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
              />
            </div>
          </div>

          {/* Linha 2: Código de Barras com Gerador Automático */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-zinc-700">Código de Barras EAN-13 <span className="text-rose-500">*</span></label>
              <button
                type="button"
                onClick={generateAutomaticCodes}
                className="text-[11px] font-semibold text-zinc-900 hover:text-emerald-700 flex items-center gap-1 cursor-pointer bg-zinc-100 hover:bg-emerald-50 px-2.5 py-1 rounded-xl transition-colors border border-gray-200"
              >
                <Sparkles size={12} className="text-amber-500" />
                <span>Gerar Códigos Automáticos</span>
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Barcode size={16} />
              </div>
              <input
                type="text"
                required
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="5601234567890"
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-zinc-50 border font-mono text-xs text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none ${
                  validationErrors.barcode ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
                }`}
              />
            </div>
            {validationErrors.barcode && (
              <span className="text-[10px] font-semibold text-rose-500">{validationErrors.barcode}</span>
            )}
          </div>

          {/* Linha 3: Categoria, Fornecedor e Lote */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Categoria</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
              >
                <option value="Medicamentos">Medicamentos</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Informática">Informática</option>
                <option value="Alimentação">Alimentação</option>
                <option value="Higiene">Higiene</option>
                <option value="Material Médico">Material Médico</option>
                <option value="Geral">Geral</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Fornecedor / Distribuidor</label>
              <input
                type="text"
                placeholder="Ex: Medis Angola, AngoAlissar..."
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Número do Lote</label>
              <input
                type="text"
                placeholder="Ex: L-2026-089"
                value={formData.batch}
                onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 font-mono text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
              />
            </div>
          </div>

          {/* Linha 4: Preço de Custo, Preço de Venda e Margem em Tempo Real */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-zinc-50 border border-gray-200">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-zinc-700">Preço de Custo (Kz) <span className="text-rose-500">*</span></label>
              </div>
              <input
                type="number"
                step="any"
                min="0"
                required
                placeholder="0"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-zinc-900 font-semibold focus:ring-2 focus:ring-zinc-950 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Preço de Venda (Kz) <span className="text-rose-500">*</span></label>
              <input
                type="number"
                step="any"
                min="0"
                required
                placeholder="0"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-zinc-900 font-semibold focus:ring-2 focus:ring-zinc-950 focus:outline-none"
              />
            </div>

            {/* Cálculo de Margem e Lucro */}
            <div className="space-y-1 flex flex-col justify-end">
              <span className="font-semibold text-zinc-500 text-[11px]">Margem de Lucro Estimada</span>
              <div className="p-2 rounded-xl bg-zinc-200/60 border border-zinc-200 flex items-center justify-between">
                <span className="font-bold text-zinc-700">{formatKz(profitKz > 0 ? profitKz : 0)}</span>
                <span className={`text-[11px] font-black px-1.5 py-0.5 rounded ${profitKz >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {marginPercent}%
                </span>
              </div>
            </div>
          </div>

          {validationErrors.costPrice && (
            <p className="text-[10px] font-semibold text-rose-500">{validationErrors.costPrice}</p>
          )}
          {validationErrors.salePrice && (
            <p className={`text-[10px] font-semibold ${validationErrors.salePrice.startsWith('Aviso') ? 'text-amber-600' : 'text-rose-500'}`}>
              {validationErrors.salePrice}
            </p>
          )}

          {/* Linha 5: Estoque, Estoque Mínimo, Unidade e Validade */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Qtd a Entrar <span className="text-rose-500">*</span></label>
              <input
                type="number"
                min="0"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-bold focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Estoque Mínimo</label>
              <input
                type="number"
                min="0"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Unidade</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
              >
                <option value="un">Unidade (un)</option>
                <option value="cx">Caixa (cx)</option>
                <option value="pct">Pacote (pct)</option>
                <option value="fr">Frasco (fr)</option>
                <option value="kg">Kg</option>
                <option value="l">Litro (l)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Data de Validade</label>
              <input
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                className="w-full px-3.5 py-2 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
              />
            </div>
          </div>

          {/* Linha 6: Localização / Observações */}
          <div className="space-y-1">
            <label className="font-semibold text-zinc-700">Localização / Observações</label>
            <input
              type="text"
              placeholder="Ex: Prateleira A2 - Setor de Farmácia"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-gray-200 text-zinc-700 font-semibold hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-zinc-950 text-white font-bold hover:bg-[#32D583] hover:text-black transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Check size={16} />
              <span>{productToEdit ? 'Atualizar Artigo' : 'Salvar Entrada'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default StockModal;
