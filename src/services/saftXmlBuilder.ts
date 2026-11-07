import {
  SaftCompanyHeader,
  SaftCustomer,
  SaftProduct,
  SaftInvoice,
} from "@/types/saft";

function sanitizeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export class SaftAOXmlBuilder {
  private header: SaftCompanyHeader;
  private customers: SaftCustomer[];
  private products: SaftProduct[];
  private invoices: SaftInvoice[];

  constructor(
    header: SaftCompanyHeader,
    customers: SaftCustomer[],
    products: SaftProduct[],
    invoices: SaftInvoice[]
  ) {
    this.header = header;
    this.customers = customers;
    this.products = products;
    this.invoices = invoices;
  }

  public generateXml(): string {
    const dateCreated = new Date().toISOString().split("T")[0];

    // Totais globais (Faturas/Faturas-Recibo são Crédito; Notas de Crédito são Débito)
    const totalCredit = this.invoices
      .filter((inv) => inv.invoiceType === "FT" || inv.invoiceType === "FR")
      .reduce((acc, inv) => acc + inv.netTotal, 0);

    const totalDebit = this.invoices
      .filter((inv) => inv.invoiceType === "NC")
      .reduce((acc, inv) => acc + inv.netTotal, 0);

    const totalEntries = this.invoices.length;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:AO_1.01_01" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n`;

    // 1. HEADER
    xml += `  <Header>\n`;
    xml += `    <AuditFileVersion>1.01_01</AuditFileVersion>\n`;
    xml += `    <CompanyID>${sanitizeXml(this.header.companyId)}</CompanyID>\n`;
    xml += `    <TaxRegistrationNumber>${sanitizeXml(this.header.nif)}</TaxRegistrationNumber>\n`;
    xml += `    <TaxAccountingBasis>Facturação</TaxAccountingBasis>\n`;
    xml += `    <CompanyName>${sanitizeXml(this.header.companyName)}</CompanyName>\n`;
    xml += `    <BusinessName>${sanitizeXml(this.header.companyName)}</BusinessName>\n`;
    xml += `    <CompanyAddress>\n`;
    xml += `      <AddressDetail>${sanitizeXml(this.header.addressDetail)}</AddressDetail>\n`;
    xml += `      <City>${sanitizeXml(this.header.city)}</City>\n`;
    xml += `      <Country>AO</Country>\n`;
    xml += `    </CompanyAddress>\n`;
    xml += `    <FiscalYear>${this.header.fiscalYear}</FiscalYear>\n`;
    xml += `    <StartDate>${this.header.startDate}</StartDate>\n`;
    xml += `    <EndDate>${this.header.endDate}</EndDate>\n`;
    xml += `    <CurrencyCode>AOA</CurrencyCode>\n`;
    xml += `    <DateCreated>${dateCreated}</DateCreated>\n`;
    xml += `    <TaxEntity>Global</TaxEntity>\n`;
    xml += `    <ProductCompanyID>Worscoi Software</ProductCompanyID>\n`;
    xml += `    <ProductID>Worscoi POS</ProductID>\n`;
    xml += `    <ProductVersion>1.0.0</ProductVersion>\n`;
    xml += `    <SoftwareCertificateNumber>${this.header.softwareCertificateNumber}</SoftwareCertificateNumber>\n`;
    xml += `  </Header>\n`;

    // 2. MASTER FILES
    xml += `  <MasterFiles>\n`;

    // 2.1 Customers
    this.customers.forEach((cust) => {
      xml += `    <Customer>\n`;
      xml += `      <CustomerID>${sanitizeXml(cust.customerId)}</CustomerID>\n`;
      xml += `      <AccountID>Desconhecido</AccountID>\n`;
      xml += `      <CustomerTaxID>${sanitizeXml(cust.nif)}</CustomerTaxID>\n`;
      xml += `      <CompanyName>${sanitizeXml(cust.companyName)}</CompanyName>\n`;
      xml += `      <BillingAddress>\n`;
      xml += `        <AddressDetail>${sanitizeXml(cust.billingAddress.addressDetail)}</AddressDetail>\n`;
      xml += `        <City>${sanitizeXml(cust.billingAddress.city)}</City>\n`;
      xml += `        <Country>${cust.billingAddress.country}</Country>\n`;
      xml += `      </BillingAddress>\n`;
      xml += `      <SelfBillingIndicator>${cust.selfBillingIndicator}</SelfBillingIndicator>\n`;
      xml += `    </Customer>\n`;
    });

    // 2.2 Products
    this.products.forEach((prod) => {
      xml += `    <Product>\n`;
      xml += `      <ProductType>P</ProductType>\n`;
      xml += `      <ProductCode>${sanitizeXml(prod.productCode)}</ProductCode>\n`;
      xml += `      <ProductGroup>${sanitizeXml(prod.productGroup || "Geral")}</ProductGroup>\n`;
      xml += `      <ProductDescription>${sanitizeXml(prod.productDescription)}</ProductDescription>\n`;
      xml += `      <ProductNumberCode>${sanitizeXml(prod.productCode)}</ProductNumberCode>\n`;
      xml += `    </Product>\n`;
    });

    // 2.3 TaxTable (Tabela AGT Fixa)
    xml += `    <TaxTable>\n`;
    xml += `      <TaxTableEntry>\n`;
    xml += `        <TaxType>IVA</TaxType>\n`;
    xml += `        <TaxCode>NOR</TaxCode>\n`;
    xml += `        <Description>Taxa Normal (14%)</Description>\n`;
    xml += `        <TaxPercentage>14.00</TaxPercentage>\n`;
    xml += `      </TaxTableEntry>\n`;
    xml += `      <TaxTableEntry>\n`;
    xml += `        <TaxType>IVA</TaxType>\n`;
    xml += `        <TaxCode>ISE</TaxCode>\n`;
    xml += `        <Description>Isento</Description>\n`;
    xml += `        <TaxPercentage>0.00</TaxPercentage>\n`;
    xml += `      </TaxTableEntry>\n`;
    xml += `    </TaxTable>\n`;

    xml += `  </MasterFiles>\n`;

    // 3. SOURCE DOCUMENTS
    xml += `  <SourceDocuments>\n`;
    xml += `    <SalesInvoices>\n`;
    xml += `      <NumberOfEntries>${totalEntries}</NumberOfEntries>\n`;
    xml += `      <TotalDebit>${totalDebit.toFixed(2)}</TotalDebit>\n`;
    xml += `      <TotalCredit>${totalCredit.toFixed(2)}</TotalCredit>\n`;

    this.invoices.forEach((inv) => {
      xml += `      <Invoice>\n`;
      xml += `        <InvoiceNo>${sanitizeXml(inv.invoiceNo)}</InvoiceNo>\n`;
      xml += `        <DocumentStatus>\n`;
      xml += `          <InvoiceStatus>N</InvoiceStatus>\n`;
      xml += `          <InvoiceStatusDate>${inv.systemEntryDate}</InvoiceStatusDate>\n`;
      xml += `          <SourceID>Operador</SourceID>\n`;
      xml += `          <SourceBilling>P</SourceBilling>\n`;
      xml += `        </DocumentStatus>\n`;
      xml += `        <Hash>${inv.hash}</Hash>\n`;
      xml += `        <HashControl>${inv.hashControl}</HashControl>\n`;
      xml += `        <Period>${inv.period}</Period>\n`;
      xml += `        <InvoiceDate>${inv.invoiceDate}</InvoiceDate>\n`;
      xml += `        <InvoiceType>${inv.invoiceType}</InvoiceType>\n`;
      xml += `        <SpecialRegimes>\n`;
      xml += `          <SelfBillingIndicator>0</SelfBillingIndicator>\n`;
      xml += `          <CashVATSchemeIndicator>0</CashVATSchemeIndicator>\n`;
      xml += `          <ThirdPartiesBillingIndicator>0</ThirdPartiesBillingIndicator>\n`;
      xml += `        </SpecialRegimes>\n`;
      xml += `        <SourceID>Operador</SourceID>\n`;
      xml += `        <SystemEntryDate>${inv.systemEntryDate}</SystemEntryDate>\n`;
      xml += `        <CustomerID>${sanitizeXml(inv.customerId)}</CustomerID>\n`;

      // Linhas da Fatura
      inv.lines.forEach((line) => {
        xml += `        <Line>\n`;
        xml += `          <LineNumber>${line.lineNumber}</LineNumber>\n`;
        xml += `          <ProductCode>${sanitizeXml(line.productCode)}</ProductCode>\n`;
        xml += `          <ProductDescription>${sanitizeXml(line.productDescription)}</ProductDescription>\n`;
        xml += `          <Quantity>${line.quantity.toFixed(2)}</Quantity>\n`;
        xml += `          <UnitOfMeasure>${sanitizeXml(line.unitOfMeasure)}</UnitOfMeasure>\n`;
        xml += `          <UnitPrice>${line.unitPrice.toFixed(2)}</UnitPrice>\n`;
        xml += `          <TaxPointDate>${line.taxPointDate}</TaxPointDate>\n`;
        xml += `          <Description>${sanitizeXml(line.description)}</Description>\n`;
        xml += `          <CreditAmount>${line.creditAmount.toFixed(2)}</CreditAmount>\n`;
        xml += `          <Tax>\n`;
        xml += `            <TaxType>IVA</TaxType>\n`;
        xml += `            <TaxCode>${line.taxCode}</TaxCode>\n`;
        xml += `            <TaxPercentage>${line.taxRate.toFixed(2)}</TaxPercentage>\n`;
        xml += `          </Tax>\n`;

        if (line.taxRate === 0) {
          xml += `          <TaxExemptionReason>${sanitizeXml(line.taxExemptionReason || "Isento nos termos da lei")}</TaxExemptionReason>\n`;
          xml += `          <TaxExemptionCode>${sanitizeXml(line.taxExemptionCode || "M00")}</TaxExemptionCode>\n`;
        }

        xml += `        </Line>\n`;
      });

      // Totais do Documento
      xml += `        <DocumentTotals>\n`;
      xml += `          <TaxPayable>${inv.taxPayable.toFixed(2)}</TaxPayable>\n`;
      xml += `          <NetTotal>${inv.netTotal.toFixed(2)}</NetTotal>\n`;
      xml += `          <GrossTotal>${inv.grossTotal.toFixed(2)}</GrossTotal>\n`;
      xml += `        </DocumentTotals>\n`;
      xml += `      </Invoice>\n`;
    });

    xml += `    </SalesInvoices>\n`;
    xml += `  </SourceDocuments>\n`;
    xml += `</AuditFile>`;

    return xml;
  }
}

export default SaftAOXmlBuilder;
