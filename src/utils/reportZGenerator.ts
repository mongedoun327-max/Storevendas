import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ReportZPayload {
  shiftId: string;
  operatorName: string;
  openedAt: string;
  closedAt: string;
  initialCash: number;
  salesCash: number;
  salesCard: number;
  totalSales: number;
  totalSangria: number;
  totalReforco: number;
  expectedCash: number;
  actualCash: number;
  difference: number;
}

export function generateReportZBuffer(data: ReportZPayload): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Cabeçalho institucional
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("MASAKULA ERP — Fecho Z de Caixa", 14, 18);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`ID Turno: ${data.shiftId} | Operador: ${data.operatorName}`, 14, 24);
  doc.text(
    `Abertura: ${new Date(data.openedAt).toLocaleString("pt-AO")} | Fecho: ${new Date(data.closedAt).toLocaleString("pt-AO")}`,
    14,
    28
  );

  // Tabela de Apuramento
  const tableData = [
    ["Fundo Inicial de Caixa", `${data.initialCash.toLocaleString("pt-AO")} Kz`],
    ["Vendas em Dinheiro", `+${data.salesCash.toLocaleString("pt-AO")} Kz`],
    ["Vendas em Multicaixa/TPA", `+${data.salesCard.toLocaleString("pt-AO")} Kz`],
    ["Total de Reforços (Suprimento)", `+${data.totalReforco.toLocaleString("pt-AO")} Kz`],
    ["Total de Sangrias (Retiradas)", `-${data.totalSangria.toLocaleString("pt-AO")} Kz`],
    ["Saldo Teórico em Dinheiro", `${data.expectedCash.toLocaleString("pt-AO")} Kz`],
    ["Saldo Contado na Gaveta", `${data.actualCash.toLocaleString("pt-AO")} Kz`],
    ["DIFERENÇA FINAL (QUEBRA/SOBRA)", `${data.difference.toLocaleString("pt-AO")} Kz`],
  ];

  autoTable(doc, {
    startY: 34,
    head: [["Rubrica / Apuramento", "Valor (Kz)"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [23, 23, 23], textColor: [255, 255, 255] },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
    didParseCell: (cellData) => {
      if (cellData.row.index === 7) {
        cellData.cell.styles.fillColor = data.difference < 0 ? [254, 226, 226] : [220, 252, 231];
        cellData.cell.styles.textColor = data.difference < 0 ? [185, 28, 28] : [21, 128, 61];
      }
    },
  });

  // Exportar ArrayBuffer para Node Buffer
  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}

export function downloadReportZPdf(data: ReportZPayload) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("MASAKULA ERP — Fecho Z de Caixa", 14, 18);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`ID Turno: ${data.shiftId} | Operador: ${data.operatorName}`, 14, 24);
  doc.text(
    `Abertura: ${new Date(data.openedAt).toLocaleString("pt-AO")} | Fecho: ${new Date(data.closedAt).toLocaleString("pt-AO")}`,
    14,
    28
  );

  const tableData = [
    ["Fundo Inicial de Caixa", `${data.initialCash.toLocaleString("pt-AO")} Kz`],
    ["Vendas em Dinheiro", `+${data.salesCash.toLocaleString("pt-AO")} Kz`],
    ["Vendas em Multicaixa/TPA", `+${data.salesCard.toLocaleString("pt-AO")} Kz`],
    ["Total de Reforços (Suprimento)", `+${data.totalReforco.toLocaleString("pt-AO")} Kz`],
    ["Total de Sangrias (Retiradas)", `-${data.totalSangria.toLocaleString("pt-AO")} Kz`],
    ["Saldo Teórico em Dinheiro", `${data.expectedCash.toLocaleString("pt-AO")} Kz`],
    ["Saldo Contado na Gaveta", `${data.actualCash.toLocaleString("pt-AO")} Kz`],
    ["DIFERENÇA FINAL (QUEBRA/SOBRA)", `${data.difference.toLocaleString("pt-AO")} Kz`],
  ];

  autoTable(doc, {
    startY: 34,
    head: [["Rubrica / Apuramento", "Valor (Kz)"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [23, 23, 23], textColor: [255, 255, 255] },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
    didParseCell: (cellData) => {
      if (cellData.row.index === 7) {
        cellData.cell.styles.fillColor = data.difference < 0 ? [254, 226, 226] : [220, 252, 231];
        cellData.cell.styles.textColor = data.difference < 0 ? [185, 28, 28] : [21, 128, 61];
      }
    },
  });

  doc.save(`Fecho_Z_${data.shiftId}_${new Date().toISOString().split("T")[0]}.pdf`);
}

export default generateReportZBuffer;
