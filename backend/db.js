import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT, 10) || 3306;
const dbUser = process.env.DB_USER || 'root';
const dbPass = process.env.DB_PASS || process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'pathfinder_db';
const connectionLimit = parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10;

// Create MySQL connection pool - STRICT MYSQL ONLY, NO IN-MEMORY FALLBACK
export const pool = mysql.createPool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPass,
  database: dbName,
  waitForConnections: true,
  connectionLimit: connectionLimit,
  queueLimit: 0,
  connectTimeout: 5000,
  dateStrings: true
});

// Verify live MySQL connection immediately on startup
try {
  const connection = await pool.getConnection();
  console.log(`[Database] Successfully connected to MySQL database '${dbName}' on ${dbHost}:${dbPort}`);
  connection.release();
} catch (err) {
  console.error(`MySQL connection failed: ${err.message}. Check .env and make sure MySQL is running`);
  process.exit(1);
}

/**
 * Executes a parameterized SQL query via MySQL pool.
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<[Array, Array]>}
 */
export async function query(sql, params = []) {
  return pool.query(sql, params);
}

/**
 * Calculates and updates student daily streak adhering strictly to the Duolingo rule:
 * - same day = unchanged
 * - yesterday = +1
 * - older / missed = reset to 1
 *
 * @param {number} userId
 * @returns {Promise<{streak_count: number, last_active_date: string, is_new: boolean, message: string}>}
 */
export async function updateStreak(userId) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const [rows] = await query('SELECT * FROM daily_streaks WHERE user_id = ?', [userId]);

  if (!rows || rows.length === 0) {
    await query(
      'INSERT INTO daily_streaks (user_id, last_active_date, streak_count) VALUES (?, ?, 1)',
      [userId, todayStr]
    );
    return {
      streak_count: 1,
      last_active_date: todayStr,
      is_new: true,
      message: 'First day streak started! Build your placement consistency. 🔥'
    };
  }

  const streak = rows[0];
  let lastDateStr = '';
  if (streak.last_active_date instanceof Date) {
    lastDateStr = streak.last_active_date.toISOString().split('T')[0];
  } else if (typeof streak.last_active_date === 'string') {
    lastDateStr = streak.last_active_date.split('T')[0];
  }

  if (lastDateStr === todayStr) {
    return {
      streak_count: streak.streak_count,
      last_active_date: todayStr,
      is_new: false,
      message: `Streak already active for today (${streak.streak_count} days). Great dedication!`
    };
  }

  const lastDate = new Date(lastDateStr);
  const curDate = new Date(todayStr);
  const diffTime = curDate.getTime() - lastDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  let newStreak = 1;
  let message = '';

  if (diffDays === 1) {
    newStreak = streak.streak_count + 1;
    message = `🔥 Streak extended to ${newStreak} days! Relentless consistency.`;
  } else {
    newStreak = 1;
    message = `Streak reset to 1 day after a break. Let's restart your habit today!`;
  }

  await query(
    'UPDATE daily_streaks SET streak_count = ?, last_active_date = ? WHERE user_id = ?',
    [newStreak, todayStr, userId]
  );

  return {
    streak_count: newStreak,
    last_active_date: todayStr,
    is_new: true,
    message
  };
}

export function getDatabaseStatus() {
  return {
    isMysqlLive: true,
    dbHost,
    dbPort,
    dbName,
    engine: 'MySQL 8.0+/9.x Relational Engine'
  };
}

export default {
  pool,
  query,
  updateStreak,
  getDatabaseStatus
};
