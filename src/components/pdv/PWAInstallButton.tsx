import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'default' | 'compact' | 'icon';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  className = '', 
  variant = 'default' 
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // Se já estiver rodando instalado em modo standalone nativo, exibe o crachá de confirmação
  if (isInstalled) {
    if (variant === 'icon') {
      return (
        <div 
          title="Masakula instalado e pronto para uso 100% Offline"
          className="p-2.5 rounded-[var(--radius-lg)] text-emerald-600 bg-emerald-50/80 transition flex items-center justify-center cursor-default"
        >
          <CheckCircle2 size={18} />
        </div>
      );
    }
    return (
      <div 
        title="O Masakula está instalado e funciona 100% Offline sem depender de internet."
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-black text-emerald-700 shadow-2xs ${className}`}
      >
        <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
        <span className="hidden sm:inline">Instalado • 100% Offline</span>
        <span className="sm:hidden">Offline</span>
      </div>
    );
  }

  const handleAction = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        toast.success('Masakula instalado com sucesso! O aplicativo já pode ser usado offline.');
        return;
      }
    }
    setShowGuide(true);
  };

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={handleAction}
          aria-label="Instalar aplicação Masakula neste dispositivo"
          title="Instalar o Masakula neste dispositivo (100% Offline)"
          className={`p-2.5 rounded-[var(--radius-lg)] text-emerald-700 hover:text-emerald-950 hover:bg-emerald-50 transition flex items-center justify-center cursor-pointer ${className}`}
        >
          <Download size={19} />
        </button>
      ) : variant === 'compact' ? (
        <button
          type="button"
          onClick={handleAction}
          aria-label="Instalar aplicação Masakula neste dispositivo"
          title="Instalar o Masakula neste dispositivo (100% Offline)"
          className={`h-8 px-2.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-900 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${className}`}
        >
          <Download size={13} className="text-emerald-700 shrink-0" />
          <span>Instalar App</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleAction}
          aria-label="Instalar aplicação Masakula neste dispositivo"
          title="Instalar o Masakula neste dispositivo"
          className={`h-9 px-3 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-900 transition-colors hover:bg-emerald-100 flex items-center gap-2 cursor-pointer shrink-0 shadow-2xs ${className}`}
        >
          <Download className="h-3.5 w-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
          <span>Instalar aplicação</span>
        </button>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Download size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-950">Instalar Masakula no Computador / Celular</h3>
                  <p className="text-[11px] text-zinc-500 font-medium">Uso 100% Offline sem depender de internet</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-xs text-zinc-600 space-y-3">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 font-medium leading-relaxed">
                🚀 O <strong>Masakula ERP & PDV</strong> possui tecnologia PWA com suporte a funcionamento 100% offline. Uma vez instalado, você pode abrir o PDV, registrar vendas, bipar códigos de barras e emitir talões mesmo sem qualquer conexão com a internet.
              </div>

              {isIOS ? (
                <div className="space-y-1.5 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200">
                  <p className="font-bold text-zinc-900">Passos no iPhone / iPad (Safari):</p>
                  <ol className="list-decimal pl-4 space-y-1 text-zinc-700">
                    <li>Toque no botão <strong>Compartilhar</strong> (ícone do quadrado com seta para cima).</li>
                    <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</li>
                    <li>Abra o aplicativo pelo ícone criado na tela inicial.</li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-1.5 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200">
                  <p className="font-bold text-zinc-900">Passos no Chrome, Edge ou Navegador do Celular:</p>
                  <ol className="list-decimal pl-4 space-y-1 text-zinc-700">
                    <li>Na barra de endereço do navegador, clique no ícone de <strong>Instalar</strong> (ícone de monitor com seta para baixo) ou nos <strong>3 pontinhos do menu</strong>.</li>
                    <li>Selecione <strong>"Instalar Masakula ERP & PDV"</strong> (ou "Adicionar à tela inicial").</li>
                    <li>Um atalho na área de trabalho ou menu iniciar será criado e o app abrirá em janela própria e nativa.</li>
                  </ol>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              {isInstallable && (
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await install();
                    if (ok) {
                      setShowGuide(false);
                      toast.success('Aplicativo instalado com sucesso!');
                    }
                  }}
                  className="flex-1 rounded-2xl bg-emerald-600 py-2.5 text-xs font-black text-white hover:bg-emerald-700 cursor-pointer shadow-xs transition"
                >
                  Confirmar Instalação Agora
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className={`${isInstallable ? 'px-4' : 'w-full'} rounded-2xl bg-zinc-900 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 cursor-pointer`}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallButton;
