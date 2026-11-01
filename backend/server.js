import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'pathfinder_super_secret_jwt_key_btech_2026';

// Process-level resilience guards
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]:', reason);
});

// CORS Configuration: Allow origin from FRONTEND_URL env var plus localhost:5173 and :5174
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
];

if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',').forEach(url => {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    if (cleanUrl && !allowedOrigins.includes(cleanUrl)) {
      allowedOrigins.push(cleanUrl);
    }
  });
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser requests (e.g. curl, tests, mobile clients) with no origin header
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/+$/, '');
    if (allowedOrigins.includes(origin) || allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy blocked access from origin: ${origin}`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logger for debugging & viva demonstration
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// ====================================================================
// AUTHENTICATION MIDDLEWARES
// ====================================================================

/**
 * Verifies JWT token from Authorization header (Bearer <token>)
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Session expired or invalid token' });
    }
    req.user = user;
    next();
  });
}

/**
 * Optional token authentication (allows guest browsing while enriching if token present)
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err && user) {
      req.user = user;
    } else {
      req.user = null;
    }
    next();
  });
}

/**
 * Admin role guard
 */
export function verifyAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden: Admin privilege required' });
  }
  next();
}

// ====================================================================
// 1. AUTHENTICATION ENDPOINTS
// ====================================================================

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role = 'student', target_career_id } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Check existing email
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing && existing.length > 0) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const chosenRole = role === 'admin' ? 'admin' : 'student';
    const targetCareer = target_career_id ? parseInt(target_career_id, 10) : null;

    const [insertResult] = await db.query(
      'INSERT INTO users (name, email, password_hash, role, target_career_id) VALUES (?, ?, ?, ?, ?)',
      [cleanName, cleanEmail, password_hash, chosenRole, targetCareer]
    );

    const userId = insertResult.insertId;

    // Initialize 1-day starter streak
    const todayStr = new Date().toISOString().split('T')[0];
    await db.query(
      'INSERT INTO daily_streaks (user_id, last_active_date, streak_count) VALUES (?, ?, 1)',
      [userId, todayStr]
    );

    const token = jwt.sign(
      { id: userId, name: cleanName, email: cleanEmail, role: chosenRole },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        role: chosenRole,
        target_career_id: targetCareer
      },
      message: `Account successfully created! Welcome, ${cleanName}.`
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, error: 'Server error during registration' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const user = users[0];
    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        target_career_id: user.target_career_id
      },
      message: `Welcome back, ${user.name}!`
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Server error during login' });
  }
});

// ====================================================================
// 2. QUIZ ENGINE ENDPOINTS
// ====================================================================

// GET /api/quiz
app.get('/api/quiz', async (req, res) => {
  try {
    const [questions] = await db.query('SELECT * FROM quiz_questions ORDER BY id ASC');
    const [options] = await db.query('SELECT * FROM quiz_options ORDER BY question_id ASC, id ASC');

    const formatted = questions.map(q => ({
      id: q.id,
      question_text: q.question_text,
      options: options.filter(o => o.question_id === q.id).map(o => ({
        id: o.id,
        option_text: o.option_text
      }))
    }));

    return res.status(200).json({ success: true, count: formatted.length, questions: formatted });
  } catch (err) {
    console.error('Quiz fetch error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load quiz questions' });
  }
});

// POST /api/quiz/submit
app.post('/api/quiz/submit', optionalAuth, async (req, res) => {
  try {
    const { answers } = req.body; // e.g. { "1": 2, "2": 5, "3": 9, ... }

    if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
      return res.status(400).json({ success: false, error: 'Quiz answers are required' });
    }

    const selectedOptionIds = Object.values(answers).map(val => parseInt(val, 10)).filter(Boolean);

    // Fetch all careers
    const [careers] = await db.query('SELECT id, title, category, coding_level, min_salary, max_salary, demand_tag, description FROM career_paths');
    // Fetch all weights
    const [weights] = await db.query('SELECT option_id, career_id, weight FROM option_weights');
    // Fetch options to know which question each option belongs to
    const [options] = await db.query('SELECT id, question_id FROM quiz_options');

    // Group options by question
    const questionOptionsMap = {};
    options.forEach(o => {
      if (!questionOptionsMap[o.question_id]) questionOptionsMap[o.question_id] = [];
      questionOptionsMap[o.question_id].push(o.id);
    });

    // Map weights by `${option_id}_${career_id}`
    const weightMap = {};
    weights.forEach(w => {
      weightMap[`${w.option_id}_${w.career_id}`] = w.weight;
    });

    // Calculate score & max possible score for each career
    const rankedCareers = careers.map(c => {
      let careerScore = 0;
      selectedOptionIds.forEach(optId => {
        const w = weightMap[`${optId}_${c.id}`] || 0;
        careerScore += w;
      });

      // Calculate max possible score for this career across all questions
      let maxPossibleScore = 0;
      Object.values(questionOptionsMap).forEach(optIdsForQ => {
        let maxWeightForQ = 0;
        optIdsForQ.forEach(oId => {
          const w = weightMap[`${oId}_${c.id}`] || 0;
          if (w > maxWeightForQ) maxWeightForQ = w;
        });
        maxPossibleScore += maxWeightForQ;
      });

      const matchPercentage = maxPossibleScore > 0
        ? Math.min(100, Math.max(10, Math.round((careerScore / maxPossibleScore) * 100)))
        : 50;

      return {
        ...c,
        score: careerScore,
        max_possible_score: maxPossibleScore,
        match_percentage: matchPercentage
      };
    });

    // Sort descending by match percentage
    rankedCareers.sort((a, b) => b.match_percentage - a.match_percentage);

    // If user is authenticated, give streak activity boost!
    if (req.user) {
      await db.updateStreak(req.user.id);
    }

    return res.status(200).json({
      success: true,
      top_match: rankedCareers[0],
      ranked_careers: rankedCareers
    });
  } catch (err) {
    console.error('Quiz submit error:', err);
    return res.status(500).json({ success: false, error: 'Failed to compute quiz recommendations' });
  }
});

// ====================================================================
// 3. CAREERS CATALOG & ROADMAPS
// ====================================================================

// GET /api/careers?coding=&category=
app.get('/api/careers', async (req, res) => {
  try {
    const { coding, category } = req.query;

    let sql = 'SELECT * FROM career_paths';
    const params = [];
    const conditions = [];

    if (coding && coding !== 'all') {
      conditions.push('coding_level = ?');
      params.push(coding.toLowerCase());
    }

    if (category && category !== 'all') {
      conditions.push('category = ?');
      params.push(category.toLowerCase());
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY id ASC';

    const [careers] = await db.query(sql, params);
    return res.status(200).json({ success: true, count: careers.length, careers });
  } catch (err) {
    console.error('Careers error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch careers' });
  }
});

// GET /api/roadmaps/:careerId
app.get('/api/roadmaps/:careerId', optionalAuth, async (req, res) => {
  try {
    const careerId = parseInt(req.params.careerId, 10);
    if (isNaN(careerId)) {
      return res.status(400).json({ success: false, error: 'Valid careerId required' });
    }

    const [careerRows] = await db.query('SELECT * FROM career_paths WHERE id = ?', [careerId]);
    if (!careerRows || careerRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Career not found' });
    }
    const career = careerRows[0];

    const [milestones] = await db.query(
      'SELECT id, career_id, phase_number, title, resource_url FROM milestones WHERE career_id = ? ORDER BY phase_number ASC, id ASC',
      [careerId]
    );

    // If student is logged in, lookup milestone completion status & passed quizzes
    const progressMap = new Map();
    const passedQuizSet = new Set();

    if (req.user) {
      const [progressRows] = await db.query(
        'SELECT milestone_id, status, proof_note FROM user_milestone_progress WHERE user_id = ?',
        [req.user.id]
      );
      if (progressRows) {
        progressRows.forEach(p => progressMap.set(p.milestone_id, p));
      }

      const [attemptRows] = await db.query(
        'SELECT milestone_id FROM milestone_quiz_attempts WHERE user_id = ? AND passed = 1',
        [req.user.id]
      );
      if (attemptRows) {
        attemptRows.forEach(a => passedQuizSet.add(a.milestone_id));
      }
    }

    let completedCount = 0;
    const enrichedMilestones = milestones.map(m => {
      const prog = progressMap.get(m.id);
      const isCompleted = prog && prog.status === 'completed';
      const hasPassedQuiz = passedQuizSet.has(m.id);
      const proofNote = prog ? prog.proof_note : null;

      if (isCompleted) completedCount++;

      return {
        ...m,
        is_completed: isCompleted,
        quiz_passed: hasPassedQuiz,
        proof_note: proofNote,
        phase_label: m.phase_number === 1 ? 'Phase 1: Foundations' : m.phase_number === 2 ? 'Phase 2: Core Tools' : 'Phase 3: Practice'
      };
    });

    const totalMilestones = enrichedMilestones.length;
    const readinessScore = totalMilestones > 0
      ? Math.round((completedCount / totalMilestones) * 100)
      : 0;

    return res.status(200).json({
      success: true,
      career,
      total_milestones: totalMilestones,
      completed_count: completedCount,
      readiness_score: readinessScore,
      milestones: enrichedMilestones
    });
  } catch (err) {
    console.error('Roadmap error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch roadmap' });
  }
});

// ====================================================================
// 3.5. MILESTONE MINI QUIZ VERIFICATION ENDPOINTS
// ====================================================================

// GET /api/milestones/:id/questions (Student / Guest view: excludes correct_option)
app.get('/api/milestones/:id/questions', optionalAuth, async (req, res) => {
  try {
    const milestoneId = parseInt(req.params.id, 10);
    const [questions] = await db.query(
      'SELECT id, milestone_id, question_text, option_a, option_b, option_c, option_d FROM milestone_questions WHERE milestone_id = ? ORDER BY id ASC',
      [milestoneId]
    );

    let hasPassed = false;
    if (req.user) {
      const [attempts] = await db.query(
        'SELECT id, score, total FROM milestone_quiz_attempts WHERE user_id = ? AND milestone_id = ? AND passed = 1 ORDER BY id DESC LIMIT 1',
        [req.user.id, milestoneId]
      );
      hasPassed = attempts && attempts.length > 0;
    }

    return res.status(200).json({
      success: true,
      milestoneId,
      total: questions.length,
      has_passed: hasPassed,
      questions
    });
  } catch (err) {
    console.error('Milestone questions error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch milestone questions' });
  }
});

// POST /api/milestones/:id/quiz (Evaluate answers, record attempt, require score >= 2 of 3)
app.post('/api/milestones/:id/quiz', authenticateToken, async (req, res) => {
  try {
    const milestoneId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const { answers } = req.body;

    if (!answers) {
      return res.status(400).json({ success: false, error: 'Answers payload is required' });
    }

    const [questions] = await db.query(
      'SELECT id, correct_option FROM milestone_questions WHERE milestone_id = ? ORDER BY id ASC',
      [milestoneId]
    );

    if (!questions || questions.length === 0) {
      return res.status(404).json({ success: false, error: 'No verification questions configured for this milestone' });
    }

    let score = 0;
    const total = questions.length;

    questions.forEach((q, idx) => {
      let userAns = null;
      if (Array.isArray(answers)) {
        userAns = answers[idx];
      } else if (typeof answers === 'object') {
        userAns = answers[q.id] || answers[String(q.id)] || answers[idx];
      }

      if (userAns && String(userAns).trim().toLowerCase() === String(q.correct_option).trim().toLowerCase()) {
        score++;
      }
    });

    // Pass mark is 2 out of 3 (or at least 66%)
    const passed = score >= Math.min(2, total);

    // Save attempt record to database
    await db.query(
      'INSERT INTO milestone_quiz_attempts (user_id, milestone_id, score, total, passed) VALUES (?, ?, ?, ?, ?)',
      [userId, milestoneId, score, total, passed]
    );

    if (passed) {
      const correctAnswers = questions.map(q => q.correct_option);
      return res.status(200).json({
        success: true,
        milestoneId,
        score,
        total,
        passed: true,
        correctAnswers,
        message: `Passed! You scored ${score}/${total}. You can now complete this milestone.`
      });
    } else {
      // Strictly do NOT reveal correct answers on failed attempt
      return res.status(200).json({
        success: true,
        milestoneId,
        score,
        total,
        passed: false,
        message: `You scored ${score}/${total}. At least 2/${total} is required to pass. Please review the learning resource and try again.`
      });
    }
  } catch (err) {
    console.error('Milestone quiz error:', err);
    return res.status(500).json({ success: false, error: 'Failed to evaluate milestone quiz' });
  }
});

// ====================================================================
// 4. USER PROGRESS, STREAK & DASHBOARD
// ====================================================================

// POST /api/user/progress (Toggle / Mark milestone completed - requires passed quiz attempt)
app.post('/api/user/progress', authenticateToken, async (req, res) => {
  try {
    const { milestoneId, status = 'completed', proof_note = null } = req.body;
    if (!milestoneId) {
      return res.status(400).json({ success: false, error: 'milestoneId is required' });
    }

    const userId = req.user.id;
    const mId = parseInt(milestoneId, 10);

    // Verify milestone exists
    const [milestones] = await db.query('SELECT career_id, title FROM milestones WHERE id = ?', [mId]);
    if (!milestones || milestones.length === 0) {
      return res.status(404).json({ success: false, error: 'Milestone not found' });
    }
    const careerId = milestones[0].career_id;

    const newStatus = status === 'pending' ? 'pending' : 'completed';

    // Verify quiz pass requirement when marking completed
    if (newStatus === 'completed') {
      const [attempts] = await db.query(
        'SELECT id, score, total FROM milestone_quiz_attempts WHERE user_id = ? AND milestone_id = ? AND passed = 1 ORDER BY id DESC LIMIT 1',
        [userId, mId]
      );

      if (!attempts || attempts.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Pass the mini quiz to complete this step'
        });
      }
    }

    // Check existing progress
    const [existing] = await db.query(
      'SELECT id, status, proof_note FROM user_milestone_progress WHERE user_id = ? AND milestone_id = ?',
      [userId, mId]
    );

    const noteToSave = proof_note !== undefined ? proof_note : (existing && existing[0] ? existing[0].proof_note : null);

    if (existing && existing.length > 0) {
      await db.query(
        'UPDATE user_milestone_progress SET status = ?, proof_note = ?, completed_at = CURRENT_TIMESTAMP WHERE user_id = ? AND milestone_id = ?',
        [newStatus, noteToSave, userId, mId]
      );
    } else {
      await db.query(
        'INSERT INTO user_milestone_progress (user_id, milestone_id, status, proof_note) VALUES (?, ?, ?, ?)',
        [userId, mId, newStatus, noteToSave]
      );
    }

    // Trigger streak update
    const streakResult = await db.updateStreak(userId);

    // Calculate new readiness score for this career
    const [allCareerMilestones] = await db.query('SELECT id FROM milestones WHERE career_id = ?', [careerId]);
    const [completedRows] = await db.query(
      `SELECT p.milestone_id FROM user_milestone_progress p
       JOIN milestones m ON p.milestone_id = m.id
       WHERE p.user_id = ? AND m.career_id = ? AND p.status = 'completed'`,
      [userId, careerId]
    );

    const total = allCareerMilestones.length;
    const completed = completedRows.length;
    const readiness_score = total > 0 ? Math.round((completed / total) * 100) : 0;

    return res.status(200).json({
      success: true,
      milestoneId: mId,
      status: newStatus,
      proof_note: noteToSave,
      completed_count: completed,
      total_milestones: total,
      readiness_score,
      streak: streakResult,
      message: newStatus === 'completed' ? 'Step marked as completed! Readiness score updated.' : 'Step marked as pending.'
    });
  } catch (err) {
    console.error('Progress error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update milestone progress' });
  }
});

// GET /api/user/streak
app.get('/api/user/streak', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM daily_streaks WHERE user_id = ?', [req.user.id]);
    const todayStr = new Date().toISOString().split('T')[0];

    if (!rows || rows.length === 0) {
      return res.status(200).json({
        success: true,
        streak_count: 0,
        last_active_date: null,
        can_check_in_today: true
      });
    }

    const streak = rows[0];
    let lastDateStr = '';
    if (streak.last_active_date instanceof Date) {
      lastDateStr = streak.last_active_date.toISOString().split('T')[0];
    } else if (typeof streak.last_active_date === 'string') {
      lastDateStr = streak.last_active_date.split('T')[0];
    }

    const can_check_in_today = lastDateStr !== todayStr;

    return res.status(200).json({
      success: true,
      streak_count: streak.streak_count,
      last_active_date: lastDateStr,
      can_check_in_today
    });
  } catch (err) {
    console.error('Streak fetch error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch streak' });
  }
});

// POST /api/user/checkin (Pressing "I practised today" button)
app.post('/api/user/checkin', authenticateToken, async (req, res) => {
  try {
    const streakResult = await db.updateStreak(req.user.id);
    return res.status(200).json({
      success: true,
      ...streakResult
    });
  } catch (err) {
    console.error('Checkin error:', err);
    return res.status(500).json({ success: false, error: 'Failed to record daily practice' });
  }
});

// PUT /api/user/target (Set target career path)
app.put('/api/user/target', authenticateToken, async (req, res) => {
  try {
    const { careerId } = req.body;
    if (!careerId) {
      return res.status(400).json({ success: false, error: 'careerId is required' });
    }

    const cId = parseInt(careerId, 10);
    const [careers] = await db.query('SELECT title FROM career_paths WHERE id = ?', [cId]);
    if (!careers || careers.length === 0) {
      return res.status(404).json({ success: false, error: 'Career path not found' });
    }

    await db.query('UPDATE users SET target_career_id = ? WHERE id = ?', [cId, req.user.id]);

    return res.status(200).json({
      success: true,
      target_career_id: cId,
      career_title: careers[0].title,
      message: `Target career set to "${careers[0].title}"`
    });
  } catch (err) {
    console.error('Target error:', err);
    return res.status(500).json({ success: false, error: 'Failed to set target career' });
  }
});

// GET /api/user/dashboard
app.get('/api/user/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user details
    const [userRows] = await db.query('SELECT id, name, email, role, target_career_id FROM users WHERE id = ?', [userId]);
    if (!userRows || userRows.length === 0) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }
    const user = userRows[0];

    // Fetch target career (or default to 1)
    const careerId = user.target_career_id || 1;
    const [careerRows] = await db.query('SELECT * FROM career_paths WHERE id = ?', [careerId]);
    const target_career = careerRows && careerRows.length > 0 ? careerRows[0] : null;

    // Calculate readiness score
    const [milestones] = await db.query('SELECT id, title, phase_number, resource_url FROM milestones WHERE career_id = ? ORDER BY phase_number ASC, id ASC', [careerId]);
    const [completedRows] = await db.query(
      `SELECT milestone_id FROM user_milestone_progress WHERE user_id = ? AND status = 'completed'`,
      [userId]
    );
    const completedSet = new Set((completedRows || []).map(r => r.milestone_id));

    let completedCount = 0;
    let next_pending_step = null;

    milestones.forEach(m => {
      if (completedSet.has(m.id)) {
        completedCount++;
      } else if (!next_pending_step) {
        next_pending_step = m;
      }
    });

    const totalMilestones = milestones.length;
    const readiness_score = totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;

    // Fetch streak
    const [streakRows] = await db.query('SELECT streak_count, last_active_date FROM daily_streaks WHERE user_id = ?', [userId]);
    const streak = streakRows && streakRows.length > 0 ? streakRows[0] : { streak_count: 1, last_active_date: null };

    const todayStr = new Date().toISOString().split('T')[0];
    let lastDateStr = '';
    if (streak.last_active_date instanceof Date) {
      lastDateStr = streak.last_active_date.toISOString().split('T')[0];
    } else if (typeof streak.last_active_date === 'string') {
      lastDateStr = streak.last_active_date.split('T')[0];
    }

    return res.status(200).json({
      success: true,
      user,
      target_career,
      total_milestones: totalMilestones,
      completed_count: completedCount,
      readiness_score,
      next_pending_step,
      streak: {
        streak_count: streak.streak_count,
        last_active_date: lastDateStr,
        can_check_in_today: lastDateStr !== todayStr
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load student dashboard' });
  }
});

// ====================================================================
// 5. SKILL GAP ANALYZER ENDPOINTS
// ====================================================================

// GET /api/skill-gap/:careerId
app.get('/api/skill-gap/:careerId', optionalAuth, async (req, res) => {
  try {
    const careerId = parseInt(req.params.careerId, 10);
    if (isNaN(careerId)) {
      return res.status(400).json({ success: false, error: 'Valid careerId required' });
    }

    const [skills] = await db.query(
      'SELECT id, career_id, skill_name, required_level FROM career_skills WHERE career_id = ? ORDER BY id ASC',
      [careerId]
    );

    // Fetch user ratings if authenticated
    const ratingMap = {};
    if (req.user) {
      const [ratings] = await db.query(
        'SELECT career_skill_id, rating FROM user_skill_ratings WHERE user_id = ?',
        [req.user.id]
      );
      if (ratings) {
        ratings.forEach(r => {
          ratingMap[r.career_skill_id] = r.rating;
        });
      }
    }

    let totalPossible = 0;
    let totalAchieved = 0;

    const enrichedSkills = skills.map(s => {
      const userRating = ratingMap[s.id] || 0; // 0 if unrated
      const reqLevel = s.required_level || 5;

      totalPossible += reqLevel;
      totalAchieved += Math.min(reqLevel, userRating);

      // Gap % = ((required - current) / required) * 100
      const gapPercentage = userRating >= reqLevel
        ? 0
        : Math.round(((reqLevel - userRating) / reqLevel) * 100);

      const masteryPercentage = Math.min(100, Math.round((userRating / reqLevel) * 100));

      return {
        id: s.id,
        skill_name: s.skill_name,
        required_level: reqLevel,
        user_rating: userRating,
        gap_percentage: gapPercentage,
        mastery_percentage: masteryPercentage
      };
    });

    const overallReadiness = totalPossible > 0 ? Math.round((totalAchieved / totalPossible) * 100) : 0;

    return res.status(200).json({
      success: true,
      career_id: careerId,
      overall_readiness: overallReadiness,
      skills: enrichedSkills
    });
  } catch (err) {
    console.error('Skill gap error:', err);
    return res.status(500).json({ success: false, error: 'Failed to calculate skill gap' });
  }
});

// POST /api/user/skills (Rate own skill 1-5)
app.post('/api/user/skills', authenticateToken, async (req, res) => {
  try {
    const { career_skill_id, rating, ratings } = req.body;
    const userId = req.user.id;

    const ratingsList = [];
    if (Array.isArray(ratings)) {
      ratingsList.push(...ratings);
    } else if (career_skill_id && typeof rating !== 'undefined') {
      ratingsList.push({ career_skill_id, rating });
    } else {
      return res.status(400).json({ success: false, error: 'Provide career_skill_id and rating (1-5)' });
    }

    for (const item of ratingsList) {
      const csId = parseInt(item.career_skill_id, 10);
      const r = Math.min(5, Math.max(1, parseInt(item.rating, 10)));

      const [existing] = await db.query(
        'SELECT id FROM user_skill_ratings WHERE user_id = ? AND career_skill_id = ?',
        [userId, csId]
      );

      if (existing && existing.length > 0) {
        await db.query(
          'UPDATE user_skill_ratings SET rating = ? WHERE user_id = ? AND career_skill_id = ?',
          [r, userId, csId]
        );
      } else {
        await db.query(
          'INSERT INTO user_skill_ratings (user_id, career_skill_id, rating) VALUES (?, ?, ?)',
          [userId, csId, r]
        );
      }
    }

    // Trigger streak update
    const streakResult = await db.updateStreak(userId);

    return res.status(200).json({
      success: true,
      streak: streakResult,
      message: 'Skill ratings saved! Your skill gap chart has updated.'
    });
  } catch (err) {
    console.error('Skills rating error:', err);
    return res.status(500).json({ success: false, error: 'Failed to save skill rating' });
  }
});

// ====================================================================
// 6. ADMIN PANEL CRUD (CAREERS & MILESTONES)
// ====================================================================

// POST /api/admin/careers
app.post('/api/admin/careers', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const { title, category, coding_level, min_salary, max_salary, demand_tag, description, daily_work, source_note, salary_source, last_verified } = req.body;

    if (!title || !category || !coding_level) {
      return res.status(400).json({ success: false, error: 'Title, category, and coding_level are required' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const [result] = await db.query(
      `INSERT INTO career_paths (title, category, coding_level, min_salary, max_salary, demand_tag, description, daily_work, source_note, salary_source, last_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        category,
        coding_level,
        parseFloat(min_salary) || 5.0,
        parseFloat(max_salary) || 15.0,
        demand_tag || 'Growing',
        description || '',
        daily_work || '',
        source_note || 'Figures are approximate entry-level estimates for freshers.',
        salary_source || 'AmbitionBox / Industry Fresher Benchmark',
        last_verified || todayStr
      ]
    );

    return res.status(201).json({
      success: true,
      careerId: result.insertId,
      message: `Career "${title}" successfully created.`
    });
  } catch (err) {
    console.error('Admin career create error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create career path' });
  }
});

