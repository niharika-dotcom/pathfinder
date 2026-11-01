import React, { useState } from 'react';
import {
  Flame,
  CheckCircle,
  ExternalLink,
  BookOpen,
  Sparkles,
  Youtube,
  Code2,
  Database,
  Briefcase,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function DailyPracticeVault() {
  const { dashboard, handleCheckInStreak, selectTargetRole, careers, setActiveTab } = useApp();
  const streak = dashboard.streak || { current_streak: 1, canCheckInToday: true };

  // Skill Gap self-assessment quiz state
  const [quizAnswers, setQuizAnswers] = useState({
    codingInterest: 'medium',
    dataAffinity: 'high',
    govtInterest: 'low',
    problemStyle: 'analytics'
  });
  const [suggestedRole, setSuggestedRole] = useState(null);

  const curatedResources = [
    {
      title: 'freeCodeCamp Full-Stack 2026 Bootcamp',
      category: 'Tech-Coding',
      type: 'Video Course',
      provider: 'freeCodeCamp YouTube',
      duration: '8.5 Hours',
      link: 'https://www.youtube.com/watch?v=nu_pCVPKzTk',
      icon: Code2,
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    },
    {
      title: 'Alex The Analyst: SQL & Portfolio Masterclass',
      category: 'Analytics',
      type: 'Hands-on Projects',
      provider: 'Alex The Analyst',
      duration: '6 Hours',
      link: 'https://www.youtube.com/playlist?list=PLUaB-1hjhk8GZ3kP9rFkC9C8Z0PqKq1b',
      icon: Database,
      badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
    },
    {
      title: 'Postman Student Expert API Workshop',
      category: 'Tech-NonCoding',
      type: 'Interactive Labs',
      provider: 'Postman Academy',
      duration: '3 Hours',
      link: 'https://learning.postman.com/docs/getting-started/introduction/',
      icon: Briefcase,
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    },
    {
      title: 'UPSC & State PSC Polity Framework by Laxmikanth',
      category: 'CivilServices-Govt',
      type: 'Editorial Notes',
      provider: 'PIB & NCERT Hub',
      duration: 'Self-Paced',
      link: 'https://ncert.nic.in/textbook.php',
      icon: BookOpen,
      badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
    }
  ];

  const handleComputeRecommendation = () => {
    let roleTitle = 'Full Stack Developer';
    if (quizAnswers.govtInterest === 'high') {
      roleTitle = 'Civil Services (APPSC / UPSC Aspirant)';
    } else if (quizAnswers.problemStyle === 'analytics' || quizAnswers.dataAffinity === 'high') {
      roleTitle = 'Data Analyst';
    } else if (quizAnswers.codingInterest === 'low') {
      roleTitle = 'Product & QA Specialist';
    }

    const matched = careers.find(c => c.title.toLowerCase().includes(roleTitle.toLowerCase())) || careers[0];
    setSuggestedRole(matched);
  };

  return (
    <div className="space-y-8">
      {/* 1. Daily Streak Hero Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-5 text-center sm:text-left">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-400 flex items-center justify-center shadow-glow-amber">
                <Flame className="w-10 h-10 text-slate-950 fill-slate-950 animate-bounce-subtle" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-amber-500/40 text-amber-300 font-extrabold text-[11px] px-2 py-0.5 rounded-full shadow">
                DAY {streak.current_streak}
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 justify-center sm:justify-start mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  Daily Habit Engine
                </span>
                <span className="text-xs text-slate-400">
                  {streak.canCheckInToday ? 'Status: Check-in Pending' : 'Status: Secured Today!'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
                {streak.current_streak}-Day Momentum Streak
              </h2>
              <p className="text-sm text-slate-300 mt-1 max-w-xl">
                Small consistent steps compound into placement offers. Check in daily and maintain your streak!
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
            <button
              onClick={handleCheckInStreak}
              disabled={!streak.canCheckInToday}
              className={`w-full sm:w-auto flex items-center justify-center space-x-2.5 px-6 py-4 rounded-2xl font-heading font-extrabold text-sm sm:text-base transition-all shadow-lg ${
                streak.canCheckInToday
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-glow-amber cursor-pointer'
                  : 'bg-slate-800/80 text-slate-400 border border-slate-700/60 cursor-not-allowed'
              }`}
            >
              <Flame className="w-5 h-5 fill-current" />
              <span>
                {streak.canCheckInToday ? 'Claim Daily Streak Check-in 🔥' : 'Today\'s Streak Claimed ✓'}
              </span>
            </button>
            <span className="text-[11px] text-slate-400 mt-2">
              {streak.canCheckInToday ? 'Earn 10XP and extend habit chain' : 'Next check-in unlocks tomorrow at 12:00 AM'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Curated Resource Vault */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-heading font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Curated Learning Vault</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Verified free roadmaps, practice sets, and crash courses vetted for college campus hiring.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {curatedResources.map((res, i) => {
            const Icon = res.icon;
            return (
              <a
                key={i}
                href={res.link}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card p-5 rounded-2xl flex items-start justify-between space-x-4 border border-slate-800 hover:border-indigo-500/50 transition-all group"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 group-hover:text-cyan-400 transition-colors flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${res.badge}`}>
                        {res.category}
                      </span>
                      <span className="text-[11px] text-slate-400">• {res.duration}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {res.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Provided by {res.provider}
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-indigo-600 transition-all flex-shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* 3. Skill Gap Analyzer Quick Self-Check */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 relative overflow-hidden">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-heading font-extrabold text-white">
              Skill Gap & Track Analyzer
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Not sure which track fits your strengths? Answer 3 quick preferences to find your ideal career target.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Question 1: Coding Comfort */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <label className="text-xs font-bold text-slate-300 block mb-2">
              1. Coding Preference
            </label>
            <select
              value={quizAnswers.codingInterest}
              onChange={(e) => setQuizAnswers({ ...quizAnswers, codingInterest: e.target.value })}
              className="w-full bg-slate-950 text-slate-200 text-xs rounded-xl p-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="high">Love writing code & algorithms (SDE)</option>
              <option value="medium">Comfortable with scripts / SQL</option>
              <option value="low">Prefer low-code, logic & product QA</option>
            </select>
          </div>

          {/* Question 2: Analytics affinity */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <label className="text-xs font-bold text-slate-300 block mb-2">
              2. Data & Numbers
            </label>
            <select
              value={quizAnswers.dataAffinity}
              onChange={(e) => setQuizAnswers({ ...quizAnswers, dataAffinity: e.target.value })}
              className="w-full bg-slate-950 text-slate-200 text-xs rounded-xl p-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="high">Excited by dashboards & spreadsheets</option>
              <option value="medium">Neutral / standard math</option>
              <option value="low">Prefer qualitative & verbal skills</option>
            </select>
          </div>

          {/* Question 3: Public Sector vs Tech */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <label className="text-xs font-bold text-slate-300 block mb-2">
              3. Governance & Civil Services
            </label>
            <select
              value={quizAnswers.govtInterest}
              onChange={(e) => setQuizAnswers({ ...quizAnswers, govtInterest: e.target.value })}
              className="w-full bg-slate-950 text-slate-200 text-xs rounded-xl p-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="low">Prefer high-growth tech / private startups</option>
              <option value="high">Aspiring for APPSC / UPSC / State Govt</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            onClick={handleComputeRecommendation}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
          >
            Analyze My Best-Fit Track ✨
          </button>

          {suggestedRole && (
            <div className="flex items-center space-x-3 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl w-full sm:w-auto">
              <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <div>
                <span className="text-[11px] uppercase font-bold text-indigo-300 block">Recommended For You</span>
                <span className="text-sm font-extrabold text-white">{suggestedRole.title}</span>
              </div>
              <button
                onClick={() => {
                  selectTargetRole(suggestedRole);
                  setActiveTab('roadmap');
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all ml-2"
              >
                Adopt Track
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
