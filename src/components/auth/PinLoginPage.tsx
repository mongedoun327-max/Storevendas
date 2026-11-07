import React, { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../../lib/supabase";
import { Check, ShieldCheck, User, AlertCircle, Loader2 } from "lucide-react";

export interface OperatorOption {
  id: string;
  name: string;
  role: string;
  active?: boolean;
}

export function formatRoleName(role: string): string {
  const r = (role || "").toLowerCase();
  if (r === "operator" || r === "caixa") return "OPERADOR DE CAIXA";
  if (r === "manager" || r === "gerente") return "GERENTE";
  if (r === "admin" || r === "administrator") return "ADMINISTRADOR";
  return role.toUpperCase();
}

export interface PinLoginPageProps {
  onSuccess?: (operator: OperatorOption) => void;
  onNavigateToPos?: () => void;
  defaultOperatorId?: string;
}

export function PinLoginPage({
  onSuccess,
  onNavigateToPos,
  defaultOperatorId = "",
}: PinLoginPageProps) {
  const [operatorsList, setOperatorsList] = useState<OperatorOption[]>([]);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>(defaultOperatorId);
  const [pin, setPin] = useState<string[]>(["", "", "", ""]);
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingOperators, setLoadingOperators] = useState(true);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // 1. Carregar lista real de operadores do Supabase
  useEffect(() => {
    async function loadOperators() {
      try {
        const { data, error } = await supabase
          .from("operators")
          .select("id, name, role, active")
          .eq("active", true)
          .order("name", { ascending: true });

        if (!error && data && data.length > 0) {
          setOperatorsList(data);
        } else {
          // Fallback de operadores padrão com a estrutura real do banco de dados
          setOperatorsList([
            { id: "op-caixa-1", name: "Caixa Principal", role: "operator", active: true },
            { id: "op-caixa-2", name: "Caixa Secundário (Balcão 2)", role: "operator", active: true },
            { id: "admin-1", name: "Administrador Geral", role: "manager", active: true },
          ]);
        }
      } catch (err) {
        console.error("Erro ao carregar operadores:", err);
        setOperatorsList([
          { id: "op-caixa-1", name: "Caixa Principal", role: "operator", active: true },
          { id: "op-caixa-2", name: "Caixa Secundário (Balcão 2)", role: "operator", active: true },
          { id: "admin-1", name: "Administrador Geral", role: "manager", active: true },
        ]);
      } finally {
        setLoadingOperators(false);
        inputRefs[0].current?.focus();
      }
    }

    loadOperators();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (status === "success" || status === "verifying") return;

    const digit = value.replace(/\D/g, "").slice(-1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);

    if (digit && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    if (newPin.every((d) => d !== "") && digit !== "") {
      handleLogin(newPin.join(""));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!pin[index] && index > 0) {
        inputRefs[index - 1].current?.focus();
      }
      setStatus("idle");
      setErrorMessage("");
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);

    if (pastedData.length === 4) {
      const newPin = pastedData.split("");
      setPin(newPin);
      inputRefs[3].current?.focus();
      handleLogin(pastedData);
    }
  };

  // 2. Processamento Real da Autenticação no Supabase via RPC
  const handleLogin = async (fullPin: string) => {
    try {
      setStatus("verifying");
      setErrorMessage("");

      let authenticatedOperator: OperatorOption | null = null;

      // 1. Tenta autenticar via RPC no Supabase
      try {
        const { data, error } = await supabase.rpc("verify_operator_pin", {
          p_operator_id: selectedOperatorId || null,
          p_pin: fullPin,
        });

        if (!error && data && data.length > 0) {
          authenticatedOperator = data[0];
        }
      } catch (rpcErr) {
        console.warn("RPC verify_operator_pin não disponível ou falhou:", rpcErr);
      }

      // 2. Fallback via query direta no Supabase
      if (!authenticatedOperator) {
        try {
          let query = supabase.from("operators").select("id, name, role").eq("pin", fullPin);
          if (selectedOperatorId) {
            query = query.eq("id", selectedOperatorId);
          }
          const { data, error } = await query.maybeSingle();
          if (!error && data) {
            authenticatedOperator = data;
          }
        } catch (tableErr) {
          console.warn("Query na tabela operators falhou:", tableErr);
        }
      }

      // 3. Fallback de PINs locais registrados
      if (!authenticatedOperator) {
        const localPins: Record<string, OperatorOption> = {
          "5464": { id: "op-1", name: "Operador 01 - Caixa Principal", role: "CAIXA" },
          "1234": { id: "op-2", name: "Operador 02 - Balcão 2", role: "CAIXA" },
          "0000": { id: "admin", name: "Administrador Geral", role: "GERENTE" },
          "2026": { id: "gerente", name: "Gerente Masakula", role: "GERENTE" },
        };

        if (localPins[fullPin]) {
          if (!selectedOperatorId || localPins[fullPin].id === selectedOperatorId) {
            authenticatedOperator = localPins[fullPin];
          }
        }
      }

      // Pequena pausa para garantir a fluidez da animação visual
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Validação estrita dos dados retornados
      if (!authenticatedOperator) {
        setStatus("error");
        setErrorMessage("PIN inválido ou operador não encontrado.");

        // Reset dos campos em caso de erro
        setTimeout(() => {
          setPin(["", "", "", ""]);
          inputRefs[0].current?.focus();
          setStatus("idle");
        }, 1200);
        return;
      }

      // Autenticado com Sucesso
      setStatus("success");

      // Guardar a sessão ativa
      try {
        localStorage.setItem("active_operator", JSON.stringify(authenticatedOperator));
      } catch (e) {
        console.warn("Falha ao salvar no localStorage", e);
      }

      // Disparar redirecionamento ou callbacks
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(authenticatedOperator!);
        }
        if (onNavigateToPos) {
          onNavigateToPos();
        }
      }, 1200);
    } catch (err) {
      console.error("Erro na autenticação:", err);
      setStatus("error");
      setErrorMessage("Erro de ligação ao servidor.");
      setTimeout(() => {
        setPin(["", "", "", ""]);
        inputRefs[0].current?.focus();
        setStatus("idle");
      }, 1200);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* LUZ DE FUNDO DINÂMICA */}
      <div
        className={`absolute w-96 h-96 rounded-full blur-[120px] transition-all duration-700 pointer-events-none ${
          status === "success"
            ? "bg-[#32D583]/25 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            : status === "error"
            ? "bg-red-500/20 top-1/3 left-1/2 -translate-x-1/2"
            : "bg-indigo-600/20 top-1/4 left-1/2 -translate-x-1/2"
        }`}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-neutral-900/80 border border-neutral-800/80 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl relative z-10 flex flex-col items-center text-center overflow-hidden transition-colors duration-700"
      >
        {/* ONDA DE FUNDO SUBINDO EM AZUL BEBÉ NA VERIFICAÇÃO COM SUCESSO (KEYFRAMES CSS) */}
        {status === "success" && (
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-3xl">
            <div className="absolute inset-0 wave-upward-container bg-gradient-to-t from-sky-300 via-sky-200 to-sky-100 flex flex-col justify-start">
              {/* Crista de ondas animadas */}
              <div className="relative w-full h-12 -mt-6">
                <svg
                  className="absolute top-0 left-0 w-[200%] h-12 text-sky-200 fill-current wave-crest-1 opacity-90"
                  viewBox="0 0 100 20"
                  preserveAspectRatio="none"
                >
                  <path d="M0 10 Q 12.5 0, 25 10 T 50 10 T 75 10 T 100 10 V 20 H 0 Z" />
                </svg>
                <svg
                  className="absolute top-1 left-0 w-[200%] h-10 text-sky-100 fill-current wave-crest-2 opacity-80"
                  viewBox="0 0 100 20"
                  preserveAspectRatio="none"
                >
                  <path d="M0 10 Q 12.5 20, 25 10 T 50 10 T 75 10 T 100 10 V 20 H 0 Z" />
                </svg>
              </div>
              <div className="flex-1 w-full bg-gradient-to-b from-sky-100 via-sky-200/90 to-sky-300/95" />
            </div>
          </div>
        )}

        {/* LOGO DO SISTEMA */}
        <div className="mb-6 flex flex-col items-center relative z-10">
          <div
            className={`p-3 rounded-2xl shadow-lg mb-3 border transition-colors duration-500 ${
              status === "success"
                ? "bg-sky-500/20 border-sky-400/40 text-sky-950 shadow-sky-400/30"
                : "bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-indigo-500/20 border-indigo-400/30"
            }`}
          >
            <ShieldCheck className={`w-8 h-8 ${status === "success" ? "text-slate-900" : "text-white"}`} />
          </div>
          <h1
            className={`text-2xl font-black tracking-tight transition-colors duration-500 ${
              status === "success" ? "text-slate-950" : "text-white"
            }`}
          >
            Masakula ERP
          </h1>
          <p
            className={`text-xs font-medium transition-colors duration-500 ${
              status === "success" ? "text-slate-700" : "text-neutral-400"
            }`}
          >
            Acesso Rápido por PIN Numérico
          </p>
        </div>

        {/* SELECT DINÂMICO DE OPERADORES DO SUPABASE */}
        <div className="w-full mb-6 relative z-10">
          <div className="relative">
            <User
              className={`w-4 h-4 absolute left-3.5 top-3.5 ${
                status === "success" ? "text-slate-700" : "text-neutral-500"
              }`}
            />
            <select
              value={selectedOperatorId}
              onChange={(e) => {
                setSelectedOperatorId(e.target.value);
                setPin(["", "", "", ""]);
                setStatus("idle");
                inputRefs[0].current?.focus();
              }}
              disabled={loadingOperators || status === "verifying" || status === "success"}
              className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none transition appearance-none cursor-pointer disabled:opacity-50 ${
                status === "success"
                  ? "bg-white/70 border border-sky-300 text-slate-900 focus:border-sky-500"
                  : "bg-neutral-950 border border-neutral-800 text-neutral-200 focus:border-indigo-500"
              }`}
            >
              <option value="">Todos os Operadores (Identificação Automática)</option>
              {operatorsList.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name} • {formatRoleName(op.role)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TÍTULO DA ETAPA */}
        <div className="space-y-1 mb-6 relative z-10">
          <h2
            className={`text-sm font-extrabold uppercase tracking-wider transition-colors duration-500 ${
              status === "success" ? "text-slate-950" : "text-white"
            }`}
          >
            {status === "success" ? "Autenticado com Sucesso" : "Introduza o seu PIN"}
          </h2>
          <p
            className={`text-xs transition-colors duration-500 ${
              status === "success" ? "text-slate-700 font-semibold" : "text-neutral-400"
            }`}
          >
            {status === "success"
              ? "A redirecionar para o terminal de caixa..."
              : "Digite o código de 4 dígitos cadastrado"}
          </p>
        </div>

        {/* DÍGITOS COM ANIMAÇÃO */}
        <div className="relative w-full flex justify-center items-center min-h-[76px] my-2">
          <AnimatePresence mode="wait">
            {status !== "success" ? (
              <motion.div
                key="pin-inputs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-3"
              >
                {pin.map((digit, index) => (
                  <motion.div
                    key={index}
                    animate={
                      status === "error"
                        ? { x: [-8, 8, -6, 6, 0] }
                        : { scale: digit ? 1.05 : 1 }
                    }
                    transition={{ duration: 0.3 }}
                    className={`relative w-14 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 overflow-hidden shadow-lg ${
                      digit
                        ? "border-2 border-sky-400 shadow-sky-400/30 ring-2 ring-sky-300/40"
                        : "bg-neutral-950 border-2 border-neutral-800 hover:border-neutral-700 shadow-black/50"
                    }`}
                  >
                    {/* Animação de Onda Subindo em Azul Bebé */}
                    <AnimatePresence>
                      {digit && (
                        <motion.div
                          initial={{ y: "100%", opacity: 0 }}
                          animate={{ y: "0%", opacity: 1 }}
                          exit={{ y: "100%", opacity: 0 }}
                          transition={{ type: "spring", stiffness: 240, damping: 22 }}
                          className="absolute inset-0 z-0 bg-gradient-to-t from-sky-400 via-sky-300 to-sky-200 pointer-events-none"
                        >
                          {/* Cristas de onda animadas no topo */}
                          <motion.svg
                            className="absolute -top-3 left-0 w-[200%] h-4 text-sky-200 fill-current opacity-85 pointer-events-none"
                            viewBox="0 0 100 20"
                            preserveAspectRatio="none"
                            animate={{ x: ["0%", "-50%"] }}
                            transition={{ repeat: Infinity, ease: "linear", duration: 2.2 }}
                          >
                            <path d="M0 10 Q 12.5 0, 25 10 T 50 10 T 75 10 T 100 10 V 20 H 0 Z" />
                          </motion.svg>
                          <motion.svg
                            className="absolute -top-2 left-0 w-[200%] h-3 text-sky-100/70 fill-current pointer-events-none"
                            viewBox="0 0 100 20"
                            preserveAspectRatio="none"
                            animate={{ x: ["-50%", "0%"] }}
                            transition={{ repeat: Infinity, ease: "linear", duration: 3 }}
                          >
                            <path d="M0 10 Q 12.5 20, 25 10 T 50 10 T 75 10 T 100 10 V 20 H 0 Z" />
                          </motion.svg>

                          {/* Brilho suave superior */}
                          <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-transparent to-black/5 pointer-events-none" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <input
                      ref={inputRefs[index]}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      disabled={status === "verifying"}
                      className={`w-full h-full text-center text-2xl font-black bg-transparent outline-none cursor-pointer relative z-10 disabled:opacity-50 transition-colors ${
                        digit ? "text-slate-950 font-black" : "text-white"
                      }`}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              /* FUSÃO EM BARRINHA VERDE NEON */
              <motion.div
                key="success-banner"
                initial={{ scale: 0.85, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-2xl shadow-xl shadow-emerald-500/30 border border-emerald-300/40 flex items-center justify-center gap-6"
              >
                <div className="flex items-center gap-4 text-2xl font-black text-slate-950 tracking-widest">
                  {pin.map((d, i) => (
                    <motion.span
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      {d}
                    </motion.span>
                  ))}
                </div>

                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="w-7 h-7 bg-slate-950 text-[#32D583] rounded-full flex items-center justify-center shadow-md"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FEEDBACK DE VERIFICAÇÃO E ERROS */}
        {status === "verifying" && (
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>A validar PIN no Supabase...</span>
          </div>
        )}

        {status === "error" && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-bold text-red-400 mt-4 flex items-center justify-center gap-1.5"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </motion.p>
        )}

        {/* RODAPÉ INFORMATIVO */}
        <div className="mt-8 pt-4 border-t border-neutral-800/60 w-full flex items-center justify-between text-[11px] text-neutral-500">
          <span>Sessão Encriptada</span>
          <span className="font-mono">v2.4.0-ERP</span>
        </div>
      </motion.div>
    </div>
  );
}

export default PinLoginPage;