// PUT /api/admin/careers/:id
app.put('/api/admin/careers/:id', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const careerId = parseInt(req.params.id, 10);
    const { title, category, coding_level, min_salary, max_salary, demand_tag, description, daily_work, source_note, salary_source, last_verified } = req.body;

    const [existing] = await db.query('SELECT id FROM career_paths WHERE id = ?', [careerId]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Career not found' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    await db.query(
      `UPDATE career_paths SET title = ?, category = ?, coding_level = ?, min_salary = ?, max_salary = ?, demand_tag = ?, description = ?, daily_work = ?, source_note = ?, salary_source = ?, last_verified = ?
       WHERE id = ?`,
      [
        title,
        category,
        coding_level,
        parseFloat(min_salary) || 5.0,
        parseFloat(max_salary) || 15.0,
        demand_tag,
        description,
        daily_work,
        source_note,
        salary_source || 'AmbitionBox / Industry Fresher Benchmark',
        last_verified || todayStr,
        careerId
      ]
    );

    return res.status(200).json({ success: true, message: `Career #${careerId} updated successfully.` });
  } catch (err) {
    console.error('Admin career update error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update career path' });
  }
});

// DELETE /api/admin/careers/:id
app.delete('/api/admin/careers/:id', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const careerId = parseInt(req.params.id, 10);
    const [result] = await db.query('DELETE FROM career_paths WHERE id = ?', [careerId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Career not found' });
    }
    return res.status(200).json({ success: true, message: `Career #${careerId} and associated milestones deleted.` });
  } catch (err) {
    console.error('Admin career delete error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete career' });
  }
});

