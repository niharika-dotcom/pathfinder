import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Toast() {
  const { toast } = useApp();

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 p-4 rounded-2xl glass-panel border shadow-2xl animate-bounce-subtle max-w-sm transition-all bg-slate-900/95 border-slate-700">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isSuccess ? 'bg-emerald-500/10 text-emerald-400' : isError ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'
      }`}>
        {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : isError ? <AlertCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
      </div>
      <p className="text-xs font-semibold text-slate-100">
        {toast.message}
      </p>
    </div>
  );
}
