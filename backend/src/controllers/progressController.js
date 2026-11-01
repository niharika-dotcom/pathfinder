import db from '../config/db.js';

/**
 * POST /api/progress/toggle
 * Toggle a milestone status: update user_milestone_progress and return updated readiness score percentage
 * Body: { userId, milestoneId, isCompleted (optional) }
 */
export async function toggleMilestoneProgress(req, res, next) {
  try {
    const { userId, milestoneId } = req.body;
    let { isCompleted } = req.body;

    if (!userId || !milestoneId) {
      return res.status(400).json({
        success: false,
        error: 'userId and milestoneId are required in request body'
      });
    }

    const uId = parseInt(userId, 10);
    const mId = parseInt(milestoneId, 10);

    // Verify milestone exists and get its role_id
    const [milestoneRows] = await db.query('SELECT * FROM milestones WHERE id = ?', [mId]);
    if (!milestoneRows || milestoneRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Milestone not found' });
    }
    const currentMilestone = milestoneRows[0];
    const roleId = currentMilestone.role_id;

    // Check existing progress record
    const [existingProgress] = await db.query(
      'SELECT * FROM user_milestone_progress WHERE user_id = ? AND milestone_id = ?',
      [uId, mId]
    );

    let nextStatus = false;
    if (typeof isCompleted === 'boolean') {
      nextStatus = isCompleted;
    } else if (existingProgress && existingProgress.length > 0) {
      nextStatus = !Boolean(existingProgress[0].is_completed);
    } else {
      nextStatus = true;
    }

    const completedAt = nextStatus ? new Date() : null;

    if (existingProgress && existingProgress.length > 0) {
      await db.query(
        'UPDATE user_milestone_progress SET is_completed = ?, completed_at = ? WHERE user_id = ? AND milestone_id = ?',
        [nextStatus ? 1 : 0, completedAt, uId, mId]
      );
    } else {
      await db.query(
        'INSERT INTO user_milestone_progress (user_id, milestone_id, is_completed, completed_at) VALUES (?, ?, ?, ?)',
        [uId, mId, nextStatus ? 1 : 0, completedAt]
      );
    }

    // Calculate updated readiness score for this role
    const [roleMilestones] = await db.query('SELECT id FROM milestones WHERE role_id = ?', [roleId]);
    const totalMilestones = roleMilestones.length;

    const [userRoleProgress] = await db.query(
      'SELECT p.milestone_id FROM user_milestone_progress p JOIN milestones m ON p.milestone_id = m.id WHERE p.user_id = ? AND m.role_id = ? AND p.is_completed = 1',
      [uId, roleId]
    );

    const completedCount = userRoleProgress.length;
    const readinessScore = totalMilestones > 0
      ? Math.round((completedCount / totalMilestones) * 100)
      : 0;

    return res.status(200).json({
      success: true,
      milestoneId: mId,
      roleId,
      is_completed: nextStatus,
      completed_at: completedAt,
      completedCount,
      totalMilestones,
      readinessScore,
      message: nextStatus
        ? `🎉 Milestone "${currentMilestone.title}" completed! Readiness boosted to ${readinessScore}%.`
        : `Milestone "${currentMilestone.title}" marked as in-progress.`
    });
  } catch (err) {
    next(err);
  }
}
