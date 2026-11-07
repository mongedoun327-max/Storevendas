import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { OperatorPerformance } from "../types/analytics";

export function exportBreakageToPdf(
  data: OperatorPerformance[],
  periodLabel = "Últimos 30 dias"
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // 1. Cabeçalho do Relatório
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("MASAKULA ERP — Relatório de Auditoria de Quebras", 14, 18);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(
    `Período: ${periodLabel} | Emissão: ${new Date().toLocaleDateString("pt-AO")} às ${new Date().toLocaleTimeString("pt-AO")}`,
    14,
    24
  );

  // 2. Cartão de Resumo Sumarizado (KPIs)
  const totalQuebras = data.reduce((acc, d) => acc + d.totalBreakage, 0);
  const totalSobras = data.reduce((acc, d) => acc + d.totalSurplus, 0);

  doc.setFillColor(245, 245, 245);
  doc.roundedRect(14, 28, 182, 16, 3, 3, "F");

  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Quebras: ${totalQuebras.toLocaleString("pt-AO")} Kz`, 20, 38);
  doc.text(`Total Sobras: +${totalSobras.toLocaleString("pt-AO")} Kz`, 110, 38);

  // 3. Formatação da Tabela Principal
  const tableHead = [
    ["Operador", "Turnos", "Vendas Totais", "Quebras (Kz)", "Sobras (Kz)", "Saldo Líquido", "Precisão"],
  ];

  const tableBody = data.map((op) => [
    op.operatorName,
    op.totalShifts.toString(),
    `${op.totalSales.toLocaleString("pt-AO")} Kz`,
    `${op.totalBreakage.toLocaleString("pt-AO")} Kz`,
    `+${op.totalSurplus.toLocaleString("pt-AO")} Kz`,
    `${op.netDifference.toLocaleString("pt-AO")} Kz`,
    `${op.accuracyRate}%`,
  ]);

  autoTable(doc, {
    startY: 48,
    head: tableHead,
    body: tableBody,
    theme: "grid",
    headStyles: {
      fillColor: [23, 23, 23],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold" },
      3: { textColor: [225, 29, 72], fontStyle: "bold" }, // Destaque vermelho para quebras
      4: { textColor: [16, 185, 129] },                 // Verde para sobras
      6: { halign: "center" },
    },
  });

  // 4. Rodapé com numeração de páginas
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount}`, 196, 285, { align: "right" });
  }

  // 5. Download do ficheiro PDF
  doc.save(`Auditoria_Quebras_${new Date().toISOString().split("T")[0]}.pdf`);
}

export default exportBreakageToPdf;
