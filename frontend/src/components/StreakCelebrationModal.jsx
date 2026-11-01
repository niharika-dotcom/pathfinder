import React from 'react';
import { Flame, Sparkles, X, CheckCircle, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function StreakCelebrationModal() {
  const { dashboard, isCelebrationModalOpen, setIsCelebrationModalOpen } = useApp();
  const streak = dashboard.streak || { current_streak: 1 };

  if (!isCelebrationModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-sm p-7 rounded-3xl border border-amber-500/40 shadow-glow-amber text-center relative overflow-hidden bg-slate-900/95">
        <button
          onClick={() => setIsCelebrationModalOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Animated flame burst */}
        <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 flex items-center justify-center shadow-glow-amber animate-bounce-subtle">
          <Flame className="w-12 h-12 text-slate-950 fill-slate-950" />
        </div>

        <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-block mb-2">
          Daily Streak Claimed!
        </span>

        <h3 className="text-2xl font-heading font-extrabold text-white mb-1">
          {streak.current_streak} Days of Consistent Practice 🔥
        </h3>

        <p className="text-xs text-slate-300 leading-relaxed mb-6">
          "Success doesn't come from what you do occasionally, it comes from what you do consistently." Keep this chain unbroken!
        </p>

        <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 text-left mb-6 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Daily Habit Check-in Recorded</p>
            <p className="text-[11px] text-slate-400">Database updated with today's activity timestamp.</p>
          </div>
        </div>

        <button
          onClick={() => setIsCelebrationModalOpen(false)}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-heading font-extrabold text-sm uppercase tracking-wider shadow-lg transition-all"
        >
          Keep Crushing It 🚀
        </button>
      </div>
    </div>
  );
}
