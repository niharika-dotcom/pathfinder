import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function initDatabase() {
  console.log('--------------------------------------------------');
  console.log('🚀 PathFinder - Database Initialization & Seed Runner');
  console.log('--------------------------------------------------');

  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT, 10) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'pathfinder_db';

  console.log(`Connecting to MySQL server at ${host}:${port} as '${user}'...`);

  let connection;
  try {
    // Connect without specifying database to allow CREATE DATABASE
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });
    console.log('✅ Connection to MySQL server successful.');

    const schemaPath = path.resolve(__dirname, '../../schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log(`Reading SQL script from: ${schemaPath}`);
    console.log('Executing schema and seeding default records...');

    await connection.query(schemaSql);
    console.log('✅ Schema executed successfully!');

    // Verify seeded counts
    await connection.query(`USE \`${database}\``);
    const [roles] = await connection.query('SELECT COUNT(*) AS count FROM career_roles');
    const [milestones] = await connection.query('SELECT COUNT(*) AS count FROM milestones');
    const [users] = await connection.query('SELECT COUNT(*) AS count FROM users');

    console.log('\n📊 Seeding Verification Summary:');
    console.log(` - Career Roles: ${roles[0].count} paths`);
    console.log(` - Milestones:   ${milestones[0].count} curriculum steps`);
    console.log(` - Demo Users:   ${users[0].count} students enrolled`);
    console.log('\n✨ Database is fully initialized and production ready!');
  } catch (err) {
    console.error('\n❌ Database initialization failed:');
    console.error(err.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Verify your MySQL server (MySQL 8 / XAMPP / MariaDB / Docker) is running on port 3306.');
    console.log('2. Check backend/.env credentials: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD.');
    console.log('3. If using root without password, ensure DB_PASSWORD is empty in .env.\n');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
