import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    const { error } = await signIn(email, password);
    if (error) {
      setErrorMsg('Credenciais inválidas. Verifique o e-mail e a palavra-passe.');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-[#131313]">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl max-w-md w-full p-8 space-y-6">
        
        {/* Logo / Banner */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#131313] text-[#E1FB15] rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck size={26} />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Masakula PDV</h1>
          <p className="text-xs text-gray-400 font-medium">Informe suas credenciais para acessar o sistema</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-2xl border border-red-100 text-center">
            {errorMsg}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-gray-700">E-mail de Acesso</label>
            <div className="relative mt-1">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operador@masakula.co.ao"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-black/5"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-700">Palavra-passe</label>
            <div className="relative mt-1">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-black/5"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-[#131313] hover:bg-black text-white font-black rounded-2xl shadow-lg transition text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'A Autenticar...' : 'Entrar no Sistema'}
          </button>
        </form>

      </div>
    </div>
  );
}
