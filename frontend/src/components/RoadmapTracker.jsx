import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  BookOpen,
  Sparkles,
  Lock,
  ChevronDown,
  ArrowUpRight,
  Share2,
  Award
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import ReadinessScoreBar from './ReadinessScoreBar';

export default function RoadmapTracker() {
  const {
    user,
    activeRole,
    careers,
    setActiveRole,
    roadmapData,
    loadingRoadmap,
    toggleMilestone,
    selectTargetRole
  } = useApp();

  const [filterState, setFilterState] = useState('all'); // 'all' | 'pending' | 'completed'

  const role = roadmapData?.role || activeRole || (careers.length > 0 ? careers[0] : null);
  const milestones = roadmapData?.milestones || [];
  const isTarget = user.target_role_id === role?.id;

  const filteredMilestones = milestones.filter(m => {
    if (filterState === 'completed') return m.is_completed;
    if (filterState === 'pending') return !m.is_completed;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* 1. Readiness Score Bar Widget */}
      <ReadinessScoreBar />

      {/* 2. Career Role Selector & Roadmap Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-bold text-indigo-400">Viewing Track:</span>
              {isTarget && (
                <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  Target Role
                </span>
              )}
            </div>
            {/* Role Switcher Dropdown */}
            <div className="relative inline-block mt-0.5">
              <select
                value={role?.id || ''}
                onChange={(e) => {
                  const selected = careers.find(c => c.id === parseInt(e.target.value, 10));
                  if (selected) setActiveRole(selected);
                }}
                className="bg-slate-900 text-white font-heading font-bold text-lg rounded-xl px-3 py-1.5 border border-slate-700/80 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {careers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.category})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons: Set as Target & Filter Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {!isTarget && role && (
            <button
              onClick={() => selectTargetRole(role)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/40 transition-all"
            >
              Set as My Target Role
            </button>
          )}

          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setFilterState('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterState === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({milestones.length})
            </button>
            <button
              onClick={() => setFilterState('pending')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterState === 'pending' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              In Progress ({milestones.filter(m => !m.is_completed).length})
            </button>
            <button
              onClick={() => setFilterState('completed')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterState === 'completed' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Done ({milestones.filter(m => m.is_completed).length})
            </button>
          </div>
        </div>
      </div>

      {/* 3. Step-by-Step Interactive Roadmap Timeline */}
      {loadingRoadmap ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Syncing roadmap milestones...</p>
        </div>
      ) : (
        <div className="relative space-y-6">
          {/* Vertical connecting line */}
          <div className="hidden sm:block absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-slate-800 pointer-events-none"></div>

          {filteredMilestones.length === 0 ? (
            <div className="p-12 text-center glass-panel rounded-3xl border border-slate-800">
              <Award className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">No milestones match filter</h3>
              <p className="text-sm text-slate-400">Switch filter back to "All" to view all curriculum phases.</p>
            </div>
          ) : (
            filteredMilestones.map((milestone, idx) => {
              const isCompleted = Boolean(milestone.is_completed);

              return (
                <div
                  key={milestone.id}
                  className={`relative flex flex-col sm:flex-row items-start gap-5 p-6 sm:p-7 rounded-3xl glass-card border transition-all ${
                    isCompleted
                      ? 'border-emerald-500/40 bg-slate-900/90 shadow-glow-emerald'
                      : 'border-slate-800 hover:border-indigo-500/50'
                  }`}
                >
                  {/* Phase Number Circle Marker */}
                  <div className="relative z-10 flex-shrink-0">
                    <button
                      onClick={() => toggleMilestone(milestone.id, isCompleted)}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center font-heading font-extrabold text-base transition-all shadow-md group ${
                        isCompleted
                          ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/30'
                          : 'bg-slate-800 border-2 border-slate-700 text-slate-300 hover:border-indigo-500 hover:text-white'
                      }`}
                      title="Click to toggle milestone status"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-7 h-7 text-slate-950" />
                      ) : (
                        <span>#{milestone.phase_num}</span>
                      )}
                    </button>
                  </div>

                  {/* Milestone Content */}
                  <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          Phase {milestone.phase_num}
                        </span>
                        {isCompleted && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Completed</span>
                          </span>
                        )}
                      </div>

                      {/* External Resource Link */}
                      {milestone.resource_link && (
                        <a
                          href={milestone.resource_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-xl transition-all w-fit"
                        >
                          <span>Verified Resource</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    <h3 className={`text-lg sm:text-xl font-heading font-bold text-white mb-2 ${
                      isCompleted ? 'text-slate-100' : ''
                    }`}>
                      {milestone.title}
                    </h3>

                    <p className="text-sm text-slate-300 leading-relaxed mb-4">
                      {milestone.description}
                    </p>

                    {/* Footer Toggle Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                      <div className="text-xs text-slate-400">
                        {isCompleted && milestone.completed_at ? (
                          <span>Finished: {new Date(milestone.completed_at).toLocaleDateString()}</span>
                        ) : (
                          <span>Estimated time: 1-2 weeks</span>
                        )}
                      </div>

                      <button
                        onClick={() => toggleMilestone(milestone.id, isCompleted)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow-purple'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Completed • Click to Undo</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-4 h-4" />
                            <span>Mark Completed</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
