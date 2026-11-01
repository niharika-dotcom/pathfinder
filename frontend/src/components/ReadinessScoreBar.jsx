import React from 'react';
import { Award, Zap, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ReadinessScoreBar() {
  const { dashboard, activeRole, roadmapData } = useApp();

  // Prefer active roadmap numbers if currently viewing a specific role
  const total = roadmapData?.totalMilestones ?? dashboard.totalMilestonesCount ?? 5;
  const completed = roadmapData?.completedCount ?? dashboard.completedMilestonesCount ?? 0;
  const score = roadmapData?.readinessScore ?? dashboard.readinessScore ?? 0;
  const roleName = activeRole?.title || dashboard.targetRole?.title || 'Selected Career';

  // Tier level badge
  let tier = {
    label: 'Foundation Stage',
    subtext: 'Building fundamentals & core building blocks',
    color: 'from-amber-500 to-orange-500',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  };

  if (score >= 85) {
    tier = {
      label: 'Campus Hiring Ready 🔥',
      subtext: 'Ready for top-tier product MNCs & high-CTC placements',
      color: 'from-emerald-400 via-teal-400 to-cyan-400',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    };
  } else if (score >= 60) {
    tier = {
      label: 'Interview Ready ⚡',
      subtext: 'Capable of tackling core technical & technical rounds',
      color: 'from-indigo-500 via-purple-500 to-cyan-400',
      badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
    };
  } else if (score >= 35) {
    tier = {
      label: 'Skill Acceleration 🚀',
      subtext: 'Intermediate phase: creating real-world projects & proofs',
      color: 'from-cyan-500 to-blue-500',
      badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
    };
  }

  return (
    <div className="glass-panel p-6 sm:p-7 rounded-3xl relative overflow-hidden border border-slate-800 shadow-xl">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center space-x-2.5 mb-1.5">
              <span className={`px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full border ${tier.badge}`}>
                {tier.label}
              </span>
              <span className="text-xs text-slate-400">
                Tracking: <strong className="text-slate-200">{roleName}</strong>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight flex items-center space-x-2">
              <span>Readiness Score:</span>
              <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                {score}%
              </span>
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {tier.subtext}
            </p>
          </div>

          {/* Quick Counter Chips */}
          <div className="flex items-center space-x-3 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
            <div className="flex items-center space-x-2 pr-3 border-r border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Completed</p>
                <p className="text-sm font-bold text-white">{completed} / {total}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 pl-1">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">To Next Tier</p>
                <p className="text-sm font-bold text-white">
                  {score >= 85 ? 'Max Tier' : `${Math.max(1, Math.ceil((70 - score) / (100 / (total || 5))))} Steps`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-4 bg-slate-900/90 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${tier.color} transition-all duration-700 ease-out shadow-sm`}
              style={{ width: `${Math.min(100, Math.max(4, score))}%` }}
            ></div>
          </div>

          {/* Progress scale ticks */}
          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400 px-1 pt-0.5">
            <span>0% Beginner</span>
            <span className="hidden sm:inline">35% Core Skills</span>
            <span>70% Interview Ready</span>
            <span className="text-emerald-400 font-bold">100% Placement Master</span>
          </div>
        </div>
      </div>
    </div>
  );
}
