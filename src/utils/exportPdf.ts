import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DeadStockItem } from '../hooks/useDeadStock';
import { loadStoredSettings } from './storage';

export interface IntelligenceReportData {
  title?: string;
  generatedAt?: string;
  metrics: {
    averageTicket: string;
    deadStockCapital: string;
    deadStockCount: number;
    grossMargin: string;
    repurchaseAlertCount: string;
  };
  aiInsight?: string | null;
  userQuery?: string;
  deadStockItems: DeadStockItem[];
}

export function generateIntelligencePDF(data: IntelligenceReportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const settings = loadStoredSettings();
  const companyName = settings?.companyName || settings?.tradingName || 'Masakula Comércio & Serviços';
  const companyNif = settings?.nif || '5417089201';
  const companySlogan = 'Um nome, várias soluções';
  const companyPhone = settings?.phone || '+244 923 000 000';
  const now = new Date();
  const formattedDate = data.generatedAt || now.toLocaleDateString('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Cores Masakula
  const darkColor = [19, 19, 19] as [number, number, number];
  const accentColor = [225, 251, 21] as [number, number, number]; // Neon #E1FB15
  const greenColor = [50, 213, 131] as [number, number, number];
  const amberColor = [217, 119, 6] as [number, number, number];

  // Header Background bar
  doc.setFillColor(...darkColor);
  doc.rect(0, 0, 210, 28, 'F');

  // Decorative Accent line
  doc.setFillColor(...accentColor);
  doc.rect(0, 27, 210, 1.5, 'F');

  // Title in Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MASAKULA INTELLIGENCE & BI', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(220, 220, 220);
  doc.text('Relatório Executivo de Diagnóstico Preditivo e Análise de Estoque', 14, 18);
  doc.text(`Emitido em: ${formattedDate}`, 14, 23);

  // Company info top right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...accentColor);
  doc.text(companyName, 196, 11, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(200, 200, 200);
  doc.text(`NIF: ${companyNif} | Tel: ${companyPhone}`, 196, 16, { align: 'right' });
  doc.text(`"${companySlogan}"`, 196, 21, { align: 'right' });

  let currentY = 36;

  // 1. Bloco de Indicadores Chave (KPIs)
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. Indicadores Principais de Desempenho (KPIs)', 14, currentY);

  currentY += 4;

  const cardWidth = 43;
  const cardHeight = 20;
  const gap = 3;
  const startX = 14;

  const kpis = [
    { label: 'Ticket Médio', val: data.metrics.averageTicket, badge: '+8.2%', color: greenColor },
    { label: 'Capital em Dead Stock', val: data.metrics.deadStockCapital, badge: `${data.metrics.deadStockCount} Itens`, color: amberColor },
    { label: 'Margem Bruta Média', val: data.metrics.grossMargin, badge: '+1.4%', color: greenColor },
    { label: 'Previsão de Recompra', val: data.metrics.repurchaseAlertCount, badge: 'Atenção', color: amberColor },
  ];

  kpis.forEach((kpi, idx) => {
    const x = startX + idx * (cardWidth + gap);
    // Card background
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'D');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text(kpi.label, x + 3, currentY + 5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...darkColor);
    doc.text(kpi.val, x + 3, currentY + 13);

    // Badge
    doc.setFontSize(6.5);
    doc.setTextColor(...kpi.color);
    doc.text(kpi.badge, x + cardWidth - 3, currentY + 5, { align: 'right' });
  });

  currentY += cardHeight + 8;

  // 2. Diagnóstico & Insights da IA
  if (data.aiInsight) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkColor);
    doc.text('2. Diagnóstico Preditivo da Inteligência Artificial', 14, currentY);

    currentY += 4;

    // Insight Container
    const boxHeight = 22;
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(14, currentY, 182, boxHeight, 2, 2, 'F');
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(14, currentY, 182, boxHeight, 2, 2, 'D');

    if (data.userQuery) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(55, 65, 81);
      doc.text(`Pergunta: "${data.userQuery}"`, 18, currentY + 5.5);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(22, 101, 52);
    doc.text('Parecer e Recomendação:', 18, currentY + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(31, 41, 55);
    const splitInsight = doc.splitTextToSize(data.aiInsight, 174);
    doc.text(splitInsight, 18, currentY + 15);

    currentY += boxHeight + 8;
  }

  // 3. Tabela de Dead Stock
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkColor);
  doc.text('3. Auditoria de Produtos Encalhados (> 30 Dias sem Venda)', 14, currentY);

  currentY += 3;

  const formatMoney = (val: number) =>
    val.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });

  const getActionName = (action: DeadStockItem['suggested_action']) => {
    switch (action) {
      case 'LIQUIDATION':
        return 'Liquidação (-30%)';
      case 'COMBO':
        return 'Criar Combo';
      case 'DISCOUNT_15':
      default:
        return 'Desconto 15%';
    }
  };

  const tableBody = data.deadStockItems.map((item) => [
    item.product_name + (item.barcode ? `\n[${item.barcode}]` : ''),
    `${item.stock_quantity} un`,
    formatMoney(item.cost_price),
    formatMoney(item.capital_locked),
    `${item.days_inactive} dias`,
    getActionName(item.suggested_action),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Produto / Código', 'Estoque', 'Preço Custo', 'Capital Parado', 'Inatividade', 'Ação Recomendada']],
    body: tableBody.length > 0 ? tableBody : [['Nenhum produto em Dead Stock identificado', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [19, 19, 19],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [31, 41, 55],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 30, halign: 'right', fontStyle: 'bold', textColor: [180, 83, 9] },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 27, halign: 'center', fontStyle: 'bold' },
    },
    styles: {
      overflow: 'linebreak',
    },
    didDrawPage: (hookData) => {
      // Footer em todas as páginas
      const pageHeight = doc.internal.pageSize.height || 297;
      
      // Linha separadora
      doc.setDrawColor(229, 231, 235);
      doc.line(14, pageHeight - 12, 196, pageHeight - 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text('Sistema Masakula ERP & PDV • Módulo de Inteligência Artificial e Gestão de Liquidez', 14, pageHeight - 7);

      const pageNumber = (doc as any).internal.getNumberOfPages();
      doc.text(`Página ${pageNumber}`, 196, pageHeight - 7, { align: 'right' });
    },
  });

  const filename = `relatorio-inteligencia-masakula-${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
