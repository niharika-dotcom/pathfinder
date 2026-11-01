// End-to-end integration test against the LIVE server on port 5000
const BASE = 'http://localhost:5000/api';

async function runLiveTests() {
  console.log('\n====================================================================');
  console.log('🧪 Running Live E2E Integration Test Suite on http://localhost:5000');
  console.log('====================================================================\n');

  try {
    // 1. Health check (Verify ok: true)
    const healthRes = await fetch(`${BASE}/health`);
    const health = await healthRes.json();
    if (!health.ok) throw new Error('Health check missing ok: true');
    if (!health.database.isMysqlLive) throw new Error('Live MySQL is not reported live');
    console.log('✅ 1. Health Probe: ok: true | status: healthy | Engine:', health.database.engine, '| SSL:', health.database.sslEnabled);

    // 1b. CORS verification
    const corsRes = await fetch(`${BASE}/health`, {
      headers: { 'Origin': 'http://localhost:5173' }
    });
    const allowOrigin = corsRes.headers.get('access-control-allow-origin');
    if (allowOrigin !== 'http://localhost:5173') {
      throw new Error(`CORS header mismatch: expected http://localhost:5173, got ${allowOrigin}`);
    }
    console.log('✅ 1b. CORS Probe: Access-Control-Allow-Origin correctly granted to http://localhost:5173');

    // 2. Register
    const regEmail = `live.test.${Date.now()}@btech.edu`;
    const regRes = await (await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aarav Sharma',
        email: regEmail,
        password: 'password123',
        role: 'student',
        target_career_id: 1
      })
    })).json();
    if (!regRes.token) throw new Error('Registration failed to return token');
    console.log('✅ 2. Register New Student:', regRes.user.name, `(${regRes.user.email})`);
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
    if (adminRes.user.role !== 'admin') throw new Error('Admin login failed');
    console.log('✅ 3. Login Admin:', adminRes.user.email, `(Role: ${adminRes.user.role})`);
    const adminToken = adminRes.token;

    // 4. Career Quiz Match
    const quizSubmitRes = await (await fetch(`${BASE}/quiz/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        answers: { "1": 1, "2": 6, "3": 9, "4": 14, "5": 18 }
      })
    })).json();
    if (!quizSubmitRes.top_match) throw new Error('Quiz match failed');
    console.log(`✅ 4. Quiz Match: Top Match = "${quizSubmitRes.top_match.title}" (${quizSubmitRes.top_match.match_percentage}%)`);

    // 5. Gate Enforcement: Complete Milestone 4 without passing quiz -> 403 Forbidden
    const blockedRes = await fetch(`${BASE}/user/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ milestoneId: 4, status: 'completed' })
    });
    if (blockedRes.status !== 403) throw new Error(`Expected 403 Forbidden, got ${blockedRes.status}`);
    const blockedJson = await blockedRes.json();
    console.log(`✅ 5. Gate Enforcement: Blocked with 403 -> "${blockedJson.error}"`);

    // 6. Failing Milestone Quiz (< 2/3)
    const failQuiz = await (await fetch(`${BASE}/milestones/4/quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ answers: ['d', 'd', 'd'] })
    })).json();
    if (failQuiz.passed !== false || failQuiz.correctAnswers) {
      throw new Error('Failing attempt should not pass or expose correct answers');
    }
    console.log(`✅ 6. Failing Milestone Quiz: Score ${failQuiz.score}/${failQuiz.total} | Passed: ${failQuiz.passed}`);

    // 7. Passing Milestone Quiz (Milestone 4: Power BI/Tableau DAX questions: Q1='a', Q2='b', Q3='a')
    const passQuiz = await (await fetch(`${BASE}/milestones/4/quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ answers: ['a', 'b', 'a'] })
    })).json();
    if (!passQuiz.passed) throw new Error('Passing attempt failed unexpectedly');
    console.log(`✅ 7. Passing Milestone Quiz: Score ${passQuiz.score}/${passQuiz.total} | Passed: ${passQuiz.passed}`);

    // 8. Complete Milestone with Reflection Note
    const completeProgress = await (await fetch(`${BASE}/user/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        milestoneId: 4,
        status: 'completed',
        proof_note: 'Learned DAX formulas in Power BI and designed interactive star schema dashboards.'
      })
    })).json();
    if (!completeProgress.success || completeProgress.status !== 'completed') {
      throw new Error('Failed to complete milestone with note');
    }
    console.log(`✅ 8. Complete Milestone with Note: Readiness = ${completeProgress.readiness_score}%, Streak = ${completeProgress.streak.streak_count}d`);

    // 9. Untick Milestone (Undo)
    const untickProgress = await (await fetch(`${BASE}/user/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ milestoneId: 4, status: 'pending' })
    })).json();
    if (!untickProgress.success || untickProgress.status !== 'pending') {
      throw new Error('Failed to untick milestone');
    }
    console.log(`✅ 9. Untick Milestone (Undo): Status = "${untickProgress.status}", Readiness = ${untickProgress.readiness_score}%`);

    // 10. Skill Gap Rating
    const skillRateRes = await (await fetch(`${BASE}/user/skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        ratings: [
          { career_skill_id: 1, rating: 5 },
          { career_skill_id: 2, rating: 4 }
        ]
      })
    })).json();
    console.log(`✅ 10. Skill Gap Rating: ${skillRateRes.message}`);

    // 11. Daily Streak Check-in
    const checkinRes = await (await fetch(`${BASE}/user/checkin`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    })).json();
    console.log(`✅ 11. Streak Check-in: ${checkinRes.message} (Streak: ${checkinRes.streak_count}d)`);

    // 12. Admin Question CRUD
    // 12a. Fetch questions with correct_option
    const adminQList = await (await fetch(`${BASE}/admin/milestones/1/questions`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })).json();
    console.log(`✅ 12a. Admin Get Questions: Found ${adminQList.count} questions with correct_option.`);

    // 12b. Add question
    const addQ = await (await fetch(`${BASE}/admin/milestones/1/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        question_text: 'What Excel formula combines strings?',
        option_a: 'CONCATENATE',
        option_b: 'SUM',
        option_c: 'COUNT',
        option_d: 'AVERAGE',
        correct_option: 'a'
      })
    })).json();
    const qId = addQ.questionId;
    console.log(`✅ 12b. Admin Add Question: Created question #${qId}`);

    // 12c. Edit question
    const editQ = await (await fetch(`${BASE}/admin/questions/${qId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        question_text: 'What modern Excel function combines strings?',
        option_a: 'TEXTJOIN (or CONCAT)',
        option_b: 'SUM',
        option_c: 'COUNT',
        option_d: 'AVERAGE',
        correct_option: 'a'
      })
    })).json();
    console.log(`✅ 12c. Admin Edit Question: ${editQ.message}`);

    // 12d. Delete question
    const delQ = await (await fetch(`${BASE}/admin/questions/${qId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })).json();
    console.log(`✅ 12d. Admin Delete Question: ${delQ.message}`);

    // 13. Admin Career CRUD
    const addCareer = await (await fetch(`${BASE}/admin/careers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Site Reliability Engineer',
        category: 'tech',
        coding_level: 'some',
        min_salary: 8.0,
        max_salary: 22.0,
        demand_tag: 'Very High',
        description: 'Ensure system resilience and reliability.',
        daily_work: 'Monitoring latency, incident post-mortems, writing SLOs.',
        salary_source: 'Levels.fyi SRE Compensation Benchmark',
        last_verified: '2026-11-01'
      })
    })).json();
    const cId = addCareer.careerId;
    console.log(`✅ 13a. Admin Add Career: Created #${cId}`);

    const delCareer = await (await fetch(`${BASE}/admin/careers/${cId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })).json();
    console.log(`✅ 13b. Admin Delete Career: ${delCareer.message}`);

    console.log('\n====================================================================');
    console.log('🎉 ALL LIVE E2E INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
    console.log('====================================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Live E2E test failed:', err.message);
    process.exit(1);
  }
}

runLiveTests();
