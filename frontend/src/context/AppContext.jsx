import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import api from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  // 1. Authentication State: Persisted in localStorage
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('pathfinder_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [dashboard, setDashboard] = useState({
    readinessScore: 0,
    completedMilestonesCount: 0,
    totalMilestonesCount: 5,
    targetRole: null,
    latestPracticeScore: null,
    streak: { current_streak: 1, last_active_date: null, canCheckInToday: true }
  });

  const [careers, setCareers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeRole, setActiveRole] = useState(null);
  const [roadmapData, setRoadmapData] = useState(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [activeTab, setActiveTab] = useState('roadmap'); // 'roadmap' | 'practice' | 'discovery' | 'vault'
  const [learningModalMilestone, setLearningModalMilestone] = useState(null); // Milestone open in Learn Concept modal
  const [isCelebrationModalOpen, setIsCelebrationModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EC4899']
      });
    } catch (e) {
      // safe fallback
    }
  }, []);

  // Fetch student dashboard metrics
  const refreshDashboard = useCallback(async (userId = user?.id) => {
    if (!userId) return;
    try {
      const data = await api.getUserDashboard(userId);
      if (data.success) {
        setDashboard({
          readinessScore: data.readinessScore,
          completedMilestonesCount: data.completedMilestonesCount,
          totalMilestonesCount: data.totalMilestonesCount,
          targetRole: data.targetRole,
          latestPracticeScore: data.latestPracticeScore,
          streak: data.streak
        });
        if (!activeRole && data.targetRole) {
          setActiveRole(data.targetRole);
        }
      }
    } catch (err) {
      console.warn('Dashboard fetch fallback:', err.message);
    }
  }, [user?.id, activeRole]);

  // Fetch career tracks catalog
  const refreshCareers = useCallback(async (category = selectedCategory) => {
    try {
      const data = await api.getCareers(category);
      if (data.success) {
        setCareers(data.careers);
      }
    } catch (err) {
      console.warn('Careers fetch fallback:', err.message);
    }
  }, [selectedCategory]);

  // Fetch roadmap for active role
  const refreshRoadmap = useCallback(async (roleId, userId = user?.id) => {
    if (!roleId) return;
    setLoadingRoadmap(true);
    try {
      const data = await api.getCareerRoadmap(roleId, userId);
      if (data.success) {
        setRoadmapData(data);
      }
    } catch (err) {
      console.warn('Roadmap fetch fallback:', err.message);
    } finally {
      setLoadingRoadmap(false);
    }
  }, [user?.id]);

  // Initial load when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('pathfinder_user', JSON.stringify(user));
      refreshDashboard(user.id);
      refreshCareers(selectedCategory);
    } else {
      localStorage.removeItem('pathfinder_user');
      refreshCareers('all');
    }
  }, [user, refreshDashboard, refreshCareers, selectedCategory]);

  // When activeRole changes, reload roadmap
  useEffect(() => {
    if (user) {
      const roleId = activeRole?.id || user.target_role_id || 1;
      refreshRoadmap(roleId, user.id);
    }
  }, [activeRole, user?.target_role_id, user?.id, refreshRoadmap]);

  // 1. Dedicated Login / Register Action
  const login = async (name, email, targetRoleId) => {
    try {
      const res = await api.loginOrRegister(name, email, targetRoleId);
      if (res.success) {
        setUser(res.user);
        localStorage.setItem('pathfinder_user', JSON.stringify(res.user));
        if (res.targetRole) {
          setActiveRole(res.targetRole);
        }
        showToast(res.message, 'success');
        refreshDashboard(res.user.id);
        refreshRoadmap(res.user.target_role_id || 1, res.user.id);
        setActiveTab('roadmap');
      }
      return res;
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
      throw err;
    }
  };

  // 2. Dedicated Logout Action
  const logout = () => {
    setUser(null);
    localStorage.removeItem('pathfinder_user');
    setActiveRole(null);
    setRoadmapData(null);
    showToast('Signed out of campus session.', 'info');
  };

  // 3. Set user's target career role
  const selectTargetRole = async (role) => {
    if (!user) return;
    try {
      const res = await api.setTargetRole(user.id, role.id);
      if (res.success) {
        setUser(prev => ({ ...prev, target_role_id: role.id }));
        setActiveRole(role);
        showToast(`🎯 Target career set to "${role.title}"!`, 'success');
        refreshDashboard(user.id);
        refreshRoadmap(role.id, user.id);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update target role', 'error');
    }
  };

  // 4. Toggle milestone completion
  const toggleMilestone = async (milestoneId, currentCompleted) => {
    if (!user) return;
    try {
      // Optimistic update in roadmapData
      setRoadmapData(prev => {
        if (!prev) return prev;
        const nextCompleted = !currentCompleted;
        const updatedList = prev.milestones.map(m =>
          m.id === milestoneId ? { ...m, is_completed: nextCompleted } : m
        );
        const compCount = updatedList.filter(m => m.is_completed).length;
        const total = updatedList.length;
        const score = total > 0 ? Math.round((compCount / total) * 100) : 0;
        return {
          ...prev,
          completedCount: compCount,
          readinessScore: score,
          milestones: updatedList
        };
      });

      // Update in opened modal if currently open
      if (learningModalMilestone && learningModalMilestone.id === milestoneId) {
        setLearningModalMilestone(prev => ({ ...prev, is_completed: !currentCompleted }));
      }

      const res = await api.toggleMilestone(user.id, milestoneId, !currentCompleted);
      if (res.success) {
        if (res.is_completed) {
          triggerConfetti();
        }
        showToast(res.message, 'success');
        refreshDashboard(user.id);
      }
    } catch (err) {
      showToast(err.message || 'Failed to toggle milestone', 'error');
      if (activeRole) refreshRoadmap(activeRole.id, user.id);
    }
  };

  // 5. Check in daily streak
  const handleCheckInStreak = async () => {
    if (!user) return;
    try {
      const res = await api.checkInStreak(user.id);
      if (res.success) {
        setDashboard(prev => ({
          ...prev,
          streak: {
            current_streak: res.current_streak,
            last_active_date: res.last_active_date,
            canCheckInToday: false
          }
        }));
        triggerConfetti();
        setIsCelebrationModalOpen(true);
        showToast(res.message, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to check in', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        dashboard,
        careers,
        selectedCategory,
        setSelectedCategory,
        activeRole,
        setActiveRole,
        roadmapData,
        loadingRoadmap,
        activeTab,
        setActiveTab,
        learningModalMilestone,
        setLearningModalMilestone,
        isCelebrationModalOpen,
        setIsCelebrationModalOpen,
        toast,
        showToast,
        triggerConfetti,
        login,
        logout,
        selectTargetRole,
        toggleMilestone,
        handleCheckInStreak,
        refreshDashboard,
        refreshRoadmap,
        refreshCareers
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
