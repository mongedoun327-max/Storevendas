import { supabaseAdmin } from '../lib/supabase/admin';

export interface TenantProvisioningPayload {
  companyName: string;
  nif: string;
  email: string;
  password: string;
  plan?: string;
}

export interface TenantProvisioningResult {
  success: boolean;
  tenantId?: string;
  message?: string;
  error?: string;
}

/**
 * Lógica principal de provisionamento do Tenant SaaS Masakula
 */
export async function provisionTenant(payload: TenantProvisioningPayload): Promise<TenantProvisioningResult> {
  const { companyName, nif, email, password, plan = "standard" } = payload;

  if (!companyName || !nif || !email || !password) {
    return {
      success: false,
      error: "Campos obrigatórios em falta (companyName, nif, email, password)",
    };
  }

  // 1. Registar utilizador root no Supabase Auth
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "company_owner" },
  });

  if (authError || !authUser.user) {
    return {
      success: false,
      error: authError?.message || "Falha ao criar utilizador no Supabase Auth",
    };
  }

  // 2. Criar Registo da Empresa (Tenant Multi-Tenant)
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from("tenants")
    .insert({
      company_name: companyName,
      nif,
      plan_type: plan,
      status: "active",
      software_cert_no: "350/AGT/2026",
    })
    .select()
    .single();

  if (tenantError || !tenant) {
    return {
      success: false,
      error: tenantError?.message || "Falha ao criar o registo de tenant",
    };
  }

  // 3. Associar Utilizador Admin ao Tenant
  const { error: userInsertError } = await supabaseAdmin.from("users").insert({
    id: authUser.user.id,
    tenant_id: tenant.id,
    email,
    role: "admin",
  });

  if (userInsertError) {
    console.warn("Aviso ao associar utilizador:", userInsertError.message);
  }

  // 4. Inicializar Configurações Padrão de Caixa e Impostos (Angola / AGT)
  const { error: settingsError } = await supabaseAdmin.from("company_settings").insert({
    tenant_id: tenant.id,
    default_tax_rate: 14.0, // IVA Angola
    currency: "AOA",
  });

  if (settingsError) {
    console.warn("Aviso ao configurar definições padrão:", settingsError.message);
  }

  return {
    success: true,
    tenantId: tenant.id,
    message: "Conta empresarial aprovisionada com sucesso.",
  };
}

/**
 * Universal Route Handler (Compatível com Next.js App Router e Web Fetch API)
 */
export async function POST(req: Request) {
  try {
    const body: TenantProvisioningPayload = await req.json();
    const result = await provisionTenant(body);

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json(result, { status: 200 });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Falha interna ao criar conta SaaS." },
      { status: 500 }
    );
  }
}

/**
 * Express Request/Response Handler
 */
export const expressOnboardingHandler = async (req: any, res: any) => {
  try {
    const result = await provisionTenant(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Falha interna ao criar conta SaaS." });
  }
};
