import { Product, WorkOrder, Customer, SaleTransaction, CompanySettings, Expense, CashSession, CashMovement } from '../types';

export const INITIAL_SETTINGS: CompanySettings = {
  companyName: 'Masakula Comércio Geral & Serviços, Lda',
  tradingName: 'Masakula Tech & Retail',
  nif: '5417082910',
  regimeIva: 'Regime de Exclusão (0%)',
  phone: '+244 923 456 789',
  email: 'contacto@masakula.co.ao',
  address: 'Avenida 4 de Fevereiro, Edifício Masakula, 3º Andar',
  city: 'Luanda, Angola',
  agtCertificateNumber: 'AGT-CERT/2026/8920',
  posTerminalId: 'POS-LUA-01',
  defaultCurrency: 'Kz',
  printReceiptOnCheckout: true,
  allowNegativeStock: false,
  soundAlerts: true,
};

// Folha em Branco: Nenhum produto pré-carregado
export const INITIAL_PRODUCTS: Product[] = [];

// Folha em Branco: Nenhuma ordem de serviço inicial
export const INITIAL_WORK_ORDERS: WorkOrder[] = [];

// Folha em Branco: Nenhum cliente cadastrado ainda
export const INITIAL_CUSTOMERS: Customer[] = [];

// Folha em Branco: Nenhuma venda realizada ainda
export const INITIAL_SALES: SaleTransaction[] = [];

// Folha em Branco: Nenhuma despesa registada ainda
export const INITIAL_EXPENSES: Expense[] = [];

// Folha em Branco: Nenhuma sessão de caixa aberta ainda (inicia fechada)
export const INITIAL_CASH_SESSION: CashSession | null = null;

// Folha em Branco: Nenhum movimento de caixa avulso
export const INITIAL_CASH_MOVEMENTS: CashMovement[] = [];
