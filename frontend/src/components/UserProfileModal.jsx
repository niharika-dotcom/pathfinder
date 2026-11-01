import React, { useState } from 'react';
import { X, User, Mail, Sparkles, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function UserProfileModal() {
  const { user, isProfileModalOpen, setIsProfileModalOpen, loginOrSwitch } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  if (!isProfileModalOpen) return null;

  const demoAccounts = [
    {
      name: 'Alex Rivera',
      email: 'alex.rivera@campus.edu',
      role: 'Full Stack Developer Track (60% Done)'
    },
    {
      name: 'Priya Sharma',
      email: 'priya.sharma@college.ac.in',
      role: 'Data Analyst Track (80% Done)'
    },
    {
      name: 'Marcus Chen',
      email: 'marcus.chen@student.edu',
      role: 'Product & QA Specialist Track'
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    loginOrSwitch(name, email);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-md p-6 sm:p-7 rounded-3xl border border-slate-700/80 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={() => setIsProfileModalOpen(false)}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-heading font-extrabold text-white">Student Profile</h3>
            <p className="text-xs text-slate-400">Switch account or login with student email</p>
          </div>
        </div>

        {/* Quick Demo Switcher */}
        <div className="mb-6">
          <span className="text-xs uppercase font-bold text-slate-400 block mb-2">
            Instant Demo Profiles
          </span>
          <div className="space-y-2">
            {demoAccounts.map((demo) => {
              const isCurrent = user.email.toLowerCase() === demo.email.toLowerCase();
              return (
                <button
                  key={demo.email}
                  onClick={() => loginOrSwitch(demo.name, demo.email)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between ${
                    isCurrent
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-white'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <span>{demo.name}</span>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </p>
                    <p className="text-[11px] text-slate-400">{demo.email}</p>
                    <p className="text-[10px] text-indigo-300 mt-0.5">{demo.role}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-xl">
                    {isCurrent ? 'Active' : 'Switch'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t border-slate-800">
          <span className="text-xs uppercase font-bold text-slate-400 block mb-1">
            Or Register / Login Custom Student
          </span>
          <div>
            <input
              type="text"
              placeholder="Your Full Name (e.g. Maya Patel)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 text-white text-xs rounded-xl p-3 border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <input
              type="email"
              required
              placeholder="College Email (e.g. maya@university.edu)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 text-white text-xs rounded-xl p-3 border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all"
          >
            Enter Campus Portal
          </button>
        </form>
      </div>
    </div>
  );
}
