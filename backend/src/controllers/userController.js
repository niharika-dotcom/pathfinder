import db from '../config/db.js';

/**
 * POST /api/users/login-or-register
 * Simple student onboarding & profile fetch with chosen target role
 */
export async function loginOrRegister(req, res, next) {
  try {
    const { name, email, target_role_id } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name && name.trim() ? name.trim() : cleanEmail.split('@')[0];
    const initialRoleId = target_role_id ? parseInt(target_role_id, 10) : 1;

    // Look up user
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [cleanEmail]);
    let user;

    if (existingUsers && existingUsers.length > 0) {
      user = existingUsers[0];
      // Update target role if user explicitly selected a new one during login
      if (target_role_id && parseInt(target_role_id, 10) !== user.target_role_id) {
        await db.query('UPDATE users SET target_role_id = ? WHERE id = ?', [initialRoleId, user.id]);
        user.target_role_id = initialRoleId;
      }
    } else {
      // Create new user with selected target career
      const [insertResult] = await db.query(
        'INSERT INTO users (name, email, target_role_id) VALUES (?, ?, ?)',
        [cleanName, cleanEmail, initialRoleId]
      );
      const newUserId = insertResult.insertId;

      // Initialize daily streak
      const today = new Date().toISOString().split('T')[0];
      await db.query(
        'INSERT INTO daily_streaks (user_id, current_streak, last_active_date) VALUES (?, ?, ?)',
        [newUserId, 1, today]
      );

      const [createdUsers] = await db.query('SELECT * FROM users WHERE id = ?', [newUserId]);
      user = createdUsers[0];
    }

    // Fetch user's current streak info
    const [streakRows] = await db.query('SELECT * FROM daily_streaks WHERE user_id = ?', [user.id]);
    const streak = streakRows && streakRows.length > 0 ? streakRows[0] : { current_streak: 1, last_active_date: null };

    const todayStr = new Date().toISOString().split('T')[0];
    const canCheckInToday = !streak.last_active_date || streak.last_active_date !== todayStr;

    // Fetch target role details if assigned
    let targetRole = null;
    if (user.target_role_id) {
      const [roleRows] = await db.query('SELECT * FROM career_roles WHERE id = ?', [user.target_role_id]);
      if (roleRows && roleRows.length > 0) {
        targetRole = roleRows[0];
      }
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        target_role_id: user.target_role_id
      },
      targetRole,
      streak: {
        current_streak: streak.current_streak,
        last_active_date: streak.last_active_date,
        canCheckInToday
      },
      message: existingUsers.length > 0 ? `Welcome back, ${user.name}!` : `Welcome to PathFinder, ${user.name}!`
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/users/target-role
 * Set user's chosen target role
 */
export async function setTargetRole(req, res, next) {
  try {
    const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      return res.status(400).json({ success: false, error: 'userId and roleId are required' });
    }

    await db.query('UPDATE users SET target_role_id = ? WHERE id = ?', [parseInt(roleId, 10), parseInt(userId, 10)]);

    const [roleRows] = await db.query('SELECT * FROM career_roles WHERE id = ?', [parseInt(roleId, 10)]);
    const targetRole = roleRows && roleRows.length > 0 ? roleRows[0] : null;

    return res.status(200).json({
      success: true,
      target_role_id: parseInt(roleId, 10),
      targetRole,
      message: `Target role updated to ${targetRole?.title || 'selected role'}`
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/user/:id/dashboard
 * Return student summary: readiness %, target role, completed milestones count, streak, latest practice score
 */
export async function getUserDashboard(req, res, next) {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, error: 'Valid user ID required' });
    }

    const [userRows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (!userRows || userRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Student profile not found' });
    }
    const user = userRows[0];

    // Determine target role (fallback to Role 1 if null)
    const effectiveRoleId = user.target_role_id || 1;
    const [roleRows] = await db.query('SELECT * FROM career_roles WHERE id = ?', [effectiveRoleId]);
    const targetRole = roleRows && roleRows.length > 0 ? roleRows[0] : null;

    // Fetch milestones for target role
    const [milestones] = await db.query('SELECT * FROM milestones WHERE role_id = ?', [effectiveRoleId]);
    const totalMilestonesCount = milestones.length;

    // Fetch completed milestones for user
    const [progressRows] = await db.query('SELECT * FROM user_milestone_progress WHERE user_id = ?', [userId]);
    const completedMilestoneIds = new Set(
      progressRows.filter(p => Boolean(p.is_completed)).map(p => p.milestone_id)
    );

    const completedInTargetRole = milestones.filter(m => completedMilestoneIds.has(m.id)).length;
    const readinessScore = totalMilestonesCount > 0
      ? Math.round((completedInTargetRole / totalMilestonesCount) * 100)
      : 0;

    // Streak info
    const [streakRows] = await db.query('SELECT * FROM daily_streaks WHERE user_id = ?', [userId]);
    const streak = streakRows && streakRows.length > 0
      ? streakRows[0]
      : { current_streak: 1, last_active_date: null };

    const todayStr = new Date().toISOString().split('T')[0];
    const canCheckInToday = !streak.last_active_date || streak.last_active_date !== todayStr;

    // Total completed across all categories
    const totalCompletedAcrossPlatform = progressRows.filter(p => Boolean(p.is_completed)).length;

    // Practice Arena history
    const [scoreRows] = await db.query(
      'SELECT score, total, percentage, completed_at FROM user_practice_scores WHERE user_id = ? ORDER BY completed_at DESC LIMIT 1',
      [userId]
    );
    const latestPracticeScore = scoreRows && scoreRows.length > 0 ? scoreRows[0] : null;

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        target_role_id: user.target_role_id
      },
      targetRole,
      readinessScore,
      completedMilestonesCount: completedInTargetRole,
      totalMilestonesCount,
      totalCompletedAcrossPlatform,
      latestPracticeScore,
      streak: {
        current_streak: streak.current_streak,
        last_active_date: streak.last_active_date,
        canCheckInToday
      }
    });
  } catch (err) {
    next(err);
  }
}
