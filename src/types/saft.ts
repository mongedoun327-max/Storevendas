/**
 * Estruturas de Dados do SAF-T (AO) - Ficheiro de Auditoria Fiscal de Angola (AGT)
 * Em conformidade com o Decreto Presidencial e as regras de certificação da Administração Geral Tributária.
 */

export interface SaftCompanyHeader {
  companyId: string;
  nif: string;
  companyName: string;
  addressDetail: string;
  city: string;
  postalCode?: string;
  fiscalYear: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  softwareCertificateNumber: string; // Número do certificado emitido pela AGT
}

export interface SaftCustomer {
  customerId: string;
  nif: string;
  companyName: string;
  billingAddress: {
    addressDetail: string;
    city: string;
    country: string;
  };
  selfBillingIndicator: "0" | "1";
}

export interface SaftProduct {
  productCode: string;
  productDescription: string;
  productGroup?: string;
  unitOfMeasure: string;
}

export interface SaftInvoiceLine {
  lineNumber: number;
  productCode: string;
  productDescription: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  taxPointDate: string;
  description: string;
  creditAmount: number;
  taxRate: number;
  taxCode: string;
  taxExemptionReason?: string;
  taxExemptionCode?: string;
}

export interface SaftInvoice {
  invoiceNo: string; // Ex: FR FT2026/00001
  hash: string;      // Hash RSA SHA-1/SHA-256
  hashControl: string; // "1" para RSA
  period: number;
  invoiceDate: string; // YYYY-MM-DD
  invoiceType: "FT" | "FR" | "ND" | "NC";
  systemEntryDate: string; // YYYY-MM-THH:mm:ss
  customerId: string;
  lines: SaftInvoiceLine[];
  netTotal: number;
  grossTotal: number;
  taxPayable: number;
}
