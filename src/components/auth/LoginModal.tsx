import React, { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  UserCheck, 
  Monitor, 
  Zap, 
  Store,
  ChevronRight,
  Shield,
  Check,
  Loader2,
  Sparkles,
  Users
} from 'lucide-react';
import { UserSession } from '../../types';
import { useAuth, UserRole, DEMO_PROFILES } from '../../contexts/AuthContext';
import { PermissionMatrixModal } from './PermissionMatrixModal';
import { authenticateUser, getStoredUsers } from '../../utils/userAccounts';

interface LoginModalProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onLoginSuccess,
}) => {
  const { signIn, switchRole, setProfile } = useAuth();

  // Step State: 1 = Credentials, 2 = Terminal & Confirmation
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // PIN Input State
  const [pin, setPin] = useState<string[]>(['', '', '', '']);
  const [pinStatus, setPinStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');

  // Input refs for 4 PIN boxes
  const pinInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Step 2 Selection State
  const [selectedTerminal, setSelectedTerminal] = useState('Caixa 01 - Balcão Principal');
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(null);

  // Matrix Modal
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loginSuccessNotice, setLoginSuccessNotice] = useState(false);

  // Handle PIN change
  const handlePinChange = (index: number, value: string) => {
    if (pinStatus === 'success' || pinStatus === 'verifying') return;

    const digit = value.replace(/\D/g, '').slice(-1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    setPassword(newPin.join(''));

    if (digit && index < 3) {
      pinInputRefs[index + 1].current?.focus();
    }

    if (newPin.every((d) => d !== '') && digit !== '') {
      verifyAndAdvance(newPin.join(''));
    }
  };

  // Handle PIN keydown backspace
  const handlePinKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        pinInputRefs[index - 1].current?.focus();
      }
      setPinStatus('idle');
      setErrorMessage(null);
    }
  };

  // Handle PIN paste
  const handlePinPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);

    if (pastedData.length === 4) {
      const newPin = pastedData.split('');
      setPin(newPin);
      setPassword(pastedData);
      pinInputRefs[3].current?.focus();
      verifyAndAdvance(pastedData);
    }
  };

  // Verify PIN & Email against system accounts
  const verifyAndAdvance = async (fullPin: string) => {
    setPinStatus('verifying');
    setErrorMessage(null);

    await new Promise((res) => setTimeout(res, 400));

    // Authenticate against stored offline users
    const matched = authenticateUser(email, fullPin);

    if (matched) {
      setPinStatus('success');
      setAuthenticatedUser(matched);
      setSelectedTerminal(matched.terminal || 'Caixa 01 - Balcão Principal');

      setTimeout(() => {
        setPinStatus('idle');
        setCurrentStep(2);
      }, 700);
    } else {
      setPinStatus('error');
      setErrorMessage(
        'Credenciais inválidas. Verifique o e-mail ou o PIN de acesso.'
      );
      setTimeout(() => {
        setPin(['', '', '', '']);
        pinInputRefs[0].current?.focus();
        setPinStatus('idle');
      }, 1200);
    }
  };

  // Handle Step 1 Validation & Proceed to Step 2
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Por favor, introduza um endereço de e-mail corporativo válido.');
      return;
    }

    const currentPin = pin.join('');
    if (currentPin.length !== 4) {
      setErrorMessage('O código PIN de operador deve conter exatamente 4 dígitos.');
      return;
    }

    verifyAndAdvance(currentPin);
  };

  // Handle Final Submission (Step 2)
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const user = authenticatedUser || authenticateUser(email, pin.join(''));
      if (!user) {
        throw new Error('Sessão expirada. Por favor, introduza novamente o PIN.');
      }

      setLoginSuccessNotice(true);

      const isUserAdmin = user.role === 'admin';
      const targetRole: UserRole = isUserAdmin ? 'GERENTE' : 'CAIXA';

      setProfile({
        id: user.id,
        email: user.email,
        full_name: user.name,
        role: targetRole,
        active: user.active,
        terminalId: selectedTerminal
      });

      const session: UserSession = {
        email: user.email,
        name: user.name,
        role: user.role === 'admin' ? 'Administrador Master' : 'Atendente de Caixa',
        terminalId: selectedTerminal,
        isLoggedIn: true,
      };

      setTimeout(() => {
        setIsSubmitting(false);
        onLoginSuccess(session);
      }, 400);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Falha ao autenticar utilizador.');
    }
  };

  return (
    <div 
      id="view-login-modal-container"
      className="min-h-screen w-full bg-[#f8f9fa] flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden"
    >
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none" />
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-[1.05fr_0.95fr] items-center gap-8 lg:gap-16">
        {/* Editorial brand panel */}
        <section className="hidden lg:flex min-h-[640px] flex-col justify-center items-center px-6 py-8" aria-label="Marca Masakula">
          <div className="flex flex-col items-center gap-8">
            <div className="max-w-md text-center">
              <p className="text-6xl font-black leading-[1.05] tracking-tight text-zinc-950">Masakula</p>
              <p className="mt-5 text-2xl font-bold leading-[1.2] tracking-tight text-zinc-800">
                “Um nome,<br />várias soluções”
              </p>
            </div>
          </div>
        </section>

        {/* Main Corporate Login Card */}
        <div 
          id="login-corporate-card" 
          className="relative z-10 w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-2xl shadow-zinc-950/5 space-y-6"
        >
          {/* Indicador de etapas no topo */}
          <div id="login-top-step-flow" className="flex items-center justify-between px-3 py-2 rounded-2xl bg-zinc-50 border border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                currentStep === 1
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'bg-emerald-500 text-white'
              }`}>
                {currentStep > 1 ? '✓' : '1'}
              </span>
              <span className={`text-[11px] font-semibold ${currentStep === 1 ? 'text-zinc-900' : 'text-zinc-500'}`}>
                Credenciais
              </span>
            </div>

            <ChevronRight size={14} className="text-zinc-400" />

            <div className="flex items-center gap-1.5">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                currentStep === 2
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'bg-zinc-200 text-zinc-600'
              }`}>
                2
              </span>
              <span className={`text-[11px] font-semibold ${currentStep === 2 ? 'text-zinc-900' : 'text-zinc-500'}`}>
                Terminal &amp; Acesso
              </span>
            </div>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl font-black text-zinc-950 tracking-tight">
              {currentStep === 1 ? 'Autenticação no Sistema' : 'Terminal Designado'}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              {currentStep === 1 
                ? 'Introduza o e-mail corporativo e o PIN de 4 dígitos para aceder.' 
                : 'Confirme o terminal de trabalho para iniciar a sessão.'}
            </p>
          </div>

          {/* Error Notification */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: CREDENTIALS */}
          {currentStep === 1 && (
            <form onSubmit={handleProceedToStep2} className="space-y-4 text-xs">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-800 flex items-center gap-1.5">
                  <Mail size={14} className="text-zinc-500" />
                  <span>E-mail Corporativo</span>
                </label>
                <input
                  id="login-input-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@masakula.co.ao"
                  className="w-full px-3.5 py-3 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none transition-colors"
                />
              </div>

              {/* PIN BOXES */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-zinc-800 flex items-center gap-1.5">
                    <KeyRound size={14} className="text-zinc-500" />
                    <span>Código PIN (4 Dígitos)</span>
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    {email.includes('admin') ? 'PIN padrão: 5424' : 'PIN padrão: 4561'}
                  </span>
                </div>

                <div className="relative w-full flex justify-center items-center min-h-[72px] py-1">
                  <AnimatePresence mode="wait">
                    {pinStatus !== 'success' ? (
                      <motion.div
                        key="pin-boxes"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-2.5 sm:gap-3"
                      >
                        {pin.map((digit, index) => (
                          <motion.div
                            key={index}
                            animate={
                              pinStatus === 'error'
                                ? { x: [-6, 6, -4, 4, 0] }
                                : { scale: digit ? 1.02 : 1 }
                            }
                            transition={{ duration: 0.2 }}
                            className={`relative w-12 sm:w-14 h-14 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-200 overflow-hidden shadow-xs ${
                              digit
                                ? 'bg-zinc-200/80 border-2 border-zinc-900 text-zinc-950'
                                : 'bg-zinc-50 border-2 border-zinc-200 text-zinc-900 hover:border-zinc-300'
                            }`}
                          >
                            <input
                              id={index === 0 ? "login-input-password" : `login-input-pin-${index}`}
                              ref={pinInputRefs[index]}
                              type="password"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handlePinChange(index, e.target.value)}
                              onKeyDown={(e) => handlePinKeyDown(index, e)}
                              onPaste={handlePinPaste}
                              disabled={pinStatus === 'verifying'}
                              className="w-full h-full text-center text-2xl font-black bg-transparent outline-none cursor-pointer relative z-10 transition-colors text-zinc-950"
                            />
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="success-banner"
                        initial={{ scale: 0.85, opacity: 0, y: 8 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="w-full py-3 px-5 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-2xl shadow-lg shadow-emerald-500/25 border border-emerald-300/40 flex items-center justify-center gap-5 text-slate-950"
                      >
                        <div className="flex items-center gap-3 text-xl font-black tracking-widest">
                          {pin.map((d, i) => (
                            <span key={i}>{d}</span>
                          ))}
                        </div>
                        <div className="w-6 h-6 bg-slate-950 text-[#32D583] rounded-full flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {pinStatus === 'verifying' && (
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600 pt-1">
                    <Loader2 size={14} className="animate-spin" />
                    <span>A validar credenciais...</span>
                  </div>
                )}
              </div>

              {/* Limpar PIN */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-zinc-950 focus:ring-zinc-950"
                  />
                  <span className="text-zinc-600 text-xs">Lembrar credenciais</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setPin(['', '', '', '']);
                    setPassword('');
                    setPinStatus('idle');
                    setErrorMessage(null);
                    pinInputRefs[0].current?.focus();
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-900 font-medium underline cursor-pointer"
                >
                  Limpar PIN
                </button>
              </div>

              {/* Botão de Validação */}
              <div className="pt-3">
                <button
                  id="btn-login-proceed-step-2"
                  type="submit"
                  disabled={pinStatus === 'verifying'}
                  className="w-full py-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span>Validar e Prosseguir</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: CONFIRMATION & TERMINAL */}
          {currentStep === 2 && (
            <form onSubmit={handleFinalSubmit} className="space-y-4 text-xs">
              {/* Confirmação do Utilizador */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base ${
                  authenticatedUser?.role === 'admin'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {authenticatedUser?.role === 'admin' ? '👑' : '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <strong className="text-zinc-950 text-sm truncate">{authenticatedUser?.name}</strong>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      authenticatedUser?.role === 'admin'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {authenticatedUser?.role === 'admin' ? 'Administrador' : 'Atendente'}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 font-mono truncate">{authenticatedUser?.email}</div>
                </div>
              </div>

              {/* Terminal Selector */}
              <div className="space-y-2">
                <label className="font-semibold text-zinc-800 flex items-center gap-1.5">
                  <Monitor size={14} className="text-zinc-500" />
                  <span>Terminal de Atendimento Atribuído</span>
                </label>

                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'Caixa 01 - Balcão Principal', desc: 'Faturação rápida & TPA' },
                    { id: 'Terminal Master 01 - Gestão', desc: 'Posto executivo & auditoria' },
                  ].map((term) => {
                    const isSelected = selectedTerminal === term.id;
                    return (
                      <button
                        key={term.id}
                        type="button"
                        onClick={() => setSelectedTerminal(term.id)}
                        className={`p-3 rounded-2xl text-left border flex items-center justify-between transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs' 
                            : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Store size={18} className={isSelected ? 'text-emerald-400' : 'text-zinc-500'} />
                          <div>
                            <p className="font-bold text-xs">{term.id}</p>
                            <p className={`text-[10px] ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}>
                              {term.desc}
                            </p>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={16} className="text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Success Notification */}
              {loginSuccessNotice && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 size={18} className="text-emerald-600 animate-bounce" />
                  <span>Sessão autorizada! A carregar o sistema...</span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 space-y-2">
                <button
                  id="btn-login-submit-final"
                  type="submit"
                  disabled={isSubmitting || loginSuccessNotice}
                  className="w-full py-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 disabled:opacity-75 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>A iniciar sessão...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={15} className="text-amber-400" />
                      <span>Entrar no Sistema</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-full py-2 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Voltar e alterar credenciais</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