// POST /api/admin/milestones
app.post('/api/admin/milestones', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const { career_id, phase_number, title, resource_url } = req.body;
    if (!career_id || !phase_number || !title || !resource_url) {
      return res.status(400).json({ success: false, error: 'career_id, phase_number, title, and resource_url are required' });
    }

    const [result] = await db.query(
      'INSERT INTO milestones (career_id, phase_number, title, resource_url) VALUES (?, ?, ?, ?)',
      [parseInt(career_id, 10), parseInt(phase_number, 10), title.trim(), resource_url.trim()]
    );

    return res.status(201).json({
      success: true,
      milestoneId: result.insertId,
      message: 'Roadmap milestone created successfully.'
    });
  } catch (err) {
    console.error('Admin milestone create error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create roadmap milestone' });
  }
});

// PUT /api/admin/milestones/:id
app.put('/api/admin/milestones/:id', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const milestoneId = parseInt(req.params.id, 10);
    const { career_id, phase_number, title, resource_url } = req.body;

    const [result] = await db.query(
      'UPDATE milestones SET career_id = ?, phase_number = ?, title = ?, resource_url = ? WHERE id = ?',
      [parseInt(career_id, 10), parseInt(phase_number, 10), title.trim(), resource_url.trim(), milestoneId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Milestone not found' });
    }

    return res.status(200).json({ success: true, message: `Milestone #${milestoneId} updated successfully.` });
  } catch (err) {
    console.error('Admin milestone update error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update milestone' });
  }
});

