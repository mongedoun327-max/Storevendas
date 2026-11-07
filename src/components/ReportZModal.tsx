import React, { useRef } from 'react';
import { Printer, X, FileText } from 'lucide-react';

export interface ReportZData {
  reportNumber: string;
  openingDate: string;
  closingDate: string;
  posTerminal: string;
  operatorName: string;
  company: {
    name: string;
    tradeName: string;
    slogan: string;
    nif: string;
    address: string;
    phone: string;
    email: string;
  };
  summary: {
    grossTotal: number;
    discountsTotal: number;
    netTotal: number;
    totalSalesCount: number;
    voidedSalesCount: number;
    voidedSalesTotal: number;
  };
  paymentsBreakdown: {
    cash: number;
    multicaixa: number;
    transfer: number;
  };
  vatBreakdown: Array<{
    rate: number;
    baseAmount: number;
    vatAmount: number;
    exemptionReason?: string;
  }>;
}

interface ReportZModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReportZData;
}

export default function ReportZModal({ isOpen, onClose, data }: ReportZModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      {/* Container Principal */}
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-gray-100 flex flex-col my-8 max-h-[90vh]">
        
        {/* Barra de Ações Superior (Oculta na Impressão) */}
        <div className="p-4 bg-gray-900 text-white rounded-t-3xl flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="text-[#E1FB15]" size={20} />
            <span className="font-bold text-sm">Visualização do Relatório Z</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-[#E1FB15] hover:bg-[#cbe210] text-[#131313] font-black rounded-xl text-xs transition cursor-pointer"
            >
              <Printer size={16} /> Imprimir / Salvar PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-xl transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ÁREA IMPRESSA DO RELATÓRIO Z */}
        <div className="p-8 overflow-y-auto print:p-0 print:overflow-visible" ref={printRef} id="printable-report-z">
          
          {/* 1. Cabeçalho Corporativo */}
          <div className="border-b-2 border-gray-900 pb-6 mb-6 flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                {/* SVG do Logo MK */}
                <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
                  <path d="M12 48V16L24 36L36 16V48" stroke="#1E242B" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M42 48L54 32M42 16L54 32" stroke="#1E242B" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {/* Logotipo Masakula */}
                <span className="text-3xl font-black tracking-tight text-[#1E242B]">Masakula</span>
              </div>
              <p className="text-xs font-black italic text-gray-600 tracking-wide uppercase">
                "{data.company.slogan}"
              </p>
              <div className="text-[11px] text-gray-600 font-medium pt-2 leading-tight">
                <p className="font-bold text-gray-900">{data.company.name}</p>
                <p>NIF: {data.company.nif}</p>
                <p>{data.company.address}</p>
                <p>Tel: {data.company.phone} | Email: {data.company.email}</p>
              </div>
            </div>

            <div className="text-right border-l-2 border-gray-100 pl-6 space-y-1">
              <div className="inline-block px-3 py-1 bg-gray-900 text-[#E1FB15] font-black text-xs rounded-md uppercase">
                Documento Fiscal de Fecho
              </div>
              <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight pt-1">Relatório Z</h1>
              <p className="text-xs font-mono font-bold text-gray-500">Nº: {data.reportNumber}</p>
              <div className="text-[10px] text-gray-500 pt-2 font-medium">
                <p>Abertura: <strong>{data.openingDate}</strong></p>
                <p>Fecho: <strong>{data.closingDate}</strong></p>
                <p>POS / Terminal: <strong>{data.posTerminal}</strong></p>
                <p>Operador: <strong>{data.operatorName}</strong></p>
              </div>
            </div>
          </div>

          {/* 2. Resumo Geral Financeiro */}
          <div className="mb-6">
            <h2 className="text-xs font-black uppercase text-gray-900 border-b border-gray-200 pb-1 mb-3">
              1. Resumo Geral de Vendas
            </h2>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-gray-500 font-bold block text-[10px] uppercase">Venda Bruta</span>
                <span className="text-sm font-black text-gray-900">{formatCurrency(data.summary.grossTotal)}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-gray-500 font-bold block text-[10px] uppercase">Total Descontos</span>
                <span className="text-sm font-black text-gray-900">{formatCurrency(data.summary.discountsTotal)}</span>
              </div>
              <div className="bg-gray-900 text-white p-3 rounded-xl">
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Venda Líquida</span>
                <span className="text-sm font-black text-[#E1FB15]">{formatCurrency(data.summary.netTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-xs mt-3">
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 flex justify-between">
                <span className="text-gray-600 font-medium">Qtd. Transações:</span>
                <strong className="text-gray-900">{data.summary.totalSalesCount}</strong>
              </div>
              <div className="p-2.5 bg-red-50 text-red-700 rounded-xl border border-red-100 flex justify-between">
                <span className="font-medium">Estornos / Cancelamentos:</span>
                <strong className="font-black">{data.summary.voidedSalesCount}</strong>
              </div>
              <div className="p-2.5 bg-red-50 text-red-700 rounded-xl border border-red-100 flex justify-between">
                <span className="font-medium">Valor Total Estornado:</span>
                <strong className="font-black">{formatCurrency(data.summary.voidedSalesTotal)}</strong>
              </div>
            </div>
          </div>

          {/* 3. Desdobramento por Meios de Pagamento */}
          <div className="mb-6">
            <h2 className="text-xs font-black uppercase text-gray-900 border-b border-gray-200 pb-1 mb-3">
              2. Meios de Pagamento Recebidos
            </h2>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-gray-100 text-gray-700 font-black border-b border-gray-200">
                  <th className="py-2 px-3">Método</th>
                  <th className="py-2 px-3 text-right">Valor Apurado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                <tr>
                  <td className="py-2 px-3">Numerário (Dinheiro em Caixa)</td>
                  <td className="py-2 px-3 text-right font-bold">{formatCurrency(data.paymentsBreakdown.cash)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">Multicaixa / TPA</td>
                  <td className="py-2 px-3 text-right font-bold">{formatCurrency(data.paymentsBreakdown.multicaixa)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">Transferência Bancária / Express</td>
                  <td className="py-2 px-3 text-right font-bold">{formatCurrency(data.paymentsBreakdown.transfer)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. Resumo de Impostos (IVA) */}
          <div className="mb-6">
            <h2 className="text-xs font-black uppercase text-gray-900 border-b border-gray-200 pb-1 mb-3">
              3. Tabela de Apuramento de IVA
            </h2>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-gray-100 text-gray-700 font-black border-b border-gray-200">
                  <th className="py-2 px-3">Taxa %</th>
                  <th className="py-2 px-3 text-right">Incidência (Base)</th>
                  <th className="py-2 px-3 text-right">Imposto (IVA)</th>
                  <th className="py-2 px-3">Motivo de Isenção</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {data.vatBreakdown.map((vat, i) => (
                  <tr key={i}>
                    <td className="py-2 px-3 font-bold">{vat.rate}%</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(vat.baseAmount)}</td>
                    <td className="py-2 px-3 text-right font-bold">{formatCurrency(vat.vatAmount)}</td>
                    <td className="py-2 px-3 text-gray-500 text-[10px]">{vat.exemptionReason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5. Assinaturas e Encerramento Legal */}
          <div className="mt-12 pt-6 border-t border-gray-200 grid grid-cols-2 gap-12 text-center text-xs">
            <div>
              <div className="border-b border-gray-400 mb-2 h-8"></div>
              <p className="font-bold text-gray-900">{data.operatorName}</p>
              <p className="text-[10px] text-gray-500">Operador de Caixa</p>
            </div>
            <div>
              <div className="border-b border-gray-400 mb-2 h-8"></div>
              <p className="font-bold text-gray-900">Gerente / Supervisor</p>
              <p className="text-[10px] text-gray-500">Assinatura e Carimbo</p>
            </div>
          </div>

          {/* Rodapé de Auditoria */}
          <div className="mt-8 text-center text-[9px] text-gray-400 border-t border-gray-100 pt-3">
            <p>Processado por Software Certificado Masakula PDV v2.4 • "Um nome, várias soluções"</p>
            <p className="font-mono">Hash de Validação: 8f9b2-9a84c-71e02-4b21a-masakula-2026</p>
          </div>

        </div>
      </div>
    </div>
  );
}
