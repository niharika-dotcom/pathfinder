const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

/**
 * Universal JSON Fetch Helper with error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP error ${res.status}: ${res.statusText}`);
    }
    return data;
  } catch (err) {
    console.error(`[API Request Error] ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // 1. User authentication & onboarding (with target career path)
  loginOrRegister: (name, email, target_role_id) =>
    request('/users/login-or-register', {
      method: 'POST',
      body: JSON.stringify({ name, email, target_role_id }),
    }),

  // 2. Set target career role
  setTargetRole: (userId, roleId) =>
    request('/users/target-role', {
      method: 'POST',
      body: JSON.stringify({ userId, roleId }),
    }),

  // 3. User summary dashboard
  getUserDashboard: (userId) =>
    request(`/user/${userId}/dashboard`),

  // 4. Careers catalog with optional filter
  getCareers: (category = 'all') => {
    const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
    return request(`/careers${query}`);
  },

  // 5. Milestones roadmap for career role with user progress, phase names, content summaries
  getCareerRoadmap: (roleId, userId) => {
    const query = userId ? `?userId=${userId}` : '';
    return request(`/careers/${roleId}/roadmaps${query}`);
  },

  // 6. Toggle milestone completion
  toggleMilestone: (userId, milestoneId, isCompleted) =>
    request('/progress/toggle', {
      method: 'POST',
      body: JSON.stringify({ userId, milestoneId, isCompleted }),
    }),

  // 7. Check-in daily streak
  checkInStreak: (userId) =>
    request('/streak/check-in', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  // 8. Practice Arena: Fetch questions & score history
  getPracticeQuestions: (roleId, userId) => {
    const query = userId ? `?userId=${userId}` : '';
    return request(`/practice/${roleId}${query}`);
  },

  // 9. Practice Arena: Submit quiz
  submitPracticeQuiz: (userId, roleId, answers) =>
    request('/practice/submit', {
      method: 'POST',
      body: JSON.stringify({ userId, roleId, answers }),
    }),

  // 10. Health check
  checkHealth: () => request('/health'),
};

export default api;