// DELETE /api/admin/milestones/:id
app.delete('/api/admin/milestones/:id', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const milestoneId = parseInt(req.params.id, 10);
    const [result] = await db.query('DELETE FROM milestones WHERE id = ?', [milestoneId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Milestone not found' });
    }
    return res.status(200).json({ success: true, message: `Milestone #${milestoneId} deleted.` });
  } catch (err) {
    console.error('Admin milestone delete error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete milestone' });
  }
});

// GET /api/admin/milestones/:id/questions (Admin view: includes correct_option)
app.get('/api/admin/milestones/:id/questions', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const milestoneId = parseInt(req.params.id, 10);
    const [questions] = await db.query(
      'SELECT id, milestone_id, question_text, option_a, option_b, option_c, option_d, correct_option FROM milestone_questions WHERE milestone_id = ? ORDER BY id ASC',
      [milestoneId]
    );
    return res.status(200).json({ success: true, count: questions.length, questions });
  } catch (err) {
    console.error('Admin get questions error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch milestone questions' });
  }
});

// POST /api/admin/milestones/:id/questions (Create question for milestone)
app.post('/api/admin/milestones/:id/questions', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const milestoneId = parseInt(req.params.id, 10);
    const { question_text, option_a, option_b, option_c, option_d, correct_option } = req.body;

    if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_option) {
      return res.status(400).json({ success: false, error: 'All question fields and correct_option (a/b/c/d) are required' });
    }

    const cleanAns = String(correct_option).trim().toLowerCase();
    if (!['a', 'b', 'c', 'd'].includes(cleanAns)) {
      return res.status(400).json({ success: false, error: 'correct_option must be a, b, c, or d' });
    }

    const [result] = await db.query(
      `INSERT INTO milestone_questions (milestone_id, question_text, option_a, option_b, option_c, option_d, correct_option)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [milestoneId, question_text.trim(), option_a.trim(), option_b.trim(), option_c.trim(), option_d.trim(), cleanAns]
    );

    return res.status(201).json({
      success: true,
      questionId: result.insertId,
      message: 'Question added successfully.'
    });
  } catch (err) {
    console.error('Admin create question error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create question' });
  }
});

// PUT /api/admin/questions/:id (Update question)
app.put('/api/admin/questions/:id', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const questionId = parseInt(req.params.id, 10);
    const { question_text, option_a, option_b, option_c, option_d, correct_option } = req.body;

    const cleanAns = String(correct_option).trim().toLowerCase();
    if (!['a', 'b', 'c', 'd'].includes(cleanAns)) {
      return res.status(400).json({ success: false, error: 'correct_option must be a, b, c, or d' });
    }

    const [result] = await db.query(
      `UPDATE milestone_questions SET question_text = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_option = ?
       WHERE id = ?`,
      [question_text.trim(), option_a.trim(), option_b.trim(), option_c.trim(), option_d.trim(), cleanAns, questionId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }

    return res.status(200).json({ success: true, message: `Question #${questionId} updated successfully.` });
  } catch (err) {
    console.error('Admin update question error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update question' });
  }
});

