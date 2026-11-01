import React, { useState, useEffect } from 'react';

// ====================================================================
// PathFinder: Gen-Z Career Navigator & Skill Gap Analyzer
// B.Tech Final Project Frontend (Pure React JS, Plain CSS, Hooks only)
// Strict Stack: React 18 (Vite) + Express REST API + MySQL Only
// ====================================================================

export default function App() {
  // 1. Theme State (Dark / Light)
  const [theme, setTheme] = useState(() => localStorage.getItem('pathfinder_theme') || 'dark');

  // 2. Auth State (JWT & User)
  const [token, setToken] = useState(() => localStorage.getItem('pathfinder_jwt') || '');
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('pathfinder_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  // 3. Navigation View: 'dashboard' | 'careers' | 'roadmap' | 'skillgap' | 'quiz' | 'admin' | 'auth'
  const [currentView, setCurrentView] = useState(() => (localStorage.getItem('pathfinder_jwt') ? 'dashboard' : 'auth'));

  // 4. Notification Toast
  const [toast, setToast] = useState(null);

  // 5. Data States
  const [dashboardData, setDashboardData] = useState(null);
  const [careersList, setCareersList] = useState([]);
  const [codingFilter, setCodingFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Active career being viewed in Roadmap & Skill Gap (default 1)
  const [activeCareerId, setActiveCareerId] = useState(1);
  const [roadmapData, setRoadmapData] = useState(null);
  const [skillGapData, setSkillGapData] = useState(null);

  // Quiz States
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);

  // Auth Form States
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authRole, setAuthRole] = useState('student');
  const [authTargetCareer, setAuthTargetCareer] = useState('1');
  const [authLoading, setAuthLoading] = useState(false);

  // 6. Milestone Verification Quiz & Reflection Modal States (Task 4)
  const [quizModalMilestone, setQuizModalMilestone] = useState(null);
  const [milestoneQuestions, setMilestoneQuestions] = useState([]);
  const [milestoneAnswers, setMilestoneAnswers] = useState({});
  const [proofNote, setProofNote] = useState('');
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState(null);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // 7. Streak & Score Transparency Modal (Task 5)
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);

  // 8. Admin CRUD States (Careers, Milestones, Questions)
  const [adminTab, setAdminTab] = useState('careers'); // 'careers' | 'milestones' | 'questions'
  const [careerForm, setCareerForm] = useState({
    id: null,
    title: '',
    category: 'tech',
    coding_level: 'some',
    min_salary: 6,
    max_salary: 16,
    demand_tag: 'High Demand',
    description: '',
    daily_work: '',
    source_note: '',
    salary_source: 'AmbitionBox / Industry Fresher Range',
    last_verified: new Date().toISOString().split('T')[0]
  });
  const [milestoneForm, setMilestoneForm] = useState({ id: null, career_id: 1, phase_number: 1, title: '', resource_url: '' });
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);

  // Admin Question Management States
  const [adminSelectedMilestoneId, setAdminSelectedMilestoneId] = useState(1);
  const [adminQuestionsList, setAdminQuestionsList] = useState([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    id: null,
    milestone_id: 1,
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'a'
  });

  // Common loading / error helper
  const [loading, setLoading] = useState(false);

  // Sync theme attribute on document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pathfinder_theme', theme);
  }, [theme]);

  // Toast Helper
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  // Authenticated API Fetch Helper
  const apiCall = async (endpoint, method = 'GET', body = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const res = await fetch(`/api${endpoint}`, config);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Error ${res.status}`);
    }
    return data;
  };

  // ------------------------------------------------------------------
  // DATA LOADERS
  // ------------------------------------------------------------------

  // Load Dashboard Data
  const loadDashboard = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await apiCall('/user/dashboard');
      if (res.success) {
        setDashboardData(res);
        if (res.target_career) {
          setActiveCareerId(res.target_career.id);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load Careers List
  const loadCareers = async () => {
    try {
      let query = '';
      const params = [];
      if (codingFilter !== 'all') params.push(`coding=${codingFilter}`);
      if (categoryFilter !== 'all') params.push(`category=${categoryFilter}`);
      if (params.length > 0) query = '?' + params.join('&');

      const res = await apiCall(`/careers${query}`);
      if (res.success) {
        setCareersList(res.careers);
      }
    } catch (err) {
      console.error('Failed to load careers:', err.message);
    }
  };

  // Load Roadmap for Active Career
  const loadRoadmap = async (careerId = activeCareerId) => {
    try {
      setLoading(true);
      const res = await apiCall(`/roadmaps/${careerId}`);
      if (res.success) {
        setRoadmapData(res);
      }
    } catch (err) {
      console.error('Failed to load roadmap:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load Skill Gap for Active Career
  const loadSkillGap = async (careerId = activeCareerId) => {
    try {
      setLoading(true);
      const res = await apiCall(`/skill-gap/${careerId}`);
      if (res.success) {
        setSkillGapData(res);
      }
    } catch (err) {
      console.error('Failed to load skill gap:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load Career Quiz Questions
  const loadQuiz = async () => {
    try {
      setQuizLoading(true);
      const res = await apiCall('/quiz');
      if (res.success) {
        setQuizQuestions(res.questions);
      }
    } catch (err) {
      console.error('Failed to load quiz:', err.message);
    } finally {
      setQuizLoading(false);
    }
  };

  // Load Admin Questions for selected milestone
  const loadAdminQuestions = async (milestoneId = adminSelectedMilestoneId) => {
    if (!token || user?.role !== 'admin') return;
    try {
      const res = await apiCall(`/admin/milestones/${milestoneId}/questions`);
      if (res.success) {
        setAdminQuestionsList(res.questions);
      }
    } catch (err) {
      showToast('Failed to load milestone questions: ' + err.message, 'error');
    }
  };

  // Trigger initial loads
  useEffect(() => {
    loadCareers();
    if (token) {
      loadDashboard();
    }
  }, [token]);

  useEffect(() => {
    loadCareers();
  }, [codingFilter, categoryFilter]);

  useEffect(() => {
    if (currentView === 'roadmap') {
      loadRoadmap(activeCareerId);
    } else if (currentView === 'skillgap') {
      loadSkillGap(activeCareerId);
    } else if (currentView === 'quiz') {
      loadQuiz();
    } else if (currentView === 'dashboard') {
      loadDashboard();
    } else if (currentView === 'admin' && adminTab === 'questions') {
      loadAdminQuestions(adminSelectedMilestoneId);
    }
  }, [currentView, activeCareerId, adminTab, adminSelectedMilestoneId]);

  // ------------------------------------------------------------------
  // AUTH ACTIONS
  // ------------------------------------------------------------------

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    try {
      setAuthLoading(true);
      const res = await apiCall('/auth/login', 'POST', {
        email: authEmail,
        password: authPassword
      });
      if (res.success) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('pathfinder_jwt', res.token);
        localStorage.setItem('pathfinder_user', JSON.stringify(res.user));
        showToast(res.message, 'success');
        setCurrentView('dashboard');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    try {
      setAuthLoading(true);
      const res = await apiCall('/auth/register', 'POST', {
        name: authName,
        email: authEmail,
        password: authPassword,
        role: authRole,
        target_career_id: parseInt(authTargetCareer, 10)
      });
      if (res.success) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('pathfinder_jwt', res.token);
        localStorage.setItem('pathfinder_user', JSON.stringify(res.user));
        showToast(res.message, 'success');
        setCurrentView('dashboard');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('pathfinder_jwt');
    localStorage.removeItem('pathfinder_user');
    showToast('Logged out successfully.', 'info');
    setCurrentView('auth');
  };

  // Demo 1-click accounts for Viva examiner testing
  const loginDemoAccount = async (email, password) => {
    setAuthEmail(email);
    setAuthPassword(password);
    try {
      setAuthLoading(true);
      const res = await apiCall('/auth/login', 'POST', { email, password });
      if (res.success) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('pathfinder_jwt', res.token);
        localStorage.setItem('pathfinder_user', JSON.stringify(res.user));
        showToast(res.message, 'success');
        setCurrentView('dashboard');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // INTERACTIVE USER ACTIONS (STREAK, PROGRESS, SKILLS)
  // ------------------------------------------------------------------

  // Check-in ("I practised today" button)
  const handleCheckInToday = async () => {
    if (!token) {
      showToast('Please login to track your daily streak!', 'warning');
      return;
    }
    try {
      const res = await apiCall('/user/checkin', 'POST');
      if (res.success) {
        showToast(res.message, 'success');
        loadDashboard();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Open Verification Quiz & Reflection Modal (Task 4 & Part 1)
  const openVerifyModal = async (milestone) => {
    if (!token) {
      showToast('Please sign in to verify milestone completion!', 'warning');
      setCurrentView('auth');
      return;
    }
    setQuizModalMilestone(milestone);
    setMilestoneAnswers({});
    setProofNote('');
    setQuizFeedback(null);
    setQuestionsLoading(true);
    try {
      const res = await apiCall(`/milestones/${milestone.id}/questions`);
      if (res.success) {
        setMilestoneQuestions(res.questions);
      }
    } catch (err) {
      showToast('Failed to load milestone verification questions', 'error');
    } finally {
      setQuestionsLoading(false);
    }
  };

  // Submit Milestone Quiz & Reflection Proof Note
  const handleSubmitMilestoneVerification = async () => {
    if (!quizModalMilestone) return;

    // Check all questions answered
    const answeredCount = Object.keys(milestoneAnswers).length;
    if (answeredCount < milestoneQuestions.length) {
      showToast(`Please answer all ${milestoneQuestions.length} verification questions!`, 'warning');
      return;
    }

    // Check reflection note length (min 20 characters)
    if (!proofNote || proofNote.trim().length < 20) {
      showToast('Please enter at least 20 characters in "What did you learn from this step?"', 'warning');
      return;
    }

    try {
      setQuizSubmitting(true);
      // Step 1: Submit answers to /api/milestones/:id/quiz
      const quizRes = await apiCall(`/milestones/${quizModalMilestone.id}/quiz`, 'POST', {
        answers: milestoneAnswers
      });

      if (!quizRes.passed) {
        // Failed attempt: show score, ask to review resource, do NOT reveal correct answers
        setQuizFeedback({
          score: quizRes.score,
          total: quizRes.total,
          passed: false,
          message: quizRes.message
        });
        showToast(`Score: ${quizRes.score}/${quizRes.total}. Please review the resource and try again!`, 'error');
        return;
      }

      // Step 2: Passed! Mark milestone completed with proof_note
      const progressRes = await apiCall('/user/progress', 'POST', {
        milestoneId: quizModalMilestone.id,
        status: 'completed',
        proof_note: proofNote.trim()
      });

      if (progressRes.success) {
        showToast(`🎉 Passed ${quizRes.score}/${quizRes.total}! Step marked completed.`, 'success');
        setQuizModalMilestone(null);
        loadRoadmap(activeCareerId);
        loadDashboard();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setQuizSubmitting(false);
    }
  };

  // Untick milestone to undo (Always permitted without quiz)
  const handleUntickMilestone = async (milestoneId) => {
    if (!token) return;
    try {
      const res = await apiCall('/user/progress', 'POST', {
        milestoneId,
        status: 'pending'
      });
      if (res.success) {
        showToast('Step marked as pending. Readiness score updated.', 'info');
        loadRoadmap(activeCareerId);
        loadDashboard();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Rate Skill (1-5)
  const handleRateSkill = async (careerSkillId, rating) => {
    if (!token) {
      showToast('Please login to save your skill gap ratings!', 'warning');
      return;
    }
    try {
      const res = await apiCall('/user/skills', 'POST', {
        career_skill_id: careerSkillId,
        rating
      });
      if (res.success) {
        showToast(res.message, 'success');
        loadSkillGap(activeCareerId);
        loadDashboard();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Set Target Career
  const handleSetTargetCareer = async (careerId) => {
    if (!token) {
      showToast('Please login to set your target career!', 'warning');
      return;
    }
    try {
      const res = await apiCall('/user/target', 'PUT', { careerId });
      if (res.success) {
        showToast(res.message, 'success');
        setUser(prev => ({ ...prev, target_career_id: careerId }));
        setActiveCareerId(careerId);
        loadDashboard();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Submit Career Preference Quiz
  const handleSubmitQuiz = async () => {
    const answeredCount = Object.keys(quizAnswers).length;
    if (answeredCount < quizQuestions.length) {
      showToast(`Please answer all ${quizQuestions.length} questions to calculate recommendations!`, 'warning');
      return;
    }

    try {
      setQuizLoading(true);
      const res = await apiCall('/quiz/submit', 'POST', { answers: quizAnswers });
      if (res.success) {
        setQuizResults(res);
        showToast(`Quiz analyzed! Your top match is ${res.top_match.title}`, 'success');
        if (token) loadDashboard();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setQuizLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // ADMIN PANEL ACTIONS
  // ------------------------------------------------------------------

  const handleSaveCareer = async (e) => {
    e.preventDefault();
    try {
      if (careerForm.id) {
        await apiCall(`/admin/careers/${careerForm.id}`, 'PUT', careerForm);
        showToast('Career updated successfully!', 'success');
      } else {
        await apiCall('/admin/careers', 'POST', careerForm);
        showToast('Career created successfully!', 'success');
      }
      setShowCareerModal(false);
      loadCareers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteCareer = async (id) => {
    if (!window.confirm('Delete this career path and all its roadmap milestones?')) return;
    try {
      await apiCall(`/admin/careers/${id}`, 'DELETE');
      showToast('Career deleted successfully.', 'info');
      loadCareers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveMilestone = async (e) => {
    e.preventDefault();
    try {
      if (milestoneForm.id) {
        await apiCall(`/admin/milestones/${milestoneForm.id}`, 'PUT', milestoneForm);
        showToast('Milestone updated successfully!', 'success');
      } else {
        await apiCall('/admin/milestones', 'POST', milestoneForm);
        showToast('Milestone created successfully!', 'success');
      }
      setShowMilestoneModal(false);
      loadRoadmap(milestoneForm.career_id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteMilestone = async (id) => {
    if (!window.confirm('Delete this roadmap step?')) return;
    try {
      await apiCall(`/admin/milestones/${id}`, 'DELETE');
      showToast('Milestone deleted.', 'info');
      loadRoadmap(activeCareerId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    try {
      if (questionForm.id) {
        await apiCall(`/admin/questions/${questionForm.id}`, 'PUT', questionForm);
        showToast('Question updated successfully!', 'success');
      } else {
        await apiCall(`/admin/milestones/${adminSelectedMilestoneId}/questions`, 'POST', questionForm);
        showToast('Question added successfully!', 'success');
      }
      setShowQuestionModal(false);
      loadAdminQuestions(adminSelectedMilestoneId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Delete this verification question?')) return;
    try {
      await apiCall(`/admin/questions/${questionId}`, 'DELETE');
      showToast('Question deleted.', 'info');
      loadAdminQuestions(adminSelectedMilestoneId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ==================================================================
  // RENDER SECTIONS
  // ==================================================================

  return (
    <div className="app-container">
      {/* Toast Notification Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: toast.type === 'error' ? 'var(--danger-color)' : toast.type === 'success' ? 'var(--success-color)' : 'var(--accent-primary)',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
          fontWeight: 600,
          fontSize: '0.875rem'
        }}>
          {toast.message}
        </div>
      )}

      {/* Top Navbar */}
      <header className="navbar">
        <div className="navbar-inner">
          {/* Brand */}
          <div className="brand" onClick={() => setCurrentView(token ? 'dashboard' : 'careers')}>
            <span className="brand-icon">🧭</span>
            <div>
              PathFinder
              <span className="brand-subtitle">B.Tech Gen-Z Career Navigator</span>
            </div>
          </div>

          {/* Navigation Links (State-based Views) */}
          <nav className="nav-links">
            {token && (
              <button
                className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentView('dashboard')}
              >
                📊 Dashboard
              </button>
            )}

            <button
              className={`nav-btn ${currentView === 'careers' ? 'active' : ''}`}
              onClick={() => setCurrentView('careers')}
            >
              💼 Careers ({careersList.length})
            </button>

            <button
              className={`nav-btn ${currentView === 'roadmap' ? 'active' : ''}`}
              onClick={() => setCurrentView('roadmap')}
            >
              🗺️ Roadmap
            </button>

            <button
              className={`nav-btn ${currentView === 'skillgap' ? 'active' : ''}`}
              onClick={() => setCurrentView('skillgap')}
            >
              🎯 Skill Gap
            </button>

            <button
              className={`nav-btn ${currentView === 'quiz' ? 'active' : ''}`}
              onClick={() => setCurrentView('quiz')}
            >
              💡 Career Quiz
            </button>

            {user?.role === 'admin' && (
              <button
                className={`nav-btn ${currentView === 'admin' ? 'active' : ''}`}
                onClick={() => setCurrentView('admin')}
              >
                🛡️ Admin Panel
              </button>
            )}

            <button
              className="nav-btn"
              onClick={() => setShowHowItWorksModal(true)}
              title="Readiness Formula & Streak habit rules"
            >
              ℹ️ How It Works
            </button>
          </nav>

          {/* Right Actions: Streak Flame, Theme Toggle, Profile / Logout */}
          <div className="nav-actions">
            {/* Duolingo style streak counter */}
            {token && (
              <div
                className="streak-pill"
                onClick={handleCheckInToday}
                title="Click to check in: 'I practised today!'"
              >
                <span className="streak-flame">🔥</span>
                <span>{dashboardData?.streak?.streak_count || 1} Days</span>
              </div>
            )}

            {/* Dark / Light Mode Toggle */}
            <button
              className="theme-toggle-btn"
              onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
              title="Toggle Dark/Light Mode"
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>

            {/* User Profile or Auth */}
            {token && user ? (
              <div className="user-badge">
                <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                <span>{user.name.split(' ')[0]}</span>
                <button className="btn-logout" onClick={handleLogout} title="Log Out">
                  🚪 Logout
                </button>
              </div>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setCurrentView('auth')}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {/* ========================================================== */}
        {/* VIEW 1: DASHBOARD                                         */}
        {/* ========================================================== */}
        {currentView === 'dashboard' && (
          <div className="dashboard-view">
            <div className="hero-header">
              <h1 className="hero-title">Welcome back, {user?.name || 'Student'}! 👋</h1>
              <p className="hero-subtitle">
                Track your milestone roadmap, skill readiness, and build consistent daily practice habits.
              </p>
            </div>

            {/* Top Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              {/* Target Career Card */}
              <div className="card">
                <div className="flex-between mb-4">
                  <span className="filter-label">YOUR TARGET CAREER</span>
                  <button className="btn btn-secondary btn-sm" onClick={() => setCurrentView('careers')}>
                    Change Track
                  </button>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>
                  {dashboardData?.target_career?.title || 'Data Analyst'}
                </h2>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <span className={`tag tag-${dashboardData?.target_career?.category || 'tech'}`}>
                    {dashboardData?.target_career?.category || 'tech'}
                  </span>
                  <span className="tag tag-demand">
                    {dashboardData?.target_career?.demand_tag || 'High Demand'}
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Entry Package: <strong>₹{dashboardData?.target_career?.min_salary} - ₹{dashboardData?.target_career?.max_salary} LPA</strong>
                </p>
                {/* Data Credibility Cite */}
                <div className="source-note mt-2">
                  ℹ️ Approximate, source: {dashboardData?.target_career?.salary_source || 'AmbitionBox / Industry Benchmark'}, checked {dashboardData?.target_career?.last_verified || '2026-11-01'}
                </div>
              </div>

              {/* Live Readiness Score Card */}
              <div className="card">
                <div className="flex-between mb-4">
                  <span className="filter-label">CAMPUS HIRING READINESS</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                    {dashboardData?.readiness_score || 0}%
                  </span>
                </div>
                <div className="progress-container">
                  <div
                    className="progress-bar progress-bar-success"
                    style={{ width: `${Math.max(6, dashboardData?.readiness_score || 0)}%` }}
                  ></div>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  {dashboardData?.completed_count || 0} of {dashboardData?.total_milestones || 6} verified steps completed.
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setActiveCareerId(dashboardData?.target_career?.id || 1);
                      setCurrentView('roadmap');
                    }}
                  >
                    Continue Roadmap ➔
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowHowItWorksModal(true)}
                  >
                    Formula Info ℹ️
                  </button>
                </div>
              </div>

              {/* Duolingo-style Streak Card */}
              <div className="card">
                <div className="flex-between mb-4">
                  <span className="filter-label">DAILY PRACTICE STREAK</span>
                  <span style={{ fontSize: '1.5rem' }}>🔥</span>
                </div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--flame-color)', marginBottom: '4px' }}>
                  {dashboardData?.streak?.streak_count || 1} Days Active
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Rule: Same day = unchanged, yesterday = +1, older = reset to 1.
                </p>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleCheckInToday}
                  disabled={!dashboardData?.streak?.can_check_in_today}
                >
                  {dashboardData?.streak?.can_check_in_today ? '🔥 I Practised Today!' : '✓ Today\'s Streak Secured'}
                </button>
              </div>
            </div>

            {/* Next Pending Step Alert */}
            {dashboardData?.next_pending_step ? (
              <div className="card" style={{ borderLeft: '4px solid var(--accent-primary)', marginBottom: '24px' }}>
                <span className="filter-label" style={{ color: 'var(--accent-primary)', display: 'block', marginBottom: '4px' }}>
                  RECOMMENDED NEXT ACTION STEP
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
                  {dashboardData.next_pending_step.title}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  Phase {dashboardData.next_pending_step.phase_number} milestone. Pass the 3-question mini quiz to complete this step!
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <a
                    href={dashboardData.next_pending_step.resource_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                  >
                    Open Free Learning Resource ↗
                  </a>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => openVerifyModal(dashboardData.next_pending_step)}
                  >
                    Verify & Complete Step ✓
                  </button>
                </div>
              </div>
            ) : (
              <div className="card text-center" style={{ marginBottom: '24px' }}>
                <h3>🎉 Incredible! All roadmap milestones for this target career are completed!</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Check your Skill Gap Analyzer or explore other career tracks to keep growing.
                </p>
              </div>
            )}

            {/* Quick Actions Footer */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="card" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('quiz')}>
                <h4 style={{ fontWeight: 700, marginBottom: '4px' }}>💡 Not sure about your career choice?</h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Take our 5-question logic & personality quiz to find your ranked percentage match.
                </p>
              </div>
              <div className="card" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('skillgap')}>
                <h4 style={{ fontWeight: 700, marginBottom: '4px' }}>🎯 Analyze Skill Gap (1-5 Rating)</h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Self-rate your skills against industry standards to identify what to prepare next.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 2: CAREER CARDS WITH FILTERS                         */}
        {/* ========================================================== */}
        {currentView === 'careers' && (
          <div>
            <div className="hero-header">
              <h1 className="hero-title">Explore Tech & Non-Tech Career Tracks</h1>
              <p className="hero-subtitle">
                Compare coding expectations, approximate fresher entry packages (LPA), daily responsibilities, and industry demand.
              </p>
            </div>

            {/* Filter Bar */}
            <div className="filters-row">
              <div className="filter-group">
                <span className="filter-label">Filter by Coding:</span>
                <select
                  className="select-input"
                  value={codingFilter}
                  onChange={(e) => setCodingFilter(e.target.value)}
                >
                  <option value="all">All Coding Levels</option>
                  <option value="none">Zero Coding (none)</option>
                  <option value="some">Moderate Scripts / SQL (some)</option>
                  <option value="heavy">Heavy Programming (heavy)</option>
                </select>
              </div>

              <div className="filter-group">
                <span className="filter-label">Filter by Category:</span>
                <select
                  className="select-input"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="tech">Tech Engineering</option>
                  <option value="non-tech">Non-Tech / Design / Product</option>
                  <option value="govt">Government & Public Sector</option>
                </select>
              </div>
            </div>

            {/* Career Cards Grid */}
            <div className="career-grid">
              {careersList.map(career => {
                const isTarget = user?.target_career_id === career.id;

                return (
                  <div key={career.id} className="card career-card">
                    <div>
                      {/* Category & Demand Tags */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span className={`tag tag-${career.category}`}>{career.category}</span>
                        <span className="tag" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', border: '1px solid var(--border-color)' }}>
                          Coding: {career.coding_level}
                        </span>
                        <span className="tag tag-demand">{career.demand_tag}</span>
                      </div>

                      <h3 className="career-title">{career.title}</h3>

                      <div className="career-salary">
                        ₹{career.min_salary} - ₹{career.max_salary} LPA (Entry Level Range)
                      </div>

                      <p className="career-desc">{career.description}</p>

                      <div className="career-meta">
                        <strong>Daily Work:</strong> {career.daily_work}
                      </div>

                      {/* Data Credibility Requirement (Task 3) */}
                      <div className="source-note">
                        ℹ️ Approximate, source: {career.salary_source || 'AmbitionBox / Industry Benchmark'}, checked {career.last_verified || '2026-11-01'}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="career-actions">
                      <button
                        className={`btn ${isTarget ? 'btn-success' : 'btn-secondary'} btn-sm`}
                        onClick={() => handleSetTargetCareer(career.id)}
                        disabled={isTarget}
                      >
                        {isTarget ? '✓ Active Target' : '🎯 Set as Target'}
                      </button>

                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setActiveCareerId(career.id);
                          setCurrentView('roadmap');
                        }}
                      >
                        🗺️ Roadmap
                      </button>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setActiveCareerId(career.id);
                          setCurrentView('skillgap');
                        }}
                      >
                        📊 Skill Gap
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 3: ROADMAP (VERTICAL TRAIL LAYOUT)                   */}
        {/* ========================================================== */}
        {currentView === 'roadmap' && (
          <div>
            {/* Header with Career Switcher & Live Readiness Score */}
            <div className="card mb-4">
              <div className="flex-between flex-wrap gap-2 mb-4">
                <div>
                  <span className="filter-label">ROADMAP TRAIL FOR:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                    <select
                      className="select-input"
                      style={{ fontSize: '1.1rem', fontWeight: 700 }}
                      value={activeCareerId}
                      onChange={(e) => setActiveCareerId(parseInt(e.target.value, 10))}
                    >
                      {careersList.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({c.category})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Live Readiness Score Meter */}
                <div style={{ minWidth: '220px' }}>
                  <div className="flex-between">
                    <span className="filter-label">LIVE READINESS SCORE</span>
                    <strong style={{ color: 'var(--success-color)' }}>
                      {roadmapData?.readiness_score || 0}%
                    </strong>
                  </div>
                  <div className="progress-container">
                    <div
                      className="progress-bar progress-bar-success"
                      style={{ width: `${Math.max(4, roadmapData?.readiness_score || 0)}%` }}
                    ></div>
                  </div>
                  <div className="flex-between" style={{ marginTop: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {roadmapData?.completed_count || 0} of {roadmapData?.total_milestones || 6} milestones completed
                    </span>
                    <button
                      style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => setShowHowItWorksModal(true)}
                    >
                      How it works
                    </button>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {roadmapData?.career?.description}
              </p>

              {/* Data Credibility Requirement (Task 3) */}
              <div className="source-note mt-2">
                ℹ️ Approximate, source: {roadmapData?.career?.salary_source || 'Industry Fresher Benchmark'}, checked {roadmapData?.career?.last_verified || '2026-11-01'}
              </div>
            </div>

            {/* Vertical Trail Container */}
            <div className="roadmap-trail-container">
              {[1, 2, 3].map(phaseNum => {
                const phaseMilestones = (roadmapData?.milestones || []).filter(m => m.phase_number === phaseNum);
                const phaseTitle = phaseNum === 1 ? 'Phase 1: Foundations' : phaseNum === 2 ? 'Phase 2: Core Tools' : 'Phase 3: Practice & Projects';

                return (
                  <div key={phaseNum}>
                    {/* Phase Header */}
                    <div className="roadmap-phase-header">
                      <span className="roadmap-phase-badge">{phaseTitle}</span>
                    </div>

                    {/* Step Cards along the trail */}
                    {phaseMilestones.map((milestone, idx) => {
                      const isCompleted = Boolean(milestone.is_completed);

                      return (
                        <div key={milestone.id} className={`roadmap-step ${isCompleted ? 'completed' : ''}`}>
                          {/* Trail Node Circle */}
                          <div className="step-node">
                            {isCompleted ? '✓' : `${idx + 1}`}
                          </div>

                          {/* Step Content Card */}
                          <div className="step-card">
                            <div className="step-content">
                              {/* Checkbox: If completed, click to untick; if not completed, click to open Quiz Verification */}
                              <input
                                type="checkbox"
                                className="step-checkbox"
                                checked={isCompleted}
                                onChange={() => {
                                  if (isCompleted) {
                                    handleUntickMilestone(milestone.id);
                                  } else {
                                    openVerifyModal(milestone);
                                  }
                                }}
                                title={isCompleted ? 'Click to untick (mark pending)' : 'Click to verify & complete via quiz'}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span className={`step-title ${isCompleted ? 'completed' : ''}`}>
                                    {milestone.title}
                                  </span>
                                  {isCompleted && (
                                    <span className="badge-quiz-passed">
                                      ✓ Quiz Passed
                                    </span>
                                  )}
                                </div>

                                {/* Saved Reflection / Proof Note Display */}
                                {isCompleted && milestone.proof_note && (
                                  <div className="proof-note-callout">
                                    📝 <strong>What I Learned:</strong> &ldquo;{milestone.proof_note}&rdquo;
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Free Resource External Link & Action Button */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <a
                                href={milestone.resource_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="step-link"
                                title="Opens verified free tutorial/documentation in a new tab"
                              >
                                Free Resource ↗
                              </a>

                              {!isCompleted ? (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => openVerifyModal(milestone)}
                                >
                                  Take Mini Quiz ✍️
                                </button>
                              ) : (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleUntickMilestone(milestone.id)}
                                  title="Untick step to mark pending"
                                >
                                  Undo ↺
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 4: SKILL GAP ANALYZER (1-5 SELF RATING)              */}
        {/* ========================================================== */}
        {currentView === 'skillgap' && (
          <div>
            <div className="hero-header">
              <h1 className="hero-title">Skill Gap Analyzer</h1>
              <p className="hero-subtitle">
                Self-evaluate your skills against industry requirements (1 to 5 stars). Identify your exact gap percentage before campus interviews.
              </p>
            </div>

            {/* Career Selector & Overall Gap Metric */}
            <div className="card mb-4">
              <div className="flex-between flex-wrap gap-2 mb-4">
                <div>
                  <span className="filter-label">ANALYZING ROLE:</span>
                  <div style={{ marginTop: '4px' }}>
                    <select
                      className="select-input"
                      style={{ fontSize: '1.1rem', fontWeight: 700 }}
                      value={activeCareerId}
                      onChange={(e) => setActiveCareerId(parseInt(e.target.value, 10))}
                    >
                      {careersList.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ minWidth: '220px' }}>
                  <div className="flex-between">
                    <span className="filter-label">SKILL READINESS</span>
                    <strong style={{ color: 'var(--accent-primary)', fontSize: '1.1rem' }}>
                      {skillGapData?.overall_readiness || 0}%
                    </strong>
                  </div>
                  <div className="progress-container">
                    <div
                      className="progress-bar progress-bar-primary"
                      style={{ width: `${Math.max(6, skillGapData?.overall_readiness || 0)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Target role: <strong>{skillGapData?.career?.title}</strong> ({skillGapData?.career?.demand_tag}). Rate your current level 1 to 5.
              </p>
            </div>

            {/* Skill Cards Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(skillGapData?.skills || []).map(skill => (
                <div key={skill.id} className="card">
                  <div className="flex-between flex-wrap gap-2 mb-2">
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{skill.skill_name}</h3>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        Industry Benchmark Requirement: Level {skill.required_level} of 5
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className={`tag ${skill.gap_percentage === 0 ? 'tag-tech' : 'tag-demand'}`}>
                        {skill.gap_percentage === 0 ? '✓ Target Met' : `Gap: ${skill.gap_percentage}%`}
                      </span>
                    </div>
                  </div>

                  {/* Visual Comparison Progress */}
                  <div style={{ marginBottom: '12px' }}>
                    <div className="progress-container" style={{ height: '10px' }}>
                      <div
                        className={`progress-bar ${skill.gap_percentage === 0 ? 'progress-bar-success' : 'progress-bar-primary'}`}
                        style={{ width: `${Math.max(4, 100 - skill.gap_percentage)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* 1-5 Star / Level Selector */}
                  <div className="flex-between flex-wrap gap-2">
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      Your Current Self-Rating: <strong>{skill.user_rating ? `Level ${skill.user_rating}` : 'Not Rated Yet'}</strong>
                    </span>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[1, 2, 3, 4, 5].map(lvl => (
                        <button
                          key={lvl}
                          className={`btn ${skill.user_rating === lvl ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                          style={{ minWidth: '36px', padding: '4px 8px' }}
                          onClick={() => handleRateSkill(skill.id, lvl)}
                          title={`Rate yourself ${lvl} out of 5 in ${skill.skill_name}`}
                        >
                          {lvl} ★
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 5: CAREER PREFERENCE RECOMMENDATION QUIZ             */}
        {/* ========================================================== */}
        {currentView === 'quiz' && (
          <div>
            <div className="hero-header">
              <h1 className="hero-title">Intelligent Career Discovery Quiz</h1>
              <p className="hero-subtitle">
                5 targeted psychometric and skill questions weighted across all 7 careers to calculate your best-fit match.
              </p>
            </div>

            {/* Quiz Questions List */}
            {quizLoading ? (
              <div className="card text-center">Loading questions...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
                {quizQuestions.map((q, idx) => (
                  <div key={q.id} className="card">
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px' }}>
                      {idx + 1}. {q.question_text}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {(q.options || []).map(opt => {
                        const isSelected = quizAnswers[q.id] === opt.id;

                        return (
                          <div
                            key={opt.id}
                            className={`quiz-option-choice ${isSelected ? 'selected' : ''}`}
                            onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: opt.id })}
                          >
                            <input
                              type="radio"
                              name={`question_${q.id}`}
                              checked={isSelected}
                              onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: opt.id })}
                            />
                            <span>{opt.option_text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleSubmitQuiz}
                  disabled={quizLoading}
                >
                  {quizLoading ? 'Analyzing...' : 'Calculate My Career Match ➔'}
                </button>
              </div>
            )}

            {/* Quiz Results Section */}
            {quizResults && (
              <div className="card mb-4" style={{ border: '2px solid var(--accent-primary)' }}>
                <span className="filter-label" style={{ color: 'var(--accent-primary)', display: 'block', marginBottom: '4px' }}>
                  AI RECOMMENDATION RESULT
                </span>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '8px' }}>
                  Top Match: {quizResults.top_match?.title} ({quizResults.top_match?.match_percentage}%)
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Based on your affinity for {quizResults.top_match?.category} problem solving and {quizResults.top_match?.coding_level} coding intensity.
                </p>

                <h4 style={{ fontWeight: 700, marginBottom: '12px' }}>All Ranked Career Matches:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(quizResults.rankings || []).map((r, rankIdx) => (
                    <div key={r.career_id} className="flex-between card" style={{ padding: '12px 16px', background: 'var(--bg-input)' }}>
                      <div>
                        <strong>#{rankIdx + 1} {r.title}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                          ({r.category})
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                          {r.match_percentage}% Match
                        </span>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setActiveCareerId(r.career_id);
                            setCurrentView('roadmap');
                          }}
                        >
                          View Roadmap
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 6: ADMIN PANEL (CAREERS, MILESTONES & QUESTIONS)     */}
        {/* ========================================================== */}
        {currentView === 'admin' && user?.role === 'admin' && (
          <div>
            <div className="hero-header">
              <h1 className="hero-title">Admin Management Panel</h1>
              <p className="hero-subtitle">
                Full CRUD control for Career Paths, Roadmap Milestones, and Verification Mini-Quiz Questions.
              </p>
            </div>

            {/* Admin Sub-navigation Tabs */}
            <div className="card mb-4">
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  className={`btn ${adminTab === 'careers' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setAdminTab('careers')}
                >
                  Manage Careers
                </button>
                <button
                  className={`btn ${adminTab === 'milestones' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setAdminTab('milestones')}
                >
                  Manage Milestones
                </button>
                <button
                  className={`btn ${adminTab === 'questions' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => {
                    setAdminTab('questions');
                    loadAdminQuestions(adminSelectedMilestoneId);
                  }}
                >
                  Manage Quiz Questions
                </button>
              </div>
            </div>

            {/* Sub-tab 1: Manage Careers */}
            {adminTab === 'careers' && (
              <div>
                <div className="flex-between mb-4">
                  <span className="filter-label">CAREER PATHS DATABASE ({careersList.length})</span>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setCareerForm({
                        id: null,
                        title: '',
                        category: 'tech',
                        coding_level: 'some',
                        min_salary: 6,
                        max_salary: 16,
                        demand_tag: 'High Demand',
                        description: '',
                        daily_work: '',
                        source_note: '',
                        salary_source: 'AmbitionBox / Industry Fresher Range',
                        last_verified: new Date().toISOString().split('T')[0]
                      });
                      setShowCareerModal(true);
                    }}
                  >
                    + Add New Career
                  </button>
                </div>

                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                      <tr>
                        <th style={{ padding: '12px 16px' }}>ID</th>
                        <th style={{ padding: '12px 16px' }}>Title</th>
                        <th style={{ padding: '12px 16px' }}>Category</th>
                        <th style={{ padding: '12px 16px' }}>Salary Range</th>
                        <th style={{ padding: '12px 16px' }}>Source Cite</th>
                        <th style={{ padding: '12px 16px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {careersList.map(c => (
                        <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 700 }}>#{c.id}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>{c.title}</td>
                          <td style={{ padding: '12px 16px' }}><span className={`tag tag-${c.category}`}>{c.category}</span></td>
                          <td style={{ padding: '12px 16px' }}>₹{c.min_salary} - ₹{c.max_salary} LPA</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {c.salary_source} ({c.last_verified})
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  setCareerForm(c);
                                  setShowCareerModal(true);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteCareer(c.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-tab 2: Manage Milestones */}
            {adminTab === 'milestones' && (
              <div>
                <div className="flex-between mb-4">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="filter-label">SELECT CAREER:</span>
                    <select
                      className="select-input"
                      value={activeCareerId}
                      onChange={(e) => setActiveCareerId(parseInt(e.target.value, 10))}
                    >
                      {careersList.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setMilestoneForm({ id: null, career_id: activeCareerId, phase_number: 1, title: '', resource_url: '' });
                      setShowMilestoneModal(true);
                    }}
                  >
                    + Add Roadmap Milestone
                  </button>
                </div>

                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                      <tr>
                        <th style={{ padding: '12px 16px' }}>ID</th>
                        <th style={{ padding: '12px 16px' }}>Phase</th>
                        <th style={{ padding: '12px 16px' }}>Milestone Title</th>
                        <th style={{ padding: '12px 16px' }}>Resource Link</th>
                        <th style={{ padding: '12px 16px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(roadmapData?.milestones || []).map(m => (
                        <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 700 }}>#{m.id}</td>
                          <td style={{ padding: '12px 16px' }}>Phase {m.phase_number}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>{m.title}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <a href={m.resource_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)' }}>
                              Resource ↗
                            </a>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  setMilestoneForm(m);
                                  setShowMilestoneModal(true);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteMilestone(m.id)}
                              >
                                Delete
                              </button>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                  setAdminSelectedMilestoneId(m.id);
                                  setAdminTab('questions');
                                  loadAdminQuestions(m.id);
                                }}
                              >
                                Questions
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-tab 3: Manage Verification Questions (Task 4) */}
            {adminTab === 'questions' && (
              <div>
                <div className="flex-between mb-4 flex-wrap gap-2">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="filter-label">MILESTONE:</span>
                    <select
                      className="select-input"
                      value={adminSelectedMilestoneId}
                      onChange={(e) => {
                        const mid = parseInt(e.target.value, 10);
                        setAdminSelectedMilestoneId(mid);
                        loadAdminQuestions(mid);
                      }}
                    >
                      {(roadmapData?.milestones || []).map(m => (
                        <option key={m.id} value={m.id}>
                          #{m.id} (P{m.phase_number}): {m.title.slice(0, 50)}...
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setQuestionForm({
                        id: null,
                        milestone_id: adminSelectedMilestoneId,
                        question_text: '',
                        option_a: '',
                        option_b: '',
                        option_c: '',
                        option_d: '',
                        correct_option: 'a'
                      });
                      setShowQuestionModal(true);
                    }}
                  >
                    + Add Verification Question
                  </button>
                </div>

                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                      <tr>
                        <th style={{ padding: '12px 16px' }}>ID</th>
                        <th style={{ padding: '12px 16px' }}>Question</th>
                        <th style={{ padding: '12px 16px' }}>Options (A, B, C, D)</th>
                        <th style={{ padding: '12px 16px' }}>Correct Ans</th>
                        <th style={{ padding: '12px 16px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminQuestionsList.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No verification questions found for this milestone. Click &ldquo;+ Add Verification Question&rdquo; to add one.
                          </td>
                        </tr>
                      ) : (
                        adminQuestionsList.map(q => (
                          <tr key={q.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 700 }}>#{q.id}</td>
                            <td style={{ padding: '12px 16px', fontWeight: 600 }}>{q.question_text}</td>
                            <td style={{ padding: '12px 16px', fontSize: '0.8125rem' }}>
                              <div>A: {q.option_a}</div>
                              <div>B: {q.option_b}</div>
                              <div>C: {q.option_c}</div>
                              <div>D: {q.option_d}</div>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span className="tag tag-tech" style={{ textTransform: 'uppercase', fontWeight: 800 }}>
                                Option {q.correct_option}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => {
                                    setQuestionForm(q);
                                    setShowQuestionModal(true);
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDeleteQuestion(q.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 7: AUTHENTICATION (LOGIN & REGISTER)                  */}
        {/* ========================================================== */}
        {currentView === 'auth' && (
          <div className="auth-wrapper card">
            <div className="auth-tabs">
              <button
                className={`auth-tab ${authTab === 'login' ? 'active' : ''}`}
                onClick={() => setAuthTab('login')}
              >
                Sign In
              </button>
              <button
                className={`auth-tab ${authTab === 'register' ? 'active' : ''}`}
                onClick={() => setAuthTab('register')}
              >
                Create Account
              </button>
            </div>

            {authTab === 'login' ? (
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label">College Email Address</label>
                  <input
                    type="email"
                    required
                    className="form-control"
                    placeholder="student@pathfinder.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    required
                    className="form-control"
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '8px' }}
                  disabled={authLoading}
                >
                  {authLoading ? 'Verifying...' : 'Sign In with JWT'}
                </button>

                {/* 1-Click Demo Buttons for Viva Examiners */}
                <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <span className="filter-label" style={{ display: 'block', marginBottom: '8px', textAlign: 'center' }}>
                    1-CLICK DEMO ACCOUNTS FOR EVALUATION
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => loginDemoAccount('student@pathfinder.com', 'student123')}
                    >
                      🎓 Student Demo
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => loginDemoAccount('admin@pathfinder.com', 'admin123')}
                    >
                      🛡️ Admin Demo
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Kavya Reddy"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">College Email</label>
                  <input
                    type="email"
                    required
                    className="form-control"
                    placeholder="kavya@university.edu"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    required
                    className="form-control"
                    placeholder="Min 6 characters"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Target Career</label>
                  <select
                    className="form-control"
                    value={authTargetCareer}
                    onChange={(e) => setAuthTargetCareer(e.target.value)}
                  >
                    {careersList.map(c => (
                      <option key={c.id} value={c.id}>{c.title} ({c.category})</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '8px' }}
                  disabled={authLoading}
                >
                  {authLoading ? 'Registering...' : 'Register as Student'}
                </button>
              </form>
            )}
          </div>
        )}
      </main>

      {/* ========================================================== */}
      {/* MODAL 1: MILESTONE QUIZ & REFLECTION PROOF MODAL (TASK 4)  */}
      {/* ========================================================== */}
      {quizModalMilestone && (
        <div className="modal-overlay" onClick={() => setQuizModalMilestone(null)}>
          <div className="modal-content modal-content-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex-between mb-4">
              <div>
                <span className="filter-label" style={{ color: 'var(--accent-primary)' }}>
                  VERIFY UNDERSTANDING BEFORE COMPLETION
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {quizModalMilestone.title}
                </h3>
              </div>
              <button
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setQuizModalMilestone(null)}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Pass the 3 multiple choice questions (minimum 2 of 3 required) and enter what you learned to record verified milestone progress.
            </p>

            {/* Failed Attempt Warning Banner */}
            {quizFeedback && !quizFeedback.passed && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid var(--danger-color)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                color: 'var(--danger-color)',
                fontSize: '0.875rem'
              }}>
                <strong>⚠️ Quiz Attempt Failed (Score: {quizFeedback.score}/{quizFeedback.total})</strong>
                <p style={{ marginTop: '4px' }}>
                  {quizFeedback.message} Please review the learning resource and retry!
                </p>
                <a
                  href={quizModalMilestone.resource_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent-primary)', fontWeight: 600, display: 'inline-block', marginTop: '6px' }}
                >
                  Open Free Resource in New Tab ↗
                </a>
              </div>
            )}

            {questionsLoading ? (
              <div className="card text-center" style={{ padding: '32px' }}>Loading 3 verification questions...</div>
            ) : (
              <div>
                {/* 3 Questions */}
                {milestoneQuestions.map((q, idx) => (
                  <div key={q.id} className="quiz-question-card">
                    <div className="quiz-question-title">
                      <span>Q{idx + 1}.</span>
                      <span>{q.question_text}</span>
                    </div>

                    <div className="quiz-options-list">
                      {[
                        { key: 'a', text: q.option_a },
                        { key: 'b', text: q.option_b },
                        { key: 'c', text: q.option_c },
                        { key: 'd', text: q.option_d }
                      ].map(opt => {
                        const isSelected = milestoneAnswers[idx] === opt.key;
                        return (
                          <label
                            key={opt.key}
                            className={`quiz-option-choice ${isSelected ? 'selected' : ''}`}
                          >
                            <input
                              type="radio"
                              name={`m_question_${q.id}`}
                              value={opt.key}
                              checked={isSelected}
                              onChange={() => setMilestoneAnswers({ ...milestoneAnswers, [idx]: opt.key })}
                            />
                            <span><strong>{opt.key.toUpperCase()})</strong> {opt.text}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Reflection Note: What did you learn from this step? (Min 20 characters) */}
                <div className="proof-note-box">
                  <label className="form-label" style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    ✍️ What did you learn from this step? <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(minimum 20 characters required)</span>
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Summarize key syntax, concept takeaways, or practical commands you learned from this milestone..."
                    value={proofNote}
                    onChange={(e) => setProofNote(e.target.value)}
                  ></textarea>
                  <div className={`proof-char-count ${proofNote.trim().length >= 20 ? 'valid' : ''}`}>
                    <span>{proofNote.trim().length >= 20 ? '✓ Minimum length satisfied' : 'Min 20 characters required'}</span>
                    <span>{proofNote.length} / 20 characters</span>
                  </div>
                </div>

                {/* Submit & Cancel Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setQuizModalMilestone(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={quizSubmitting}
                    onClick={handleSubmitMilestoneVerification}
                  >
                    {quizSubmitting ? 'Evaluating Quiz...' : 'Submit & Mark Completed ✓'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 2: STREAK & SCORE TRANSPARENCY (TASK 5)             */}
      {/* ========================================================== */}
      {showHowItWorksModal && (
        <div className="modal-overlay" onClick={() => setShowHowItWorksModal(false)}>
          <div className="modal-content modal-content-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex-between mb-4">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                🧭 How PathFinder Readiness & Streaks Work
              </h3>
              <button
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setShowHowItWorksModal(false)}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Designed to help engineering students build verifiable placement competencies and relentless daily consistency.
            </p>

            <div className="info-card-grid">
              {/* Readiness Score Formula */}
              <div className="info-formula-card">
                <span className="filter-label" style={{ color: 'var(--accent-primary)', display: 'block', marginBottom: '6px' }}>
                  CAMPUS READINESS SCORE FORMULA
                </span>
                <div className="formula-display">
                  Readiness Score (%) = (Completed Steps / Total Steps) × 100
                </div>
                <ul style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', paddingLeft: '18px', marginTop: '8px', lineHeight: '1.6' }}>
                  <li>Every roadmap step has <strong>3 factually correct verification questions</strong>.</li>
                  <li>A passing score of <strong>at least 2 out of 3</strong> is strictly required.</li>
                  <li>Students must write a reflective summary of what they learned (minimum 20 characters).</li>
                  <li>Ticking steps dynamically moves your score toward 100% placement readiness.</li>
                </ul>
              </div>

              {/* Duolingo Daily Streak Habit Rule */}
              <div className="info-formula-card">
                <span className="filter-label" style={{ color: 'var(--flame-color)', display: 'block', marginBottom: '6px' }}>
                  DAILY PRACTICE STREAK RULES (DUOLINGO STYLE)
                </span>
                <div className="formula-display" style={{ color: 'var(--flame-color)' }}>
                  Same Day = Unchanged | Yesterday = +1 | Break = Reset to 1
                </div>
                <ul style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', paddingLeft: '18px', marginTop: '8px', lineHeight: '1.6' }}>
                  <li><strong>Same Calendar Day:</strong> Active streak is maintained (no duplicate increments).</li>
                  <li><strong>Consecutive Day (Yesterday):</strong> Streak increments by <strong>+1</strong> day.</li>
                  <li><strong>Missed Day (&gt; 1 Day):</strong> Streak resets to <strong>1</strong> to encourage a fresh start.</li>
                  <li>Triggered by: passing a milestone quiz, rating a skill, or pressing <strong>&ldquo;🔥 I Practised Today&rdquo;</strong>.</li>
                </ul>
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowHowItWorksModal(false)}>
                Got it, let's practice!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 3: ADD / EDIT CAREER (ADMIN)                         */}
      {/* ========================================================== */}
      {showCareerModal && (
        <div className="modal-overlay" onClick={() => setShowCareerModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px' }}>
              {careerForm.id ? `Edit Career #${careerForm.id}` : 'Create New Career Path'}
            </h3>

            <form onSubmit={handleSaveCareer}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={careerForm.title}
                  onChange={(e) => setCareerForm({ ...careerForm, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-control"
                    value={careerForm.category}
                    onChange={(e) => setCareerForm({ ...careerForm, category: e.target.value })}
                  >
                    <option value="tech">Tech</option>
                    <option value="non-tech">Non-Tech</option>
                    <option value="govt">Govt</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Coding Level</label>
                  <select
                    className="form-control"
                    value={careerForm.coding_level}
                    onChange={(e) => setCareerForm({ ...careerForm, coding_level: e.target.value })}
                  >
                    <option value="none">None</option>
                    <option value="some">Some</option>
                    <option value="heavy">Heavy</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Min Salary (LPA)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    className="form-control"
                    value={careerForm.min_salary}
                    onChange={(e) => setCareerForm({ ...careerForm, min_salary: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Max Salary (LPA)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    className="form-control"
                    value={careerForm.max_salary}
                    onChange={(e) => setCareerForm({ ...careerForm, max_salary: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Salary Source Cite (Data Credibility)</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. AmbitionBox / Naukri entry-level range"
                  value={careerForm.salary_source || ''}
                  onChange={(e) => setCareerForm({ ...careerForm, salary_source: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Demand Tag</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={careerForm.demand_tag}
                  onChange={(e) => setCareerForm({ ...careerForm, demand_tag: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows="2"
                  required
                  className="form-control"
                  value={careerForm.description}
                  onChange={(e) => setCareerForm({ ...careerForm, description: e.target.value })}
                ></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">Daily Work</label>
                <textarea
                  rows="2"
                  required
                  className="form-control"
                  value={careerForm.daily_work}
                  onChange={(e) => setCareerForm({ ...careerForm, daily_work: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCareerModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Career
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 4: ADD / EDIT MILESTONE (ADMIN)                      */}
      {/* ========================================================== */}
      {showMilestoneModal && (
        <div className="modal-overlay" onClick={() => setShowMilestoneModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px' }}>
              {milestoneForm.id ? `Edit Milestone #${milestoneForm.id}` : 'Add Roadmap Milestone'}
            </h3>

            <form onSubmit={handleSaveMilestone}>
              <div className="form-group">
                <label className="form-label">Phase Number (1: Foundations, 2: Core, 3: Practice)</label>
                <select
                  className="form-control"
                  value={milestoneForm.phase_number}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, phase_number: parseInt(e.target.value, 10) })}
                >
                  <option value={1}>Phase 1: Foundations</option>
                  <option value={2}>Phase 2: Core Tools</option>
                  <option value={3}>Phase 3: Practice</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Milestone Title</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Master SQL Aggregations and Window Functions"
                  value={milestoneForm.title}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Free Resource URL</label>
                <input
                  type="url"
                  required
                  className="form-control"
                  placeholder="https://www.w3schools.com/sql/"
                  value={milestoneForm.resource_url}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, resource_url: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMilestoneModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 5: ADD / EDIT VERIFICATION QUESTION (ADMIN)          */}
      {/* ========================================================== */}
      {showQuestionModal && (
        <div className="modal-overlay" onClick={() => setShowQuestionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px' }}>
              {questionForm.id ? `Edit Question #${questionForm.id}` : `Add Question for Milestone #${adminSelectedMilestoneId}`}
            </h3>

            <form onSubmit={handleSaveQuestion}>
              <div className="form-group">
                <label className="form-label">Question Text</label>
                <textarea
                  rows="2"
                  required
                  className="form-control"
                  placeholder="Enter the multiple choice question text..."
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                ></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">Option A</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={questionForm.option_a}
                  onChange={(e) => setQuestionForm({ ...questionForm, option_a: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Option B</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={questionForm.option_b}
                  onChange={(e) => setQuestionForm({ ...questionForm, option_b: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Option C</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={questionForm.option_c}
                  onChange={(e) => setQuestionForm({ ...questionForm, option_c: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Option D</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={questionForm.option_d}
                  onChange={(e) => setQuestionForm({ ...questionForm, option_d: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Correct Option</label>
                <select
                  className="form-control"
                  value={questionForm.correct_option}
                  onChange={(e) => setQuestionForm({ ...questionForm, correct_option: e.target.value })}
                >
                  <option value="a">Option A</option>
                  <option value="b">Option B</option>
                  <option value="c">Option C</option>
                  <option value="d">Option D</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowQuestionModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '24px 16px', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
        PathFinder • B.Tech Final Project • Strict Tech Stack: React JS (Vite) + Node.js Express + MySQL Relational Database (No External UI Libraries)
      </footer>
    </div>
  );
}
