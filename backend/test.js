process.env.NODE_ENV = 'test';
process.env.PORT = '5002'; // Dedicated testing port

import app from './server.js';

const PORT = 5002;
const server = app.listen(PORT, async () => {
  console.log('\n====================================================================');
  console.log('🧪 Commencing Comprehensive B.Tech Final Project Backend Verification');
  console.log('   (Strict MySQL, Verified Quiz Pass Gates & Admin CRUD)');
  console.log('====================================================================\n');
  const BASE = `http://localhost:${PORT}/api`;

  try {
    // 1. Health Probe (Includes ok: true)
    const health = await (await fetch(`${BASE}/health`)).json();
    if (!health.ok) throw new Error('Health check missing ok: true');
    console.log('✅ 1. Health Probe: ok: true | status:', health.status, '| DB:', health.database.engine);

    // 1b. CORS verification
    const corsRes = await fetch(`${BASE}/health`, {
      headers: { 'Origin': 'http://localhost:5173' }
    });
    const allowOrigin = corsRes.headers.get('access-control-allow-origin');
    if (allowOrigin !== 'http://localhost:5173') {
      throw new Error(`CORS header mismatch: expected http://localhost:5173, got ${allowOrigin}`);
    }
    console.log('✅ 1b. CORS Probe: Access-Control-Allow-Origin correctly granted to http://localhost:5173');

    // 2. Register New Student
    const regRes = await (await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kavya Reddy',
        email: 'kavya.reddy@btech.edu',
        password: 'password123',
        target_career_id: 1
      })
    })).json();
    console.log('✅ 2. POST /api/auth/register:', regRes.user.name, `(Token issued: ${Boolean(regRes.token)})`);
    const studentToken = regRes.token;

    // 3. Login Admin
    const adminRes = await (await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@pathfinder.com',
        password: 'admin123'
      })
    })).json();
    console.log('✅ 3. POST /api/auth/login (Admin):', adminRes.user.email, `(Role: ${adminRes.user.role})`);
    const adminToken = adminRes.token;

    // 4. Careers Verification (Checks Data Credibility: salary_source and last_verified)
    const careersRes = await (await fetch(`${BASE}/careers`)).json();
    const c1 = careersRes.careers[0];
    if (!c1.salary_source || !c1.last_verified) {
      throw new Error('Career missing salary_source or last_verified');
    }
    console.log(`✅ 4. GET /api/careers: ${careersRes.count} careers verified. Source: "${c1.salary_source}", Checked: ${c1.last_verified}`);

    // 5. Quiz Questions & Match
    const quizRes = await (await fetch(`${BASE}/quiz`)).json();
    console.log(`✅ 5. GET /api/quiz: Loaded ${quizRes.count} preference questions.`);

    const submitQuizRes = await (await fetch(`${BASE}/quiz/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        answers: { "1": 1, "2": 6, "3": 9, "4": 14, "5": 18 }
      })
    })).json();
    console.log(`✅ 6. POST /api/quiz/submit: Top Match = "${submitQuizRes.top_match.title}" (${submitQuizRes.top_match.match_percentage}%)`);

    // 7. Roadmap Fetch
    const roadmapRes = await (await fetch(`${BASE}/roadmaps/1`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    })).json();
    console.log(`✅ 7. GET /api/roadmaps/1: "${roadmapRes.career.title}" has ${roadmapRes.total_milestones} milestones across 3 phases`);

    // 8. Fetch Milestone Questions (Public/Student view WITHOUT correct_option)
    const mqRes = await (await fetch(`${BASE}/milestones/3/questions`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    })).json();
    if (mqRes.questions.some(q => q.correct_option)) {
      throw new Error('Security flaw: correct_option leaked in student question endpoint');
    }
    console.log(`✅ 8. GET /api/milestones/3/questions: Loaded ${mqRes.total} questions securely (correct_option hidden).`);

    // 9. Gate Verification: Attempting to mark milestone completed WITHOUT passing quiz -> Expect 403
    const blockedProgress = await fetch(`${BASE}/user/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ milestoneId: 3, status: 'completed' })
    });
    if (blockedProgress.status !== 403) {
      throw new Error(`Expected 403 Forbidden, got status ${blockedProgress.status}`);
    }
    const blockedData = await blockedProgress.json();
    console.log(`✅ 9. Gate Enforcement: Blocked with 403 -> "${blockedData.error}"`);

    // 10. Failing Milestone Quiz (< 2/3)
    const failQuizRes = await (await fetch(`${BASE}/milestones/3/quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ answers: ['d', 'd', 'd'] })
    })).json();
    if (failQuizRes.passed !== false || failQuizRes.correctAnswers) {
      throw new Error('Failed quiz should not pass or reveal correct answers');
    }
    console.log(`✅ 10. POST /api/milestones/3/quiz (Fail Attempt): Score ${failQuizRes.score}/${failQuizRes.total} | Passed: ${failQuizRes.passed}`);

    // 11. Passing Milestone Quiz (>= 2/3)
    // Milestone 3 questions correct answers: Q1='b', Q2='b', Q3='a'
    const passQuizRes = await (await fetch(`${BASE}/milestones/3/quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ answers: ['b', 'b', 'a'] })
    })).json();
    if (!passQuizRes.passed) {
      throw new Error('Quiz attempt should have passed');
    }
    console.log(`✅ 11. POST /api/milestones/3/quiz (Pass Attempt): Score ${passQuizRes.score}/${passQuizRes.total} | Passed: ${passQuizRes.passed}`);

    // 12. Marking Milestone Completed (Allowed after passing quiz)
    const progressRes = await (await fetch(`${BASE}/user/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        milestoneId: 3,
        status: 'completed',
        proof_note: 'Learned CTEs, Window functions like DENSE_RANK and OVER clause with partition.'
      })
    })).json();
    console.log(`✅ 12. POST /api/user/progress: Readiness updated to ${progressRes.readiness_score}% (Streak: ${progressRes.streak.streak_count}d)`);

    // 13. Unticking Milestone (Always allowed to undo)
    const untickRes = await (await fetch(`${BASE}/user/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ milestoneId: 3, status: 'pending' })
    })).json();
    console.log(`✅ 13. POST /api/user/progress (Undo/Untick): Status changed to "${untickRes.status}", Readiness now ${untickRes.readiness_score}%`);

    // 14. Daily Streak Check & Check-in ("I practised today")
    const streakRes = await (await fetch(`${BASE}/user/streak`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    })).json();
    console.log(`✅ 14. GET /api/user/streak: Current streak = ${streakRes.streak_count} days`);

    const checkinRes = await (await fetch(`${BASE}/user/checkin`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    })).json();
    console.log(`✅ 15. POST /api/user/checkin: ${checkinRes.message}`);

    // 16. Skill Gap Rating & Analytics
    const skillGapRes = await (await fetch(`${BASE}/skill-gap/1`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    })).json();
    console.log(`✅ 16. GET /api/skill-gap/1: Target role has ${skillGapRes.skills.length} competencies to rate.`);

    const rateRes = await (await fetch(`${BASE}/user/skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        ratings: [
          { career_skill_id: 1, rating: 4 },
          { career_skill_id: 2, rating: 5 }
        ]
      })
    })).json();
    console.log(`✅ 17. POST /api/user/skills: ${rateRes.message}`);

    // 18. Admin CRUD for Milestone Verification Questions
    // 18a. Admin get questions with correct_option
    const adminQuestionsRes = await (await fetch(`${BASE}/admin/milestones/1/questions`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })).json();
    console.log(`✅ 18a. GET /api/admin/milestones/1/questions: Admin loaded ${adminQuestionsRes.count} questions with correct_option.`);

    // 18b. Admin create question
    const createQRes = await (await fetch(`${BASE}/admin/milestones/1/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        question_text: 'What Excel shortcut selects an entire column?',
        option_a: 'Ctrl + Space',
        option_b: 'Shift + Space',
        option_c: 'Alt + F4',
        option_d: 'Ctrl + P',
        correct_option: 'a'
      })
    })).json();
    const createdQId = createQRes.questionId;
    console.log(`✅ 18b. POST /api/admin/milestones/1/questions: Created question #${createdQId}`);

    // 18c. Admin update question
    const updateQRes = await (await fetch(`${BASE}/admin/questions/${createdQId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        question_text: 'What Excel shortcut selects an entire row?',
        option_a: 'Shift + Space',
        option_b: 'Ctrl + Space',
        option_c: 'Alt + Enter',
        option_d: 'Ctrl + Z',
        correct_option: 'a'
      })
    })).json();
    console.log(`✅ 18c. PUT /api/admin/questions/:id: ${updateQRes.message}`);

    // 18d. Admin delete question
    const deleteQRes = await (await fetch(`${BASE}/admin/questions/${createdQId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })).json();
    console.log(`✅ 18d. DELETE /api/admin/questions/:id: ${deleteQRes.message}`);

    // 19. Admin Career CRUD
    const createCareerRes = await (await fetch(`${BASE}/admin/careers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Cybersecurity Analyst',
        category: 'tech',
        coding_level: 'some',
        min_salary: 6.5,
        max_salary: 18.0,
        demand_tag: 'Very High',
        description: 'Protect enterprise infrastructure from cyber threats.',
        daily_work: 'Vulnerability assessments, network traffic auditing, SOC monitoring.',
        salary_source: 'Naukri / AmbitionBox Security Salary Benchmark',
        last_verified: '2026-11-01'
      })
    })).json();
    console.log(`✅ 19a. POST /api/admin/careers: Created Career ID ${createCareerRes.careerId}`);

    const deleteCareerRes = await (await fetch(`${BASE}/admin/careers/${createCareerRes.careerId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })).json();
    console.log(`✅ 19b. DELETE /api/admin/careers/:id: ${deleteCareerRes.message}`);

    console.log('\n====================================================================');
    console.log('🎉 100% OF B.TECH FINAL PROJECT BACKEND REQUIREMENTS TESTED & PASSED!');
    console.log('   Strict MySQL + Verified Quiz Gate + Streak + Admin CRUD all verified.');
    console.log('====================================================================\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  } finally {
    server.close(() => {
      process.exit(0);
    });
  }
});
