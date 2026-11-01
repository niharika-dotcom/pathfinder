import db from '../config/db.js';

/**
 * GET /api/practice/:roleId?userId={id}
 * Fetch all practice questions for a career track along with user attempt history
 */
export async function getPracticeQuestions(req, res, next) {
  try {
    const roleId = parseInt(req.params.roleId, 10);
    const userId = req.query.userId ? parseInt(req.query.userId, 10) : null;

    if (isNaN(roleId)) {
      return res.status(400).json({ success: false, error: 'Valid role ID is required' });
    }

    const [questions] = await db.query(
      'SELECT id, role_id, topic, question, code_snippet, options, correct_index, explanation FROM practice_questions WHERE role_id = ? ORDER BY id ASC',
      [roleId]
    );

    // Parse options if stored as JSON string
    const formattedQuestions = (questions || []).map(q => ({
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
    }));

    let userScore = null;
    if (userId) {
      const [scores] = await db.query(
        'SELECT score, total, percentage, completed_at FROM user_practice_scores WHERE user_id = ? AND role_id = ? ORDER BY completed_at DESC',
        [userId, roleId]
      );

      if (scores && scores.length > 0) {
        const latest = scores[0];
        const best = scores.reduce((max, s) => (s.percentage > max ? s.percentage : max), 0);
        userScore = {
          latestScore: latest.score,
          total: latest.total,
          latestPercentage: latest.percentage,
          bestPercentage: best,
          attemptsCount: scores.length,
          lastAttemptedAt: latest.completed_at
        };
      }
    }

    return res.status(200).json({
      success: true,
      roleId,
      count: formattedQuestions.length,
      questions: formattedQuestions,
      userScore
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/practice/submit
 * Evaluate student quiz submission and persist attempt in MySQL
 * Body: { userId, roleId, answers: { [questionId]: selectedIndex } }
 */
export async function submitPracticeQuiz(req, res, next) {
  try {
    const { userId, roleId, answers } = req.body;

    if (!userId || !roleId || !answers) {
      return res.status(400).json({
        success: false,
        error: 'userId, roleId, and answers map are required'
      });
    }

    const uId = parseInt(userId, 10);
    const rId = parseInt(roleId, 10);

    // Fetch official questions with correct indexes
    const [questions] = await db.query(
      'SELECT id, topic, question, correct_index, explanation FROM practice_questions WHERE role_id = ?',
      [rId]
    );

    if (!questions || questions.length === 0) {
      return res.status(404).json({ success: false, error: 'No practice questions found for role' });
    }

    let score = 0;
    const total = questions.length;
    const results = [];

    questions.forEach(q => {
      // User answer can be provided as object { [q.id]: idx } or array
      let userChoice;
      if (Array.isArray(answers)) {
        const item = answers.find(a => a.questionId === q.id);
        userChoice = item ? item.selectedIndex : -1;
      } else {
        userChoice = typeof answers[q.id] !== 'undefined' ? parseInt(answers[q.id], 10) : -1;
      }

      const isCorrect = userChoice === q.correct_index;
      if (isCorrect) score++;

      results.push({
        questionId: q.id,
        topic: q.topic,
        question: q.question,
        userChoice,
        correctIndex: q.correct_index,
        isCorrect,
        explanation: q.explanation
      });
    });

    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    // Persist to user_practice_scores
    await db.query(
      'INSERT INTO user_practice_scores (user_id, role_id, score, total, percentage) VALUES (?, ?, ?, ?, ?)',
      [uId, rId, score, total, percentage]
    );

    let feedbackMessage = `You scored ${score}/${total} (${percentage}%).`;
    if (percentage >= 80) {
      feedbackMessage = `🔥 Exceptional! Mastered ${percentage}% of questions. Interview ready!`;
    } else if (percentage >= 50) {
      feedbackMessage = `👍 Solid effort! Scored ${percentage}%. Review the explanations below to close gaps.`;
    } else {
      feedbackMessage = `Keep practicing! Scored ${percentage}%. Use the concept summaries to review fundamentals.`;
    }

    return res.status(200).json({
      success: true,
      score,
      total,
      percentage,
      results,
      message: feedbackMessage
    });
  } catch (err) {
    next(err);
  }
}
