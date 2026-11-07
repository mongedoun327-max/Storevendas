import React, { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, AlertCircle, X } from "lucide-react";

export interface PinVerificationProps {
  title?: string;
  subtitle?: string;
  correctPin?: string; // Ex: "5464" (Para validação local) ou função de callback
  onSuccess?: (pin: string) => void;
  onResend?: () => void;
  onClose?: () => void;
}

export function PinVerificationModal({
  title = "Código de Verificação",
  subtitle = "Introduza o código PIN de 4 dígitos do operador registrado.",
  correctPin = "5464", // Substitua pela verificação no Supabase
  onSuccess,
  onResend,
  onClose,
}: PinVerificationProps) {
  const [pin, setPin] = useState<string[]>(["", "", "", ""]);
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Auto-foco no primeiro campo ao carregar
  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  // Handler de mudança de valor
  const handleChange = (index: number, value: string) => {
    if (status === "success") return;

    // Aceita apenas números
    const digit = value.replace(/\D/g, "").slice(-1);

    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);

    // Se digitou um número, avança para o próximo campo
    if (digit && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Quando o 4º dígito é preenchido, dispara a verificação automática
    if (newPin.every((d) => d !== "") && digit !== "") {
      verifyPin(newPin.join(""));
    }
  };

  // Handler para apagar com Backspace
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!pin[index] && index > 0) {
        inputRefs[index - 1].current?.focus();
      }
      setStatus("idle");
      setErrorMessage("");
    }
  };

  // Handler para colar o código completo (Paste)
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);

    if (pastedData.length === 4) {
      const newPin = pastedData.split("");
      setPin(newPin);
      inputRefs[3].current?.focus();
      verifyPin(pastedData);
    }
  };

  // Lógica de Validação com Animação
  const verifyPin = async (fullPin: string) => {
    setStatus("verifying");
    setErrorMessage("");

    // Simula delay de rede/servidor para animação
    await new Promise((res) => setTimeout(res, 600));

    if (fullPin === correctPin) {
      setStatus("success");
      setTimeout(() => {
        if (onSuccess) onSuccess(fullPin);
      }, 1200);
    } else {
      setStatus("error");
      setErrorMessage("PIN incorreto. Tente novamente.");
      // Limpa os campos após erro
      setTimeout(() => {
        setPin(["", "", "", ""]);
        inputRefs[0].current?.focus();
      }, 800);
    }
  };

  const handleReset = () => {
    setPin(["", "", "", ""]);
    setStatus("idle");
    setErrorMessage("");
    inputRefs[0].current?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-white border border-zinc-200 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden transition-colors duration-700"
      >
        {/* ONDA DE FUNDO SUBINDO EM AZUL BEBÉ NA VERIFICAÇÃO COM SUCESSO */}
        {status === "success" && (
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-3xl">
            <div className="absolute inset-0 wave-upward-container bg-gradient-to-t from-sky-300 via-sky-200 to-sky-100 flex flex-col justify-start">
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

        {/* BOTÃO FECHAR SE DISPONÍVEL */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-4 right-4 z-20 p-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* LUZ DE FUNDO AMBIENTE */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
            status === "success"
              ? "bg-sky-400/20"
              : status === "error"
              ? "bg-red-500/15"
              : "bg-indigo-600/10"
          }`}
        />

        {/* TÍTULO E SUBTÍTULO */}
        <motion.div
          animate={status === "success" ? { y: -5 } : { y: 0 }}
          className="space-y-1 mb-8 relative z-10"
        >
          <h3 className="text-xl font-extrabold tracking-tight text-zinc-900">
            {status === "success" ? "Verificação Bem-sucedida" : title}
          </h3>
          <p className="text-xs max-w-[240px] mx-auto leading-relaxed text-zinc-500">
            {status === "success"
              ? `O seu código de segurança de 4 dígitos ${pin.join("")} foi verificado.`
              : subtitle}
          </p>
        </motion.div>

        {/* 🔮 ÁREA DOS DÍGITOS COM ANIMAÇÃO */}
        <div className="relative my-2 w-full flex justify-center items-center z-10 min-h-[72px]">
          <AnimatePresence mode="wait">
            {/* ESTADO 1: OS 4 QUADRADOS 3D (EM DIGITAÇÃO OU ERRO) */}
            {status !== "success" ? (
              <motion.div
                key="pin-inputs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
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
                    className={`relative w-14 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 overflow-hidden shadow-sm ${
                      digit
                        ? "border-2 border-sky-500 shadow-sky-500/20 ring-2 ring-sky-300/40 bg-white"
                        : "bg-zinc-50 border-2 border-zinc-200 hover:border-zinc-300"
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
                      className={`w-full h-full text-center text-2xl font-black bg-transparent outline-none cursor-pointer relative z-10 transition-colors ${
                        digit ? "text-slate-950 font-black" : "text-zinc-900"
                      }`}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              /* ESTADO 2: FUSÃO EM BARRINHA VERDE COM VISTO */
              <motion.div
                key="success-banner"
                initial={{ scale: 0.8, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-2xl shadow-xl shadow-emerald-500/25 border border-emerald-300/40 flex items-center justify-center gap-6"
              >
                {/* Números exibidos em estilo pílula verde */}
                <div className="flex items-center gap-4 text-2xl font-black text-slate-950 tracking-wider">
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

                {/* Ícone de Check com animação */}
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

        {/* MENSAGEM DE ERRO (SE HOUVER) */}
        {status === "error" && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-bold text-red-600 mt-3 flex items-center gap-1"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMessage}</span>
          </motion.p>
        )}

        {/* RODAPÉ: REENVIAR / REINICIAR */}
        {status !== "success" && (
          <div className="mt-8 relative z-10 flex items-center gap-1.5 text-xs">
            <span className="text-zinc-400 font-medium">Não recebeu o código?</span>
            <button
              type="button"
              onClick={() => {
                handleReset();
                if (onResend) onResend();
              }}
              className="font-extrabold text-indigo-600 hover:text-indigo-700 transition underline underline-offset-4 cursor-pointer"
            >
              Reenviar OTP
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
