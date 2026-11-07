import * as XLSX from 'xlsx';
import { Product } from '../types';

export function exportInventoryToExcel(
  products: Product[],
  filename = 'Inventario_Produtos_Masakula'
) {
  if (!products || products.length === 0) return;

  const rows = products.map((p) => {
    const cost = p.costPrice || 0;
    const sale = p.salePrice || 0;
    const profit = sale - cost;
    const margin = sale > 0 ? `${((profit / sale) * 100).toFixed(1)}%` : '0%';
    const totalValuation = p.stock * sale;

    return {
      'Nome do Produto': p.name,
      'SKU': p.sku,
      'Código de Barras': p.barcode,
      'Categoria': p.category,
      'Estoque Atual': p.stock,
      'Estoque Mínimo': p.minStock,
      'Unidade': p.unit || 'un',
      'Preço Custo (Kz)': cost,
      'Preço Venda (Kz)': sale,
      'Lucro Unitário (Kz)': profit,
      'Margem Bruta': margin,
      'Valoração Total (Kz)': totalValuation,
      'Lote': p.batch || 'N/A',
      'Data de Validade': p.expirationDate || 'Sem Validade',
      'Fornecedor': p.supplier || 'N/A',
      'Localização / Obs': p.notes || '',
      'Status': p.status === 'out_of_stock' ? 'Esgotado' : p.stock <= p.minStock ? 'Estoque Baixo' : 'Normal',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto column widths
  const colWidths = Object.keys(rows[0] || {}).map((key) => ({
    wch: Math.max(key.length + 4, 14),
  }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventário');

  const dateSuffix = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${filename}_${dateSuffix}.xlsx`);
}
