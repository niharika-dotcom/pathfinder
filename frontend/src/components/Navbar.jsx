import React from 'react';
import { Compass, Flame, CheckCircle, Target, Sparkles, User, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const {
    user,
    dashboard,
    activeTab,
    setActiveTab,
    setIsProfileModalOpen,
    handleCheckInStreak
  } = useApp();

  const streak = dashboard.streak || { current_streak: 1, canCheckInToday: true };
  const readiness = dashboard.readinessScore || 0;

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-[#0B0F17]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('roadmap')}>
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-[2px] shadow-glow-purple">
              <div className="w-full h-full bg-[#0B0F17] rounded-[14px] flex items-center justify-center">
                <Compass className="w-6 h-6 text-cyan-400 animate-spin-slow" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-heading font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                  PathFinder
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                  Gen-Z Career OS
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Campus Hiring & Milestone Navigator
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('roadmap')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'roadmap'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Milestone Roadmap</span>
            </button>

            <button
              onClick={() => setActiveTab('discovery')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'discovery'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Career Discovery</span>
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'vault'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Practice & Vault</span>
            </button>
          </nav>

          {/* Right Side Actions: Streak & Student Profile */}
          <div className="flex items-center space-x-3">
            {/* Streak Counter Badge */}
            <div
              onClick={streak.canCheckInToday ? handleCheckInStreak : undefined}
              title={streak.canCheckInToday ? 'Click to claim today\'s streak check-in!' : 'Streak active for today!'}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer select-none ${
                streak.canCheckInToday
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20 shadow-glow-amber animate-pulse'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300'
              }`}
            >
              <Flame className={`w-5 h-5 ${streak.canCheckInToday ? 'text-amber-400 fill-amber-400' : 'text-amber-500 fill-amber-500/50'}`} />
              <div className="text-left">
                <div className="flex items-center space-x-1">
                  <span className="font-heading font-bold text-sm tracking-wide">
                    {streak.current_streak}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Days</span>
                </div>
              </div>
              {streak.canCheckInToday && (
                <span className="hidden sm:inline-block text-[11px] font-semibold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md ml-1">
                  Claim
                </span>
              )}
            </div>

            {/* Student Profile Pill */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center space-x-2.5 p-1.5 pr-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {user.name ? user.name.slice(0, 2).toUpperCase() : 'ST'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                  {user.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate max-w-[100px]">
                  {dashboard.targetRole?.title || 'Target unset'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
            </button>
          </div>

        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2.5 border-t border-slate-800/60">
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-lg ${
              activeTab === 'roadmap' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Roadmap</span>
          </button>
          <button
            onClick={() => setActiveTab('discovery')}
            className={`flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-lg ${
              activeTab === 'discovery' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Discovery</span>
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-lg ${
              activeTab === 'vault' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Practice</span>
          </button>
        </div>
      </div>
    </header>
  );
}
