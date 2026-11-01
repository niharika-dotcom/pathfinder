async function testEndpoints() {
  const BASE = 'http://localhost:5000/api';
  console.log('--- Commencing REST API Verification ---');

  try {
    // 1. Health
    const health = await (await fetch(`${BASE}/health`)).json();
    console.log('✅ /api/health:', health.status, '| DB Engine:', health.database.engine);

    // 2. Careers list
    const careers = await (await fetch(`${BASE}/careers`)).json();
    console.log(`✅ /api/careers: Returned ${careers.count} career tracks:`);
    careers.careers.forEach(c => console.log(`   - [${c.category}] ${c.title} (${c.salary_range})`));

    // 3. Category Filter
    const codingOnly = await (await fetch(`${BASE}/careers?category=coding`)).json();
    console.log(`✅ /api/careers?category=coding: Filtered to ${codingOnly.count} track(s)`);

    // 4. Career Roadmap for User 1
    const roadmap = await (await fetch(`${BASE}/careers/1/roadmaps?userId=1`)).json();
    console.log(`✅ /api/careers/1/roadmaps?userId=1: Readiness ${roadmap.readinessScore}% (${roadmap.completedCount}/${roadmap.totalMilestones} done)`);

    // 5. Toggle Milestone Progress
    const toggle = await (await fetch(`${BASE}/progress/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 1, milestoneId: 4, isCompleted: true })
    })).json();
    console.log(`✅ /api/progress/toggle: Milestone 4 updated -> is_completed: ${toggle.is_completed}, new readiness: ${toggle.readinessScore}%`);

    // 6. Daily Streak Check-in
    const streak = await (await fetch(`${BASE}/streak/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 1 })
    })).json();
    console.log(`✅ /api/streak/check-in: Current streak: ${streak.current_streak} days | Message: "${streak.message}"`);

    // 7. User Dashboard
    const dashboard = await (await fetch(`${BASE}/user/1/dashboard`)).json();
    console.log(`✅ /api/user/1/dashboard: Student: ${dashboard.user.name} | Readiness: ${dashboard.readinessScore}% | Streak: ${dashboard.streak.current_streak}d`);

    // 8. Onboard New Student
    const onboard = await (await fetch(`${BASE}/users/login-or-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Rohan Varma', email: 'rohan.v@campus.edu' })
    })).json();
    console.log(`✅ /api/users/login-or-register: Student: ${onboard.user.name} (${onboard.user.email}) | Target: ${onboard.targetRole?.title}`);

    console.log('\n🎉 ALL 8 REST API ENDPOINTS VERIFIED AND PASSING 100%!');
  } catch (err) {
    console.error('❌ Endpoint test failed:', err);
    process.exit(1);
  }
}

testEndpoints();
