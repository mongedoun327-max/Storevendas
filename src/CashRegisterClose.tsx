import React, { useState } from 'react';
import ReportZModal, { ReportZData } from './components/ReportZModal';

export default function CashRegisterClose() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mockReportZ: ReportZData = {
    reportNumber: 'RZ 2026/00001',
    openingDate: new Date().toLocaleDateString('pt-AO') + ' 08:00',
    closingDate: new Date().toLocaleDateString('pt-AO') + ' 18:00',
    posTerminal: 'CAIXA-01',
    operatorName: 'Operador Principal',
    company: {
      name: 'Masakula - Prestação de Serviços, Lda',
      tradeName: 'Masakula',
      slogan: 'Um nome, várias soluções',
      nif: '5417082910',
      address: 'Rua Rainha Ginga, Edifício Masakula, Luanda - Angola',
      phone: '+244 923 000 000',
      email: 'comercial@masakula.co.ao',
    },
    summary: {
      grossTotal: 0,
      discountsTotal: 0,
      netTotal: 0,
      totalSalesCount: 0,
      voidedSalesCount: 0,
      voidedSalesTotal: 0,
    },
    paymentsBreakdown: {
      cash: 0,
      multicaixa: 0,
      transfer: 0,
    },
    vatBreakdown: [
      { rate: 0, baseAmount: 0, vatAmount: 0, exemptionReason: 'Operação sem incidência de IVA' },
    ],
  };

  return (
    <div className="p-4">
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-6 py-3 bg-black text-[#E1FB15] font-black rounded-2xl shadow-lg hover:bg-gray-800 transition cursor-pointer"
      >
        Emitir Relatório Z
      </button>

      <ReportZModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={mockReportZ}
      />
    </div>
  );
}
