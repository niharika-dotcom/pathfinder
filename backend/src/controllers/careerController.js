import db from '../config/db.js';

/**
 * GET /api/careers
 * Fetch all career roles, optionally filtered by category
 */
export async function getCareers(req, res, next) {
  try {
    const { category } = req.query;

    let sql = 'SELECT * FROM career_roles';
    const params = [];

    if (category && category !== 'all' && category !== 'All') {
      const lower = category.toLowerCase();
      let matchedCategory = null;

      if (lower.includes('coding') && !lower.includes('non')) {
        matchedCategory = 'Tech-Coding';
      } else if (lower.includes('non') || lower.includes('product') || lower.includes('qa')) {
        matchedCategory = 'Tech-NonCoding';
      } else if (lower.includes('govt') || lower.includes('civil') || lower.includes('upsc')) {
        matchedCategory = 'CivilServices-Govt';
      } else if (lower.includes('analytic') || lower.includes('data')) {
        matchedCategory = 'Analytics';
      } else {
        const validCategories = ['Tech-Coding', 'Tech-NonCoding', 'CivilServices-Govt', 'Analytics'];
        const found = validCategories.find(c => c.toLowerCase() === lower);
        if (found) matchedCategory = found;
      }

      if (matchedCategory) {
        sql += ' WHERE category = ?';
        params.push(matchedCategory);
      }
    }

    const [roles] = await db.query(sql, params);

    // Fetch milestone counts for each role
    const [allMilestones] = await db.query('SELECT role_id, COUNT(*) AS count FROM milestones GROUP BY role_id', []);
    const countMap = {};
    if (Array.isArray(allMilestones)) {
      allMilestones.forEach(m => {
        countMap[m.role_id] = m.count;
      });
    }

    const formattedRoles = roles.map(role => ({
      ...role,
      milestone_count: countMap[role.id] || role.milestone_count || 5
    }));

    return res.status(200).json({
      success: true,
      count: formattedRoles.length,
      careers: formattedRoles
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/careers/:id/roadmaps?userId={id}
 * Fetch milestones for a role along with user completion status, phase names & content summaries
 */
export async function getCareerRoadmap(req, res, next) {
  try {
    const roleId = parseInt(req.params.id, 10);
    const userId = req.query.userId ? parseInt(req.query.userId, 10) : null;

    if (isNaN(roleId)) {
      return res.status(400).json({ success: false, error: 'Valid career role ID required' });
    }

    // Fetch career role details
    const [roleRows] = await db.query('SELECT * FROM career_roles WHERE id = ?', [roleId]);
    if (!roleRows || roleRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Career role not found' });
    }
    const role = roleRows[0];

    // Fetch milestones for this role
    const [milestones] = await db.query(
      'SELECT id, role_id, phase_num, phase_name, title, description, content_summary, resource_link, reading_time FROM milestones WHERE role_id = ? ORDER BY phase_num ASC, id ASC',
      [roleId]
    );

    // Fetch progress if userId provided
    let userProgressMap = {};
    if (userId) {
      const [progressRows] = await db.query('SELECT * FROM user_milestone_progress WHERE user_id = ?', [userId]);
      if (Array.isArray(progressRows)) {
        progressRows.forEach(p => {
          userProgressMap[p.milestone_id] = {
            is_completed: Boolean(p.is_completed),
            completed_at: p.completed_at
          };
        });
      }
    }

    let completedCount = 0;
    const enrichedMilestones = milestones.map(m => {
      const prog = userProgressMap[m.id];
      const isCompleted = prog ? Boolean(prog.is_completed) : false;
      if (isCompleted) completedCount++;

      return {
        id: m.id,
        role_id: m.role_id,
        phase_num: m.phase_num,
        phase_name: m.phase_name || `Phase ${m.phase_num}: Implementation`,
        title: m.title,
        description: m.description,
        content_summary: m.content_summary,
        resource_link: m.resource_link,
        reading_time: m.reading_time || '10 mins read',
        is_completed: isCompleted,
        completed_at: prog ? prog.completed_at : null
      };
    });

    const totalMilestones = enrichedMilestones.length;
    const readinessScore = totalMilestones > 0
      ? Math.round((completedCount / totalMilestones) * 100)
      : 0;

    return res.status(200).json({
      success: true,
      role,
      readinessScore,
      totalMilestones,
      completedCount,
      milestones: enrichedMilestones
    });
  } catch (err) {
    next(err);
  }
}
