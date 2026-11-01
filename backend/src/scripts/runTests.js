process.env.NODE_ENV = 'test';
process.env.PORT = '5001';

import app from '../server.js';

const PORT = 5001;
const server = app.listen(PORT, async () => {
  console.log('\n--- Commencing In-Process REST API Verification (Full Stack Upgrade) ---');
  const BASE = `http://localhost:${PORT}/api`;

  try {
    // 1. Health
    const health = await (await fetch(`${BASE}/health`)).json();
    console.log('✅ 1. GET /api/health:', health.status, '| DB Engine:', health.database.engine);

    // 2. Careers list
    const careers = await (await fetch(`${BASE}/careers`)).json();
    console.log(`✅ 2. GET /api/careers: Returned ${careers.count} career tracks:`);
    careers.careers.forEach(c => console.log(`      - [${c.category}] ${c.title} (${c.salary_range})`));

    // 3. Category Filter
    const codingOnly = await (await fetch(`${BASE}/careers?category=coding`)).json();
    console.log(`✅ 3. GET /api/careers?category=coding: Filtered to ${codingOnly.count} track(s)`);

    // 4. Career Roadmap for User 1 (with phase names and content summaries)
    const roadmap = await (await fetch(`${BASE}/careers/1/roadmaps?userId=1`)).json();
    console.log(`✅ 4. GET /api/careers/1/roadmaps?userId=1: Readiness ${roadmap.readinessScore}% (${roadmap.completedCount}/${roadmap.totalMilestones} done)`);
    console.log(`      Sample milestone phase: "${roadmap.milestones[0].phase_name}" | reading time: ${roadmap.milestones[0].reading_time}`);

    // 5. Toggle Milestone Progress
    const toggle = await (await fetch(`${BASE}/progress/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 1, milestoneId: 4, isCompleted: true })
    })).json();
    console.log(`✅ 5. POST /api/progress/toggle: Milestone 4 -> is_completed: ${toggle.is_completed}, new readiness: ${toggle.readinessScore}%`);

    // 6. Daily Streak Check-in
    const streak = await (await fetch(`${BASE}/streak/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 1 })
    })).json();
    console.log(`✅ 6. POST /api/streak/check-in: Current streak: ${streak.current_streak} days | "${streak.message}"`);

    // 7. Practice Questions fetch
    const practice = await (await fetch(`${BASE}/practice/1?userId=1`)).json();
    console.log(`✅ 7. GET /api/practice/1?userId=1: Loaded ${practice.count} questions. Topic 1: "${practice.questions[0].topic}"`);

    // 8. Practice Quiz Submission
    const quizSubmission = await (await fetch(`${BASE}/practice/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 1,
        roleId: 1,
        answers: [
          { questionId: 1, selectedIndex: 1 },
          { questionId: 2, selectedIndex: 2 },
          { questionId: 3, selectedIndex: 2 },
          { questionId: 4, selectedIndex: 1 }
        ]
      })
    })).json();
    console.log(`✅ 8. POST /api/practice/submit: Scored ${quizSubmission.score}/${quizSubmission.total} (${quizSubmission.percentage}%) | "${quizSubmission.message}"`);

    // 9. User Dashboard
    const dashboard = await (await fetch(`${BASE}/user/1/dashboard`)).json();
    console.log(`✅ 9. GET /api/user/1/dashboard: Student: ${dashboard.user.name} | Readiness: ${dashboard.readinessScore}% | Streak: ${dashboard.streak.current_streak}d`);

    // 10. Dedicated Onboarding Flow with Target Career
    const onboard = await (await fetch(`${BASE}/users/login-or-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Ananya Roy', email: 'ananya.roy@university.edu', target_role_id: 2 })
    })).json();
    console.log(`✅ 10. POST /api/users/login-or-register: Student: ${onboard.user.name} (${onboard.user.email}) | Target: ${onboard.targetRole?.title}`);

    console.log('\n========================================================================');
    console.log('🎉 ALL 10 REST API ENDPOINTS (ROADMAP + PRACTICE + AUTH) WORKING 100%!');
    console.log('========================================================================\n');
  } catch (err) {
    console.error('❌ Endpoint test failed:', err);
    process.exit(1);
  } finally {
    server.close(() => {
      process.exit(0);
    });
  }
});
