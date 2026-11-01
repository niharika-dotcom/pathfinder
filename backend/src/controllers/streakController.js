import db from '../config/db.js';

/**
 * POST /api/streak/check-in
 * Update student daily streak based on today's calendar date
 * Body: { userId }
 */
export async function checkInStreak(req, res, next) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required in request body' });
    }

    const uId = parseInt(userId, 10);

    // Fetch existing streak record
    const [streakRows] = await db.query('SELECT * FROM daily_streaks WHERE user_id = ?', [uId]);

    const todayDate = new Date();
    const todayStr = todayDate.toISOString().split('T')[0];

    const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    if (!streakRows || streakRows.length === 0) {
      // First time check-in ever
      await db.query(
        'INSERT INTO daily_streaks (user_id, current_streak, last_active_date) VALUES (?, ?, ?)',
        [uId, 1, todayStr]
      );

      return res.status(200).json({
        success: true,
        current_streak: 1,
        last_active_date: todayStr,
        streakIncremented: true,
        canCheckInToday: false,
        message: '🔥 Welcome to Day 1 of your career streak! Habit formed.'
      });
    }

    const streak = streakRows[0];
    let lastDateStr = '';
    if (streak.last_active_date instanceof Date) {
      lastDateStr = streak.last_active_date.toISOString().split('T')[0];
    } else if (typeof streak.last_active_date === 'string') {
      lastDateStr = streak.last_active_date.split('T')[0];
    }

    // Case 1: Already checked in today
    if (lastDateStr === todayStr) {
      return res.status(200).json({
        success: true,
        current_streak: streak.current_streak,
        last_active_date: todayStr,
        streakIncremented: false,
        canCheckInToday: false,
        message: `🔥 You've already secured today's check-in! Current streak: ${streak.current_streak} days. Come back tomorrow!`
      });
    }

    let newStreak = 1;
    // Case 2: Consecutive day (checked in yesterday)
    if (lastDateStr === yesterdayStr) {
      newStreak = (streak.current_streak || 0) + 1;
    }
    // Case 3: Missed more than 1 day -> reset to 1
    else {
      newStreak = 1;
    }

    await db.query(
      'UPDATE daily_streaks SET current_streak = ?, last_active_date = ? WHERE user_id = ?',
      [newStreak, todayStr, uId]
    );

    return res.status(200).json({
      success: true,
      current_streak: newStreak,
      last_active_date: todayStr,
      streakIncremented: true,
      canCheckInToday: false,
      message: newStreak > 1
        ? `🔥 Boom! ${newStreak}-day streak unlocked! Consistency is your competitive advantage.`
        : `🔥 Day 1 streak activated! Let's build relentless momentum.`
    });
  } catch (err) {
    next(err);
  }
}
