import React from 'react';
import { Target, Check, ArrowRight, Briefcase, Zap, IndianRupee, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function CareerDiscovery() {
  const {
    careers,
    selectedCategory,
    setSelectedCategory,
    user,
    selectTargetRole,
    setActiveRole,
    setActiveTab
  } = useApp();

  const filterTabs = [
    { id: 'all', label: 'All Tracks' },
    { id: 'coding', label: 'Tech SDE (Coding)' },
    { id: 'analytics', label: 'Data & Analytics' },
    { id: 'non-coding', label: 'Low-Coding / Product QA' },
    { id: 'govt', label: 'Govt / Civil Services' }
  ];

  const getCategoryTheme = (cat) => {
    switch (cat) {
      case 'Tech-Coding':
        return {
          pill: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          gradient: 'from-emerald-500/10 to-teal-500/5',
          borderHover: 'hover:border-emerald-500/50',
          accent: 'text-emerald-400'
        };
      case 'Analytics':
        return {
          pill: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          gradient: 'from-cyan-500/10 to-blue-500/5',
          borderHover: 'hover:border-cyan-500/50',
          accent: 'text-cyan-400'
        };
      case 'Tech-NonCoding':
        return {
          pill: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          gradient: 'from-amber-500/10 to-orange-500/5',
          borderHover: 'hover:border-amber-500/50',
          accent: 'text-amber-400'
        };
      case 'CivilServices-Govt':
        return {
          pill: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          gradient: 'from-purple-500/10 to-indigo-500/5',
          borderHover: 'hover:border-purple-500/50',
          accent: 'text-purple-400'
        };
      default:
        return {
          pill: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
          gradient: 'from-indigo-500/10 to-slate-800/10',
          borderHover: 'hover:border-indigo-500/50',
          accent: 'text-indigo-400'
        };
    }
  };

  const handleOpenRoadmap = (role) => {
    setActiveRole(role);
    setActiveTab('roadmap');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight">
            Discover Gen-Z Career Tracks
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Compare expected compensations, industry demand, and choose your milestone target.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                selectedCategory === tab.id
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Career Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {careers.map((role) => {
          const theme = getCategoryTheme(role.category);
          const isTarget = user.target_role_id === role.id;

          return (
            <div
              key={role.id}
              className={`glass-card p-6 sm:p-7 rounded-3xl flex flex-col justify-between relative overflow-hidden transition-all border ${
                isTarget ? 'border-indigo-500/70 shadow-glow-purple bg-slate-900/95' : 'border-slate-800'
              } ${theme.borderHover}`}
            >
              {/* Target Banner if active */}
              {isTarget && (
                <div className="absolute top-4 right-4 flex items-center space-x-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-3 py-1 rounded-full text-xs font-bold">
                  <Check className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Your Current Target</span>
                </div>
              )}

              <div>
                {/* Category & Demand Pills */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${theme.pill}`}>
                    {role.category}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center space-x-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>{role.demand_level}</span>
                  </span>
                </div>

                {/* Role Title */}
                <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-white mb-2 tracking-tight">
                  {role.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-300 leading-relaxed mb-5">
                  {role.description}
                </p>

                {/* Meta Attributes */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 mb-6">
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 block mb-0.5">
                      Starting CTC Range
                    </span>
                    <span className="text-sm font-extrabold text-emerald-400 font-heading">
                      {role.salary_range}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 block mb-0.5">
                      Curriculum Phases
                    </span>
                    <span className="text-sm font-bold text-slate-200 flex items-center space-x-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{role.milestone_count || 5} Milestones</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={() => selectTargetRole(role)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    isTarget
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 cursor-default'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  <span>{isTarget ? 'Active Target Role' : 'Set as My Target'}</span>
                </button>

                <button
                  onClick={() => handleOpenRoadmap(role)}
                  className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md transition-all group"
                >
                  <span>Explore Roadmap</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
