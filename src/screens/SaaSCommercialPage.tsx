import React, { useState } from "react";
import { Check, ShieldCheck, Zap, Laptop } from "lucide-react";
import { provisionTenant } from "../api/onboarding";

export function SaaSCommercialPage({ onNavigateToPdv }: { onNavigateToPdv?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    companyName: "",
    nif: "",
    email: "",
    password: "",
    plan: "pro",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Tentar via API Route / fetch primeiro
      const res = await fetch("/api/onboarding/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccessMessage("Conta empresarial aprovisionada com sucesso!");
        if (onNavigateToPdv) {
          setTimeout(() => onNavigateToPdv(), 1000);
        } else if (typeof window !== "undefined") {
          setTimeout(() => {
            window.location.href = "/pdv";
          }, 1000);
        }
        return;
      }

      // Se falhou no endpoint HTTP mock/local, invocar o provisionador direto
      const directResult = await provisionTenant(formData);
      if (directResult.success) {
        setSuccessMessage("Conta empresarial aprovisionada com sucesso!");
        if (onNavigateToPdv) {
          setTimeout(() => onNavigateToPdv(), 1000);
        } else if (typeof window !== "undefined") {
          setTimeout(() => {
            window.location.href = "/pdv";
          }, 1000);
        }
      } else {
        setErrorMessage(directResult.error || "Falha ao aprovisionar conta");
      }
    } catch (err: any) {
      // Fallback direto
      try {
        const fallbackResult = await provisionTenant(formData);
        if (fallbackResult.success) {
          setSuccessMessage("Conta empresarial aprovisionada com sucesso!");
          if (onNavigateToPdv) {
            setTimeout(() => onNavigateToPdv(), 1000);
          } else if (typeof window !== "undefined") {
            setTimeout(() => {
              window.location.href = "/pdv";
            }, 1000);
          }
        } else {
          setErrorMessage(fallbackResult.error || err?.message || "Erro de rede");
        }
      } catch (fallbackErr: any) {
        setErrorMessage(fallbackErr?.message || "Erro ao conectar ao servidor");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#131313] text-white font-sans">
      {/* Header & Badges Fiscais */}
      <header className="border-b border-neutral-800 px-6 sm:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-wider text-[#E1FB15]">WORSCOI POS</h1>
          <span className="hidden sm:inline-block text-xs uppercase px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
            SaaS Multi-Tenant
          </span>
        </div>
        <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-full border border-neutral-800 text-xs">
          <ShieldCheck className="w-4 h-4 text-[#32D583]" />
          <span>Certificado AGT nº 350/AGT/2026</span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-12 md:py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-4 py-1.5 rounded-full text-xs text-[#E1FB15] mb-6">
          <Zap className="w-3.5 h-3.5" />
          <span>Ecossistema Masakula POS & Gestão Comercial</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
          O Ponto de Venda Moderno para o seu Negócio em Angola
        </h2>
        <p className="text-neutral-400 text-base sm:text-lg max-w-2xl mx-auto mb-12">
          Software certificado pela AGT com emissão de faturas, integração de impressoras térmicas, controlo offline e gerador SAF-T AO.
        </p>

        {/* Tabela de Planos */}
        <div className="grid md:grid-cols-3 gap-8 text-left mb-16">
          {/* Plano Básico */}
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Básico</h3>
              <p className="text-2xl font-extrabold text-[#32D583] mb-4">
                15.000 Kz <span className="text-sm font-normal text-neutral-400">/mês</span>
              </p>
              <ul className="space-y-3 text-sm text-neutral-300 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#32D583] shrink-0" /> 1 POS / Caixa
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#32D583] shrink-0" /> Faturação em Dia
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#32D583] shrink-0" /> Exportação SAF-T AO
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, plan: "basic" })}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold transition ${
                formData.plan === "basic"
                  ? "bg-[#32D583] text-black"
                  : "bg-neutral-800 text-white hover:bg-neutral-700"
              }`}
            >
              {formData.plan === "basic" ? "Plano Selecionado" : "Selecionar Básico"}
            </button>
          </div>

          {/* Plano Pro */}
          <div className="bg-neutral-900 border-2 border-[#E1FB15] p-6 rounded-2xl relative shadow-[0_0_20px_rgba(225,251,21,0.1)] flex flex-col justify-between">
            <span className="absolute -top-3 right-6 bg-[#E1FB15] text-black text-xs font-bold px-3 py-1 rounded-full">
              RECOMENDADO
            </span>
            <div>
              <h3 className="text-xl font-bold mb-2">Profissional</h3>
              <p className="text-2xl font-extrabold text-[#E1FB15] mb-4">
                35.000 Kz <span className="text-sm font-normal text-neutral-400">/mês</span>
              </p>
              <ul className="space-y-3 text-sm text-neutral-300 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#E1FB15] shrink-0" /> Caixas Ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#E1FB15] shrink-0" /> Modo Offline-First
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#E1FB15] shrink-0" /> Impressão ESC/POS Directa
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#E1FB15] shrink-0" /> Assistente Masakula AI
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, plan: "pro" })}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold transition ${
                formData.plan === "pro"
                  ? "bg-[#E1FB15] text-black"
                  : "bg-neutral-800 text-white hover:bg-neutral-700"
              }`}
            >
              {formData.plan === "pro" ? "Plano Selecionado" : "Selecionar Pro"}
            </button>
          </div>

          {/* Plano Enterprise */}
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Empresarial</h3>
              <p className="text-2xl font-extrabold text-white mb-4">Sob Consulta</p>
              <ul className="space-y-3 text-sm text-neutral-300 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#32D583] shrink-0" /> Gestão Multi-Lojas
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#32D583] shrink-0" /> API Dedicada / ERP
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#32D583] shrink-0" /> Suporte Prioritário 24/7
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, plan: "enterprise" })}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold transition ${
                formData.plan === "enterprise"
                  ? "bg-white text-black"
                  : "bg-neutral-800 text-white hover:bg-neutral-700"
              }`}
            >
              {formData.plan === "enterprise" ? "Plano Selecionado" : "Falar com Vendas"}
            </button>
          </div>
        </div>

        {/* Form de Onboarding Directo */}
        <div className="max-w-md mx-auto bg-neutral-900 border border-neutral-800 p-8 rounded-2xl text-left shadow-2xl">
          <div className="flex items-center justify-center gap-2 mb-2 text-[#E1FB15]">
            <Laptop className="w-5 h-5" />
            <span className="text-xs uppercase tracking-wider font-bold">Aprovisionamento Imediato</span>
          </div>
          <h3 className="text-xl font-bold mb-6 text-center">Criar Conta Comercial</h3>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-neutral-400 block mb-1">Nome da Empresa</label>
              <input
                required
                type="text"
                value={formData.companyName}
                placeholder="Ex: Comercial Worscoi Lda"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#E1FB15]"
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1">NIF Comercial</label>
              <input
                required
                type="text"
                value={formData.nif}
                placeholder="Ex: 5412345678"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#E1FB15]"
                onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1">E-mail do Administrador</label>
              <input
                required
                type="email"
                value={formData.email}
                placeholder="admin@empresa.co.ao"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#E1FB15]"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1">Palavra-passe</label>
              <input
                required
                type="password"
                value={formData.password}
                placeholder="••••••••••••"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#E1FB15]"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <button
              disabled={loading}
              type="submit"
              className="w-full bg-[#E1FB15] text-black font-bold py-3 rounded-lg hover:bg-opacity-90 transition mt-4 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "A aprovisionar instância..." : "Iniciar Teste Gratuito"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default SaaSCommercialPage;
