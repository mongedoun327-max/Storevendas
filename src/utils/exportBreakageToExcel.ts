import * as XLSX from "xlsx";
import { OperatorPerformance } from "../types/analytics";

export function exportBreakageToExcel(
  data: OperatorPerformance[],
  filename = "Relatorio_Auditoria_Quebras"
) {
  // 1. Mapeamento dos dados para cabeçalhos legíveis
  const formattedRows = data.map((op) => ({
    "Operador": op.operatorName,
    "Turnos Fechados": op.totalShifts,
    "Vendas em Dinheiro (Kz)": op.totalSalesCash,
    "Vendas Multicaixa (Kz)": op.totalSalesCard,
    "Vendas Totais (Kz)": op.totalSales,
    "Total Quebras (Kz)": op.totalBreakage,
    "Total Sobras (Kz)": op.totalSurplus,
    "Saldo Líquido (Kz)": op.netDifference,
    "Taxa de Precisão (%)": `${op.accuracyRate}%`,
  }));

  // 2. Criar folha de cálculo a partir do JSON
  const worksheet = XLSX.utils.json_to_sheet(formattedRows);

  // 3. Ajustar automaticamente a largura das colunas
  const colWidths = Object.keys(formattedRows[0] || {}).map((key) => ({
    wch: Math.max(key.length + 4, 15),
  }));
  worksheet["!cols"] = colWidths;

  // 4. Montar o livro de trabalho (Workbook) e exportar
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Auditoria de Quebras");

  const dateSuffix = new Date().toISOString().split("T")[0];
  XLSX.writeFile(workbook, `${filename}_${dateSuffix}.xlsx`);
}

export default exportBreakageToExcel;