// DELETE /api/admin/questions/:id (Delete question)
app.delete('/api/admin/questions/:id', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const questionId = parseInt(req.params.id, 10);
    const [result] = await db.query('DELETE FROM milestone_questions WHERE id = ?', [questionId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }
    return res.status(200).json({ success: true, message: `Question #${questionId} deleted.` });
  } catch (err) {
    console.error('Admin delete question error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete question' });
  }
});

// ====================================================================
// 7. DIAGNOSTICS & HEALTH CHECK
// ====================================================================

app.get('/api/health', (req, res) => {
  const dbStatus = db.getDatabaseStatus();
  return res.status(200).json({
    ok: true,
    status: 'healthy',
    project: 'PathFinder - B.Tech Final Project API',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// 404 Catch-All
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[EXPRESS ERROR]:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Start Server
let server = null;
if (process.env.NODE_ENV !== 'test' && !process.env.PORT_TEST && process.argv[1] && process.argv[1].endsWith('server.js')) {
  server = app.listen(PORT, () => {
    console.log('=================================================================');
    console.log(`🚀 PathFinder Backend running on http://localhost:${PORT}`);
    console.log(`📡 Health Check:  http://localhost:${PORT}/api/health`);
    console.log(`📚 Quiz Engine:   http://localhost:${PORT}/api/quiz`);
    console.log(`💼 Careers API:   http://localhost:${PORT}/api/careers`);
    console.log('=================================================================');
  });
}

export { server };
export default app;
