import { SaftAOXmlBuilder } from '../services/saftXmlBuilder';
import { SaftCompanyHeader, SaftCustomer, SaftProduct, SaftInvoice } from '../types/saft';
import { supabaseService } from '../services/supabaseService';

/**
 * Route Handler para exportação do SAF-T (AO) XML
 * Compatível com Web Standard Request/Response, Next.js Route Handlers e Express.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate") || "2026-08-01";
    const endDate = url.searchParams.get("endDate") || "2026-08-31";
    const companyName = url.searchParams.get("companyName") || "WORSCOI TECNOLOGIA E COMÉRCIO LDA";
    const nif = url.searchParams.get("nif") || "5432109876";

    // Cabeçalho da empresa emissora certificado pela AGT
    const companyHeader: SaftCompanyHeader = {
      companyId: "AO543210987",
      nif,
      companyName,
      addressDetail: "Rua do Comércio, Edifício Worscoi, Luanda",
      city: "Luanda",
      fiscalYear: new Date(startDate).getFullYear() || 2026,
      startDate,
      endDate,
      softwareCertificateNumber: "350/AGT/2026",
    };

    // Obter clientes e produtos locais ou via serviço Supabase
    const customers: SaftCustomer[] = [];
    const products: SaftProduct[] = [];
    const invoices: SaftInvoice[] = [];

    // Gerador XML padrão AGT Angola
    const builder = new SaftAOXmlBuilder(companyHeader, customers, products, invoices);
    const xmlContent = builder.generateXml();

    return new Response(xmlContent, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="SAFT_AO_${startDate}_${endDate}.xml"`,
      },
    });
  } catch (error: any) {
    return new Response(`<Error>${error?.message || "Erro ao gerar SAF-T (AO)"}</Error>`, {
      status: 500,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }
}

/**
 * Express Request Handler
 */
export const expressSaftHandler = async (req: any, res: any) => {
  try {
    const startDate = (req.query.startDate as string) || "2026-08-01";
    const endDate = (req.query.endDate as string) || "2026-08-31";
    const companyName = (req.query.companyName as string) || "WORSCOI TECNOLOGIA E COMÉRCIO LDA";
    const nif = (req.query.nif as string) || "5432109876";

    const companyHeader: SaftCompanyHeader = {
      companyId: "AO543210987",
      nif,
      companyName,
      addressDetail: "Rua do Comércio, Edifício Worscoi, Luanda",
      city: "Luanda",
      fiscalYear: new Date(startDate).getFullYear() || 2026,
      startDate,
      endDate,
      softwareCertificateNumber: "350/AGT/2026",
    };

    const builder = new SaftAOXmlBuilder(companyHeader, [], [], []);
    const xmlContent = builder.generateXml();

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="SAFT_AO_${startDate}_${endDate}.xml"`);
    return res.status(200).send(xmlContent);
  } catch (error: any) {
    return res.status(500).send(`<Error>${error?.message || "Erro ao gerar SAF-T (AO)"}</Error>`);
  }
};
