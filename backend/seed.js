import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

export async function runSeed(poolOrConnection = null) {
  console.log('----------------------------------------------------');
  console.log('🚀 Seeding PathFinder MySQL Database (Strict MySQL)...');
  console.log('----------------------------------------------------');

  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT, 10) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASS || process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'pathfinder_db';

  let conn = poolOrConnection;
  let shouldClose = false;

  try {
    if (!conn) {
      conn = await mysql.createConnection({
        host,
        port,
        user,
        password,
        multipleStatements: true
      });
      shouldClose = true;
    }

    // 1. Execute schema.sql (Drops and recreates all tables cleanly)
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await conn.query(schemaSql);
    await conn.query(`USE \`${database}\``);

    // 2. Seed 7 Careers with Salary Source and Last Verified Date
    const seedDate = '2026-11-01';
    const careers = [
      {
        id: 1,
        title: 'Data Analyst',
        category: 'tech',
        coding_level: 'some',
        min_salary: 5.50,
        max_salary: 14.00,
        demand_tag: 'Exploding Demand',
        description: 'Collect, clean, and analyze enterprise telemetry and business metrics to provide actionable leadership intelligence.',
        daily_work: 'Writing analytical SQL queries, designing Power BI/Tableau dashboards, Excel pivot models, and exploratory data scripts in Python.',
        source_note: 'Figures are approximate entry-level estimates for freshers across campus & off-campus drives.',
        salary_source: 'AmbitionBox / Naukri India Fresher Analyst Benchmark',
        last_verified: seedDate
      },
      {
        id: 2,
        title: 'Software Developer',
        category: 'tech',
        coding_level: 'heavy',
        min_salary: 7.50,
        max_salary: 24.00,
        demand_tag: 'Very High',
        description: 'Design, build, and maintain robust client-facing and server-side software systems using modern engineering frameworks.',
        daily_work: 'Developing RESTful APIs, writing frontend web interfaces, designing relational schemas, debugging code, and participating in code reviews.',
        source_note: 'Figures are approximate entry-level estimates for freshers across campus & off-campus drives.',
        salary_source: 'Glassdoor India / Levels.fyi Campus SDE Index',
        last_verified: seedDate
      },
      {
        id: 3,
        title: 'QA / Test Engineer',
        category: 'tech',
        coding_level: 'some',
        min_salary: 5.00,
        max_salary: 12.50,
        demand_tag: 'High Demand',
        description: 'Verify software quality, execute test suites, detect edge-case defects, and guarantee dependable production releases.',
        daily_work: 'Drafting test plans, manual API verification in Postman, automating regression scenarios with Cypress, and logging bug tickets in Jira.',
        source_note: 'Figures are approximate entry-level estimates for freshers across campus & off-campus drives.',
        salary_source: 'AmbitionBox / Naukri QA Automation Survey',
        last_verified: seedDate
      },
      {
        id: 4,
        title: 'Business / Product Analyst',
        category: 'non-tech',
        coding_level: 'none',
        min_salary: 6.00,
        max_salary: 15.00,
        demand_tag: 'High Demand',
        description: 'Bridge engineering teams with business stakeholders by translating market opportunities into actionable feature requirements.',
        daily_work: 'Writing Product Requirement Documents (PRDs), defining user stories, analyzing user funnel drop-offs, and competitive benchmarking.',
        source_note: 'Figures are approximate entry-level estimates for freshers across campus & off-campus drives.',
        salary_source: 'PayScale / LinkedIn Entry-Level APM Survey',
        last_verified: seedDate
      },
      {
        id: 5,
        title: 'UI/UX Designer',
        category: 'non-tech',
        coding_level: 'none',
        min_salary: 5.00,
        max_salary: 14.50,
        demand_tag: 'Growing Rapidly',
        description: 'Craft intuitive, accessible, and delightful digital user interfaces, design systems, and seamless user experiences.',
        daily_work: 'Building wireframes and prototypes in Figma, conducting user interviews, auditing usability, and handing off component specs to devs.',
        source_note: 'Figures are approximate entry-level estimates for freshers across campus & off-campus drives.',
        salary_source: 'Dribbble / Glassdoor Junior Product Designer Index',
        last_verified: seedDate
      },
      {
        id: 6,
        title: 'Cloud / DevOps Engineer',
        category: 'tech',
        coding_level: 'some',
        min_salary: 7.00,
        max_salary: 20.00,
        demand_tag: 'Crucial & Growing',
        description: 'Automate build pipelines, orchestrate cloud infrastructure, monitor uptime, and maintain reliable production deployments.',
        daily_work: 'Configuring Docker containers, managing Linux virtual instances on AWS, writing CI/CD GitHub Action workflows, and log inspection.',
        source_note: 'Figures are approximate entry-level estimates for freshers across campus & off-campus drives.',
        salary_source: 'AmbitionBox / Upwork Cloud Practitioner Fresher Index',
        last_verified: seedDate
      },
      {
        id: 7,
        title: 'Govt Exams (Group-2 / Bank PO)',
        category: 'govt',
        coding_level: 'none',
        min_salary: 6.00,
        max_salary: 16.00,
        demand_tag: 'Prestigious & Secure',
        description: 'Serve public governance and national financial systems with high job security, social prestige, and structured public benefits.',
        daily_work: 'Public administration, executive file governance, banking loan appraisals, regulatory compliance, and civic citizen services.',
        source_note: 'Figures are approximate entry-level estimates for freshers across campus & off-campus drives.',
        salary_source: 'IBPS & State Public Service Commission Gazette Pay Scales',
        last_verified: seedDate
      }
    ];

    for (const c of careers) {
      await conn.query(
        `INSERT INTO career_paths (id, title, category, coding_level, min_salary, max_salary, demand_tag, description, daily_work, source_note, salary_source, last_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.id, c.title, c.category, c.coding_level, c.min_salary, c.max_salary, c.demand_tag, c.description, c.daily_work, c.source_note, c.salary_source, c.last_verified]
      );
    }

    // 3. Seed Milestones (42 total: 6 per career across 3 phases)
    const milestones = [
      // 1. Data Analyst (IDs 1 - 6)
      { id: 1, career_id: 1, phase: 1, title: 'Excel Mastery: VLOOKUP, XLOOKUP, Pivot Tables & Data Normalization', url: 'https://www.w3schools.com/excel/' },
      { id: 2, career_id: 1, phase: 1, title: 'SQL Fundamentals: SELECT, WHERE, GROUP BY, and Multi-Table JOINS', url: 'https://www.w3schools.com/sql/' },
      { id: 3, career_id: 1, phase: 2, title: 'Advanced SQL: Window Functions (RANK, DENSE_RANK), CTEs & Aggregates', url: 'https://mode.com/sql-tutorial/' },
      { id: 4, career_id: 1, phase: 2, title: 'Business Intelligence: Power BI / Tableau Interactive Dashboard Architecture', url: 'https://learn.microsoft.com/en-us/power-bi/' },
      { id: 5, career_id: 1, phase: 3, title: 'Python for Analytics: Pandas DataFrames, NumPy & Seaborn Visualizations', url: 'https://www.kaggle.com/learn/python' },
      { id: 6, career_id: 1, phase: 3, title: 'Capstone Business Portfolio: Sales Churn Case Study & GitHub Report', url: 'https://www.youtube.com/results?search_query=data+analyst+portfolio+project' },

      // 2. Software Developer (IDs 7 - 12)
      { id: 7, career_id: 2, phase: 1, title: 'Core Computer Science: Data Structures, Complexity (Big-O) & Algorithms', url: 'https://www.geeksforgeeks.org/data-structures/' },
      { id: 8, career_id: 2, phase: 1, title: 'Modern JavaScript (ES6+): Closures, Event Loop, Promises & Async/Await', url: 'https://javascript.info/' },
      { id: 9, career_id: 2, phase: 2, title: 'Frontend SPAs: React Hooks (useState, useEffect), State Flow & Component Composition', url: 'https://react.dev/learn' },
      { id: 10, career_id: 2, phase: 2, title: 'Backend APIs: Node.js, Express Modular Routing, Middleware & JWT Auth', url: 'https://expressjs.com/' },
      { id: 11, career_id: 2, phase: 3, title: 'Relational MySQL Architecture: Foreign Keys, Normalization & Indexing', url: 'https://dev.mysql.com/doc/' },
      { id: 12, career_id: 2, phase: 3, title: 'Full Stack Deployment: CI/CD, Environment Secrets & Cloud Hosting', url: 'https://roadmap.sh/full-stack' },

      // 3. QA / Test Engineer (IDs 13 - 18)
      { id: 13, career_id: 3, phase: 1, title: 'Software Testing Fundamentals: STLC, Boundary Value Analysis & Equivalence Partitioning', url: 'https://www.guru99.com/software-testing.html' },
      { id: 14, career_id: 3, phase: 1, title: 'Agile & Defect Lifecycle: Writing Test Cases, Bug Reporting & Jira Workflows', url: 'https://www.atlassian.com/agile/software-development/testing' },
      { id: 15, career_id: 3, phase: 2, title: 'REST API Testing: Postman Request Collections, Status Assertions & Mocking', url: 'https://learning.postman.com/docs/introduction/overview/' },
      { id: 16, career_id: 3, phase: 2, title: 'Database Validation: SQL SELECT & JOINs to Verify Backend Data Integrity', url: 'https://www.w3schools.com/sql/' },
      { id: 17, career_id: 3, phase: 3, title: 'Automation Testing Kickstart: Cypress / Selenium Scripting for Web Flows', url: 'https://docs.cypress.io/guides/overview/why-cypress' },
      { id: 18, career_id: 3, phase: 3, title: 'Performance & Regression Testing: Newman CLI Pipeline Integration', url: 'https://www.youtube.com/results?search_query=api+testing+postman+tutorial' },

      // 4. Business / Product Analyst (IDs 19 - 24)
      { id: 19, career_id: 4, phase: 1, title: 'Business Analysis Fundamentals: Stakeholder Management & SDLC Processes', url: 'https://www.iiba.org/career-resources/what-is-business-analysis/' },
      { id: 20, career_id: 4, phase: 1, title: 'Excel Modeling: Scenario Analysis, Data Validation & Business Forecasting', url: 'https://www.w3schools.com/excel/' },
      { id: 21, career_id: 4, phase: 2, title: 'Requirement Engineering: Drafting PRDs, User Stories & Gherkin Acceptance Criteria', url: 'https://www.productplan.com/learn/product-management-guide/' },
      { id: 22, career_id: 4, phase: 2, title: 'Visual Wireframing & Flowcharts: Figma Diagrams, Lucidchart & User Journey Mapping', url: 'https://help.figma.com/hc/en-us' },
      { id: 23, career_id: 4, phase: 3, title: 'Product Metrics & Funnel Analysis: CAC, LTV, Retention & Mixpanel Telemetry', url: 'https://www.youtube.com/results?search_query=product+analyst+roadmap' },
      { id: 24, career_id: 4, phase: 3, title: 'Capstone Business Case Study: Problem Breakdown, Feature Prioritization & ROI Pitch', url: 'https://www.mindtheproduct.com/' },

      // 5. UI/UX Designer (IDs 25 - 30)
      { id: 25, career_id: 5, phase: 1, title: 'Design Fundamentals: Color Theory, Visual Hierarchy, Typography & Accessibility (WCAG)', url: 'https://lawsofux.com/' },
      { id: 26, career_id: 5, phase: 1, title: 'User Research & Personas: Empathy Mapping, User Journey & Information Architecture', url: 'https://www.nngroup.com/articles/' },
      { id: 27, career_id: 5, phase: 2, title: 'Figma Mastery: Auto-Layout, Component Variants, Design Tokens & Prototyping', url: 'https://help.figma.com/hc/en-us' },
      { id: 28, career_id: 5, phase: 2, title: 'Design Systems & Responsive Layouts: 8pt Grid System, Breakpoints & UI States', url: 'https://material.io/design' },
      { id: 29, career_id: 5, phase: 3, title: 'Usability Testing: Heuristic Evaluation, User Feedback Loops & Iterative Design', url: 'https://www.interaction-design.org/' },
      { id: 30, career_id: 5, phase: 3, title: 'Portfolio Curation: 2 Polished Case Studies with Problem, Iterations & Live Prototypes', url: 'https://www.behance.net/' },

      // 6. Cloud / DevOps Engineer (IDs 31 - 36)
      { id: 31, career_id: 6, phase: 1, title: 'Linux System Administration & Shell Scripting (Bash, Permissions, Systemd)', url: 'https://linuxjourney.com/' },
      { id: 32, career_id: 6, phase: 1, title: 'Networking Fundamentals: TCP/IP, DNS, Subnets, Reverse Proxies & SSL/TLS', url: 'https://www.cloudflare.com/learning/' },
      { id: 33, career_id: 6, phase: 2, title: 'Containerization: Docker Images, Dockerfiles, Volumes & Multi-Container Compose', url: 'https://docs.docker.com/get-started/' },
      { id: 34, career_id: 6, phase: 2, title: 'Cloud Infrastructure: AWS Core Services (EC2, S3, RDS, IAM Security & VPC)', url: 'https://aws.amazon.com/getting-started/' },
      { id: 35, career_id: 6, phase: 3, title: 'CI/CD Automation: GitHub Actions Workflows, Automated Build & Test Pipelines', url: 'https://docs.github.com/en/actions' },
      { id: 36, career_id: 6, phase: 3, title: 'Observability & Monitoring: Log Management, Health Probes & System Metrics', url: 'https://roadmap.sh/devops' },

      // 7. Govt Exams (Group-2 / Bank PO) (IDs 37 - 42)
      { id: 37, career_id: 7, phase: 1, title: 'Quantitative Aptitude Foundation: Percentages, Profit & Loss, Ratios, Speed & Distance', url: 'https://www.indiabix.com/aptitude/questions-and-answers/' },
      { id: 38, career_id: 7, phase: 1, title: 'Logical & Analytical Reasoning: Syllogisms, Seating Arrangements & Data Sufficiency', url: 'https://www.indiabix.com/logical-reasoning/questions-and-answers/' },
      { id: 39, career_id: 7, phase: 2, title: 'Indian Polity & Governance: Constitutional Framework, Fundamental Rights & Parliament', url: 'https://ncert.nic.in/textbook.php' },
      { id: 40, career_id: 7, phase: 2, title: 'Banking Awareness & Indian Economy: RBI Monetary Policy, Inflation & Financial Schemes', url: 'https://pib.gov.in/' },
      { id: 41, career_id: 7, phase: 3, title: 'English Comprehension & Descriptive Writing: Essays, Formal Letters & Précis', url: 'https://www.thehindu.com/opinion/editorial/' },
      { id: 42, career_id: 7, phase: 3, title: 'Time-Bound Full Length Mock Tests: Speed Accuracy Analysis & Previous Year Papers', url: 'https://upsc.gov.in/examinations/previous-question-papers' }
    ];

    for (const m of milestones) {
      await conn.query(
        `INSERT INTO milestones (id, career_id, phase_number, title, resource_url) VALUES (?, ?, ?, ?, ?)`,
        [m.id, m.career_id, m.phase, m.title, m.url]
      );
    }

    // 4. Seed Career Skills (5 per career = 35 skills)
    const skills = [
      // Data Analyst
      { id: 1, career_id: 1, skill: 'SQL & Relational Queries', level: 5 },
      { id: 2, career_id: 1, skill: 'Advanced Excel & Pivot Modeling', level: 4 },
      { id: 3, career_id: 1, skill: 'Power BI / Tableau Visualizations', level: 4 },
      { id: 4, career_id: 1, skill: 'Python / Pandas EDA', level: 3 },
      { id: 5, career_id: 1, skill: 'Business Metrics & KPI Storytelling', level: 4 },

      // Software Developer
      { id: 6, career_id: 2, skill: 'Data Structures & Algorithms', level: 4 },
      { id: 7, career_id: 2, skill: 'JavaScript / TypeScript Core', level: 5 },
      { id: 8, career_id: 2, skill: 'React JS & Frontend SPAs', level: 4 },
      { id: 9, career_id: 2, skill: 'Node.js & Backend REST APIs', level: 4 },
      { id: 10, career_id: 2, skill: 'MySQL Schema Design & Optimization', level: 4 },

      // QA / Test Engineer
      { id: 11, career_id: 3, skill: 'Test Case Design & STLC Methodologies', level: 5 },
      { id: 12, career_id: 3, skill: 'API Testing with Postman', level: 4 },
      { id: 13, career_id: 3, skill: 'Bug Tracking & Jira Management', level: 4 },
      { id: 14, career_id: 3, skill: 'Cypress / Selenium Web Automation', level: 3 },
      { id: 15, career_id: 3, skill: 'SQL Data Verification', level: 3 },

      // Business / Product Analyst
      { id: 16, career_id: 4, skill: 'Requirement Gathering & PRD Writing', level: 5 },
      { id: 17, career_id: 4, skill: 'Stakeholder Communication', level: 5 },
      { id: 18, career_id: 4, skill: 'User Journey & Wireframe Mapping', level: 4 },
      { id: 19, career_id: 4, skill: 'Excel Financial & Business Modeling', level: 4 },
      { id: 20, career_id: 4, skill: 'Product Funnel & Churn Analytics', level: 3 },

      // UI/UX Designer
      { id: 21, career_id: 5, skill: 'Figma Auto-Layout & Design Systems', level: 5 },
      { id: 22, career_id: 5, skill: 'Visual Design & Typography Hierarchy', level: 5 },
      { id: 23, career_id: 5, skill: 'User Research & Usability Testing', level: 4 },
      { id: 24, career_id: 5, skill: 'Interactive Prototyping', level: 4 },
      { id: 25, career_id: 5, skill: 'Accessibility (WCAG Standards)', level: 3 },

      // Cloud / DevOps Engineer
      { id: 26, career_id: 6, skill: 'Linux Administration & Shell Scripting', level: 5 },
      { id: 27, career_id: 6, skill: 'Docker Containerization', level: 4 },
      { id: 28, career_id: 6, skill: 'AWS Cloud Services (EC2, S3, RDS)', level: 4 },
      { id: 29, career_id: 6, skill: 'CI/CD Pipelines (GitHub Actions)', level: 4 },
      { id: 30, career_id: 6, skill: 'Networking & Security Fundamentals', level: 4 },

      // Govt Exams
      { id: 31, career_id: 7, skill: 'Quantitative Aptitude & Arithmetic', level: 5 },
      { id: 32, career_id: 7, skill: 'Logical & Analytical Reasoning', level: 5 },
      { id: 33, career_id: 7, skill: 'Indian Polity & Constitution', level: 4 },
      { id: 34, career_id: 7, skill: 'Banking Awareness & Economy', level: 4 },
      { id: 35, career_id: 7, skill: 'English Comprehension & Writing', level: 4 }
    ];

    for (const s of skills) {
      await conn.query(
        `INSERT INTO career_skills (id, career_id, skill_name, required_level) VALUES (?, ?, ?, ?)`,
        [s.id, s.career_id, s.skill, s.level]
      );
    }

    // 5. Seed Career Preference Quiz (5 Questions, 20 Options, Weighted Matrix)
    const questions = [
      { id: 1, text: 'How comfortable are you with mathematics, statistics, and logical problem solving?' },
      { id: 2, text: 'How much coding and programming do you want in your everyday career?' },
      { id: 3, text: 'What kind of work environment and stability appeals to you the most?' },
      { id: 4, text: 'Which daily activity sounds most exciting and intellectually rewarding?' },
      { id: 5, text: 'How do you prefer to learn and build professional competency?' }
    ];

    for (const q of questions) {
      await conn.query(`INSERT INTO quiz_questions (id, question_text) VALUES (?, ?)`, [q.id, q.text]);
    }

    const options = [
      // Q1
      { id: 1, question_id: 1, text: 'Love numbers, calculating trends, financial metrics, and quantitative charts.' },
      { id: 2, question_id: 1, text: 'Enjoy algorithmic puzzles, discrete math, data structures, and computer science logic.' },
      { id: 3, question_id: 1, text: 'Prefer qualitative human behavior, visual aesthetics, psychology, and empathy over raw math.' },
      { id: 4, question_id: 1, text: 'Moderate comfort: prefer structured, clear formulas, competitive aptitude tests, and predictable rules.' },

      // Q2
      { id: 5, question_id: 2, text: 'Heavy coding: I want to build architectures, debug services, and ship code daily.' },
      { id: 6, question_id: 2, text: 'Light/Moderate: Comfortable writing SQL, exploratory scripts, or automated tests, but not deep backend.' },
      { id: 7, question_id: 2, text: 'Zero coding: Prefer user research, visual prototyping, product roadmaps, and stakeholder calls.' },
      { id: 8, question_id: 2, text: 'No coding at all: Want public administration, banking policy, social governance, or civil law.' },

      // Q3
      { id: 9, question_id: 3, text: 'High-growth tech product team with fast iterations, modern tools, and performance bonuses.' },
      { id: 10, question_id: 3, text: 'Government/Public Sector institution with high job security, national prestige, and work-life balance.' },
      { id: 11, question_id: 3, text: 'Corporate consulting or cross-functional team driving data-backed strategic decisions.' },
      { id: 12, question_id: 3, text: 'Creative design studio or digital product squad focused on delightful user experiences.' },

      // Q4
      { id: 13, question_id: 4, text: 'Writing clean code, designing databases, and debugging complex runtime software systems.' },
      { id: 14, question_id: 4, text: 'Analyzing business funnels, uncovering revenue trends, and visualizing dashboard insights.' },
      { id: 15, question_id: 4, text: 'Interviewing users, crafting Figma wireframes, and designing intuitive app interactions.' },
      { id: 16, question_id: 4, text: 'Automating cloud infrastructure, configuring servers, and guaranteeing system 99.9% uptime.' },

      // Q5
      { id: 17, question_id: 5, text: 'Building real-world web/mobile projects, pushing to GitHub, and reading tech documentation.' },
      { id: 18, question_id: 5, text: 'Hands-on dataset wrangling on Kaggle, SQL queries on real business datasets, and dashboard builds.' },
      { id: 19, question_id: 5, text: 'Rigorous daily practice of Quantitative Aptitude, General Studies, and mock test papers.' },
      { id: 20, question_id: 5, text: 'Creating case studies, designing Figma prototypes, and analyzing user experience trade-offs.' }
    ];

    for (const opt of options) {
      await conn.query(`INSERT INTO quiz_options (id, question_id, option_text) VALUES (?, ?, ?)`, [opt.id, opt.question_id, opt.text]);
    }

    const weights = [
      // Opt 1
      { option_id: 1, career_id: 1, weight: 5 }, { option_id: 1, career_id: 2, weight: 4 }, { option_id: 1, career_id: 3, weight: 2 }, { option_id: 1, career_id: 4, weight: 3 }, { option_id: 1, career_id: 5, weight: 1 }, { option_id: 1, career_id: 6, weight: 2 }, { option_id: 1, career_id: 7, weight: 5 },
      // Opt 2
      { option_id: 2, career_id: 1, weight: 3 }, { option_id: 2, career_id: 2, weight: 5 }, { option_id: 2, career_id: 3, weight: 4 }, { option_id: 2, career_id: 4, weight: 2 }, { option_id: 2, career_id: 5, weight: 1 }, { option_id: 2, career_id: 6, weight: 4 }, { option_id: 2, career_id: 7, weight: 2 },
      // Opt 3
      { option_id: 3, career_id: 1, weight: 1 }, { option_id: 3, career_id: 2, weight: 1 }, { option_id: 3, career_id: 3, weight: 2 }, { option_id: 3, career_id: 4, weight: 5 }, { option_id: 3, career_id: 5, weight: 5 }, { option_id: 3, career_id: 6, weight: 1 }, { option_id: 3, career_id: 7, weight: 2 },
      // Opt 4
      { option_id: 4, career_id: 1, weight: 3 }, { option_id: 4, career_id: 2, weight: 2 }, { option_id: 4, career_id: 3, weight: 4 }, { option_id: 4, career_id: 4, weight: 3 }, { option_id: 4, career_id: 5, weight: 2 }, { option_id: 4, career_id: 6, weight: 2 }, { option_id: 4, career_id: 7, weight: 5 },

      // Opt 5
      { option_id: 5, career_id: 1, weight: 2 }, { option_id: 5, career_id: 2, weight: 5 }, { option_id: 5, career_id: 3, weight: 2 }, { option_id: 5, career_id: 4, weight: 0 }, { option_id: 5, career_id: 5, weight: 0 }, { option_id: 5, career_id: 6, weight: 3 }, { option_id: 5, career_id: 7, weight: 0 },
      // Opt 6
      { option_id: 6, career_id: 1, weight: 5 }, { option_id: 6, career_id: 2, weight: 3 }, { option_id: 6, career_id: 3, weight: 5 }, { option_id: 6, career_id: 4, weight: 2 }, { option_id: 6, career_id: 5, weight: 0 }, { option_id: 6, career_id: 6, weight: 4 }, { option_id: 6, career_id: 7, weight: 0 },
      // Opt 7
      { option_id: 7, career_id: 1, weight: 1 }, { option_id: 7, career_id: 2, weight: 0 }, { option_id: 7, career_id: 3, weight: 2 }, { option_id: 7, career_id: 4, weight: 5 }, { option_id: 7, career_id: 5, weight: 5 }, { option_id: 7, career_id: 6, weight: 0 }, { option_id: 7, career_id: 7, weight: 3 },
      // Opt 8
      { option_id: 8, career_id: 1, weight: 0 }, { option_id: 8, career_id: 2, weight: 0 }, { option_id: 8, career_id: 3, weight: 0 }, { option_id: 8, career_id: 4, weight: 1 }, { option_id: 8, career_id: 5, weight: 1 }, { option_id: 8, career_id: 6, weight: 0 }, { option_id: 8, career_id: 7, weight: 5 },

      // Opt 9
      { option_id: 9, career_id: 1, weight: 4 }, { option_id: 9, career_id: 2, weight: 5 }, { option_id: 9, career_id: 3, weight: 4 }, { option_id: 9, career_id: 4, weight: 4 }, { option_id: 9, career_id: 5, weight: 4 }, { option_id: 9, career_id: 6, weight: 5 }, { option_id: 9, career_id: 7, weight: 0 },
      // Opt 10
      { option_id: 10, career_id: 1, weight: 0 }, { option_id: 10, career_id: 2, weight: 0 }, { option_id: 10, career_id: 3, weight: 0 }, { option_id: 10, career_id: 4, weight: 1 }, { option_id: 10, career_id: 5, weight: 0 }, { option_id: 10, career_id: 6, weight: 0 }, { option_id: 10, career_id: 7, weight: 5 },
      // Opt 11
      { option_id: 11, career_id: 1, weight: 5 }, { option_id: 11, career_id: 2, weight: 2 }, { option_id: 11, career_id: 3, weight: 2 }, { option_id: 11, career_id: 4, weight: 5 }, { option_id: 11, career_id: 5, weight: 2 }, { option_id: 11, career_id: 6, weight: 1 }, { option_id: 11, career_id: 7, weight: 2 },
      // Opt 12
      { option_id: 12, career_id: 1, weight: 1 }, { option_id: 12, career_id: 2, weight: 1 }, { option_id: 12, career_id: 3, weight: 2 }, { option_id: 12, career_id: 4, weight: 3 }, { option_id: 12, career_id: 5, weight: 5 }, { option_id: 12, career_id: 6, weight: 1 }, { option_id: 12, career_id: 7, weight: 0 },

      // Opt 13
      { option_id: 13, career_id: 1, weight: 2 }, { option_id: 13, career_id: 2, weight: 5 }, { option_id: 13, career_id: 3, weight: 5 }, { option_id: 13, career_id: 4, weight: 1 }, { option_id: 13, career_id: 5, weight: 1 }, { option_id: 13, career_id: 6, weight: 4 }, { option_id: 13, career_id: 7, weight: 0 },
      // Opt 14
      { option_id: 14, career_id: 1, weight: 5 }, { option_id: 14, career_id: 2, weight: 2 }, { option_id: 14, career_id: 3, weight: 2 }, { option_id: 14, career_id: 4, weight: 5 }, { option_id: 14, career_id: 5, weight: 2 }, { option_id: 14, career_id: 6, weight: 1 }, { option_id: 14, career_id: 7, weight: 2 },
      // Opt 15
      { option_id: 15, career_id: 1, weight: 1 }, { option_id: 15, career_id: 2, weight: 1 }, { option_id: 15, career_id: 3, weight: 2 }, { option_id: 15, career_id: 4, weight: 3 }, { option_id: 15, career_id: 5, weight: 5 }, { option_id: 15, career_id: 6, weight: 1 }, { option_id: 15, career_id: 7, weight: 0 },
      // Opt 16
      { option_id: 16, career_id: 1, weight: 2 }, { option_id: 16, career_id: 2, weight: 3 }, { option_id: 16, career_id: 3, weight: 3 }, { option_id: 16, career_id: 4, weight: 1 }, { option_id: 16, career_id: 5, weight: 0 }, { option_id: 16, career_id: 6, weight: 5 }, { option_id: 16, career_id: 7, weight: 0 },

      // Opt 17
      { option_id: 17, career_id: 1, weight: 2 }, { option_id: 17, career_id: 2, weight: 5 }, { option_id: 17, career_id: 3, weight: 3 }, { option_id: 17, career_id: 4, weight: 2 }, { option_id: 17, career_id: 5, weight: 2 }, { option_id: 17, career_id: 6, weight: 4 }, { option_id: 17, career_id: 7, weight: 0 },
      // Opt 18
      { option_id: 18, career_id: 1, weight: 5 }, { option_id: 18, career_id: 2, weight: 2 }, { option_id: 18, career_id: 3, weight: 3 }, { option_id: 18, career_id: 4, weight: 4 }, { option_id: 18, career_id: 5, weight: 1 }, { option_id: 18, career_id: 6, weight: 1 }, { option_id: 18, career_id: 7, weight: 1 },
      // Opt 19
      { option_id: 19, career_id: 1, weight: 2 }, { option_id: 19, career_id: 2, weight: 0 }, { option_id: 19, career_id: 3, weight: 1 }, { option_id: 19, career_id: 4, weight: 2 }, { option_id: 19, career_id: 5, weight: 0 }, { option_id: 19, career_id: 6, weight: 0 }, { option_id: 19, career_id: 7, weight: 5 },
      // Opt 20
      { option_id: 20, career_id: 1, weight: 1 }, { option_id: 20, career_id: 2, weight: 1 }, { option_id: 20, career_id: 3, weight: 2 }, { option_id: 20, career_id: 4, weight: 4 }, { option_id: 20, career_id: 5, weight: 5 }, { option_id: 20, career_id: 6, weight: 0 }, { option_id: 20, career_id: 7, weight: 0 }
    ];

    for (const w of weights) {
      await conn.query(
        `INSERT INTO option_weights (option_id, career_id, weight) VALUES (?, ?, ?)`,
        [w.option_id, w.career_id, w.weight]
      );
    }

    // 6. Seed 3 Factually Accurate Beginner MCQs for EVERY Milestone (42 x 3 = 126 questions)
    const milestoneQuestions = [
      // Milestone 1: Excel Mastery (Data Analyst)
      { m_id: 1, q: 'What does the first argument of the VLOOKUP function in Excel specify?', a: 'The value to search for in the first column', b: 'The column index to retrieve', c: 'The total range of the table', d: 'Whether an approximate match is used', ans: 'a' },
      { m_id: 1, q: 'Which modern Excel formula can look up data both to the left and to the right without column index numbers?', a: 'HLOOKUP', b: 'XLOOKUP', c: 'VLOOKUP', d: 'CONCATENATE', ans: 'b' },
      { m_id: 1, q: 'What is the primary operational purpose of a Pivot Table in Excel?', a: 'To write VBA macros', b: 'To summarize, group, and calculate totals from large tabular data', c: 'To format text into uppercase', d: 'To create SQL stored procedures', ans: 'b' },

      // Milestone 2: SQL Fundamentals (Data Analyst)
      { m_id: 2, q: 'Which SQL clause is used to filter individual table rows BEFORE grouping occurs?', a: 'HAVING', b: 'WHERE', c: 'GROUP BY', d: 'ORDER BY', ans: 'b' },
      { m_id: 2, q: 'What is the key difference between WHERE and HAVING in SQL?', a: 'WHERE filters rows; HAVING filters grouped aggregate values', b: 'WHERE only works on strings; HAVING works on numbers', c: 'There is no difference in modern SQL', d: 'HAVING executes before WHERE', ans: 'a' },
      { m_id: 2, q: 'Which type of SQL JOIN returns all rows from the left table and matched rows from the right table?', a: 'INNER JOIN', b: 'CROSS JOIN', c: 'LEFT JOIN', d: 'RIGHT JOIN', ans: 'c' },

      // Milestone 3: Advanced SQL (Data Analyst)
      { m_id: 3, q: 'What is a Common Table Expression (CTE) in SQL defined with?', a: 'SELECT INTO', b: 'WITH clause', c: 'CREATE VIEW', d: 'GROUP BY ROLLUP', ans: 'b' },
      { m_id: 3, q: 'How does DENSE_RANK() differ from RANK() when two rows have equal ranking values?', a: 'DENSE_RANK() leaves gaps in rank numbers', b: 'DENSE_RANK() does NOT leave gaps in rank numbers (e.g. 1, 1, 2)', c: 'RANK() cannot be used with OVER()', d: 'DENSE_RANK() only works on unique keys', ans: 'b' },
      { m_id: 3, q: 'Which clause defines the partition and order in an SQL window function?', a: 'OVER()', b: 'UNDER()', c: 'WINDOW_APPLY()', d: 'PARTITION ONLY', ans: 'a' },

      // Milestone 4: Power BI / Tableau (Data Analyst)
      { m_id: 4, q: 'In Power BI, what does DAX stand for?', a: 'Data Analysis Expressions', b: 'Digital Analytics XML', c: 'Direct Access Xerox', d: 'Database Automation eXtension', ans: 'a' },
      { m_id: 4, q: 'What is a Star Schema in analytical data modeling?', a: 'A schema with multiple concentric circular tables', b: 'A schema with a central Fact table surrounded by Dimension tables', c: 'A schema without any primary keys', d: 'A schema exclusively for NoSQL databases', ans: 'b' },
      { m_id: 4, q: 'In Tableau, what is the visual difference between Dimensions and Measures?', a: 'Dimensions are qualitative (discrete/blue); Measures are quantitative (continuous/green)', b: 'Measures can only contain text', c: 'Dimensions cannot be dragged onto shelves', d: 'Measures are always date values', ans: 'a' },

      // Milestone 5: Python for Analytics (Data Analyst)
      { m_id: 5, q: 'In Pandas, what is the standard 2-dimensional labeled tabular data structure called?', a: 'Series', b: 'DataFrame', c: 'NDArray', d: 'PanelSet', ans: 'b' },
      { m_id: 5, q: 'Which Pandas method is commonly used to inspect the first few rows of a dataset?', a: 'df.first()', b: 'df.top()', c: 'df.head()', d: 'df.peek()', ans: 'c' },
      { m_id: 5, q: 'Which Python visualization library builds on top of Matplotlib with high-level statistical charting?', a: 'NumPy', b: 'Seaborn', c: 'Flask', d: 'Requests', ans: 'b' },

      // Milestone 6: Capstone Business Portfolio (Data Analyst)
      { m_id: 6, q: 'In business analytics, what does the Customer Churn Rate metric measure?', a: 'Percentage of new website visitors acquired', b: 'Percentage of existing customers who stop using a product or service', c: 'Average hourly server latency', d: 'The total capital raised in a funding round', ans: 'b' },
      { m_id: 6, q: 'What is the most effective way to present technical analysis results to executive stakeholders?', a: 'Dumping 10,000 raw rows of unformatted data', b: 'A clear executive summary with visual charts, business impact, and actionable recommendations', c: 'Showing only terminal stack traces', d: 'Providing source code without any documentation', ans: 'b' },
      { m_id: 6, q: 'Why is publishing analytical projects on GitHub valuable for fresher placement interviews?', a: 'It acts as tangible proof of data cleaning, SQL logic, and analytical problem-solving skills', b: 'It guarantees automatic campus hiring without interview rounds', c: 'It replaces having a degree entirely', d: 'GitHub automatically assigns a salary CTC', ans: 'a' },

      // Milestone 7: Core Computer Science (Software Developer)
      { m_id: 7, q: 'What is the average time complexity of searching an element in a balanced Binary Search Tree (BST)?', a: 'O(1)', b: 'O(n)', c: 'O(log n)', d: 'O(n^2)', ans: 'c' },
      { m_id: 7, q: 'Which data structure operates on a First-In, First-Out (FIFO) principle?', a: 'Stack', b: 'Queue', c: 'Binary Tree', d: 'Hash Table', ans: 'b' },
      { m_id: 7, q: 'What does Big-O notation quantify in algorithm analysis?', a: 'The exact milliseconds an algorithm runs on a specific laptop', b: 'The upper bound of time or memory growth relative to input size n', c: 'The physical lines of code written', d: 'The number of functions in a file', ans: 'b' },

      // Milestone 8: Modern JavaScript (Software Developer)
      { m_id: 8, q: 'What is a closure in JavaScript?', a: 'A function bundled with references to its surrounding lexical state', b: 'A method that forces a browser tab to close', c: 'A keyword used to exit a while loop', d: 'A private CSS selector', ans: 'a' },
      { m_id: 8, q: 'What is the output of typeof null in JavaScript?', a: '"null"', b: '"undefined"', c: '"object"', d: '"number"', ans: 'c' },
      { m_id: 8, q: 'What does the JavaScript Event Loop primarily manage?', a: 'CSS animations only', b: 'Executing code, collecting events, and running queued asynchronous sub-tasks', c: 'Database table creation', d: 'Compiling C++ extensions', ans: 'b' },

      // Milestone 9: Frontend SPAs: React Hooks (Software Developer)
      { m_id: 9, q: 'What is the primary rule regarding the placement of React Hook calls?', a: 'Call them only inside loops or nested if statements', b: 'Call them only at the top level of React function components or custom hooks', c: 'Call them inside class render methods only', d: 'Hooks can only be called from HTML scripts', ans: 'b' },
      { m_id: 9, q: 'In React, what happens when you pass an empty dependency array [] to useEffect?', a: 'The effect runs on every single re-render', b: 'The effect runs only once after the initial render (mount)', c: 'The component unmounts immediately', d: 'The state is permanently frozen', ans: 'b' },
      { m_id: 9, q: 'Why is immutability recommended when updating state via useState in React?', a: 'React relies on reference equality to detect changes and trigger re-renders', b: 'Mutable objects take 10x more disk space', c: 'JavaScript throws a syntax error on mutation', d: 'Immutability prevents all network latency', ans: 'a' },

      // Milestone 10: Backend APIs: Node.js & Express (Software Developer)
      { m_id: 10, q: 'In Express middleware, what must you call to pass control to the next middleware function?', a: 'res.send()', b: 'next()', c: 'return false', d: 'process.continue()', ans: 'b' },
      { m_id: 10, q: 'What does JWT stand for in stateless web authentication?', a: 'Java Web Terminology', b: 'JSON Web Token', c: 'Joint Wire Transmission', d: 'JavaScript Web Type', ans: 'b' },
      { m_id: 10, q: 'Which HTTP status code signifies that a client must authenticate to access the requested resource?', a: '200 OK', b: '401 Unauthorized', c: '404 Not Found', d: '500 Server Error', ans: 'b' },

      // Milestone 11: Relational MySQL Architecture (Software Developer)
      { m_id: 11, q: 'What rule does ON DELETE CASCADE enforce on a foreign key relationship in MySQL?', a: 'It prevents the parent row from being deleted forever', b: 'When a parent row is deleted, all dependent child rows are automatically deleted', c: 'It sets the child foreign key column to NULL', d: 'It drops the database entirely', ans: 'b' },
      { m_id: 11, q: 'What is the main benefit of adding an index to a column frequently searched with WHERE?', a: 'It speeds up SELECT query lookup times significantly', b: 'It makes INSERT operations 10x faster', c: 'It automatically formats the data as uppercase', d: 'It removes duplicate rows permanently', ans: 'a' },
      { m_id: 11, q: 'Which normal form requires eliminating repeating groups and ensuring atomic values in columns?', a: 'First Normal Form (1NF)', b: 'Second Normal Form (2NF)', c: 'Third Normal Form (3NF)', d: 'BCNF', ans: 'a' },

      // Milestone 12: Full Stack Deployment (Software Developer)
      { m_id: 12, q: 'Why should environment secrets (like database passwords and JWT keys) never be committed to Git?', a: 'Git cannot commit text longer than 20 characters', b: 'Committing secrets exposes sensitive credentials publicly, leading to security breaches', c: 'Node.js only reads variables from compiled binary files', d: 'It prevents Vite from bundling plain CSS', ans: 'b' },
      { m_id: 12, q: 'What does CI/CD stand for in modern software engineering practices?', a: 'Continuous Integration and Continuous Delivery / Deployment', b: 'Computer Interface and Circuit Design', c: 'Centralized Index and Command Directory', d: 'Client Interaction and Customer Data', ans: 'a' },
      { m_id: 12, q: 'What is the role of a reverse proxy like NGINX in production web deployments?', a: 'To replace the MySQL database server', b: 'To route incoming client traffic, terminate SSL, load balance, and serve cached static assets', c: 'To compile React JSX into HTML templates', d: 'To generate mock passwords', ans: 'b' },

      // Milestone 13: Software Testing Fundamentals (QA / Test Engineer)
      { m_id: 13, q: 'What does STLC stand for in software quality assurance?', a: 'Software Testing Life Cycle', b: 'Standard Technical Logistics Core', c: 'System Tool Licensing Certificate', d: 'Structured Test Language Compiler', ans: 'a' },
      { m_id: 13, q: 'In Black-Box testing, what is Boundary Value Analysis (BVA) primarily focused on?', a: 'Testing internal C++ pointer variables', b: 'Testing input values at the extreme minimum, maximum, and just outside defined thresholds', c: 'Counting the lines of JavaScript code', d: 'Measuring database disk drive rotation speed', ans: 'b' },
      { m_id: 13, q: 'What is the key goal of Regression Testing?', a: 'To verify that recent code changes or bug fixes have not broken existing working features', b: 'To write the initial product requirements document', c: 'To delete outdated git commits', d: 'To design the website company logo', ans: 'a' },

      // Milestone 14: Agile & Defect Lifecycle (QA / Test Engineer)
      { m_id: 14, q: 'What are the essential components of an effective Defect/Bug Report in Jira?', a: 'Title, Steps to Reproduce, Expected Result, Actual Result, and Severity/Screenshots', b: 'Only the word "Broken" without context', c: 'The developer personal phone number', d: 'The entire source code repository in plain text', ans: 'a' },
      { m_id: 14, q: 'In defect triage, what is the difference between Severity and Priority?', a: 'Severity measures technical business impact; Priority determines the urgency of fixing it', b: 'Severity is set by HR; Priority is set by marketing', c: 'There is no difference in Agile', d: 'Priority is always higher than severity', ans: 'a' },
      { m_id: 14, q: 'What is a Sprint Retrospective meeting in Scrum?', a: 'A meeting to review what went well, what could be improved, and action items for the next sprint', b: 'A salary negotiation interview', c: 'A coding test for new interns', d: 'A sales demonstration for customers', ans: 'a' },

      // Milestone 15: REST API Testing (QA / Test Engineer)
      { m_id: 15, q: 'Which HTTP method should be used when creating a new resource on a REST API?', a: 'GET', b: 'POST', c: 'DELETE', d: 'HEAD', ans: 'b' },
      { m_id: 15, q: 'In Postman tests, which assertion checks that an API response returned within acceptable latency?', a: 'pm.response.to.have.status(200)', b: 'pm.expect(pm.response.responseTime).to.be.below(500)', c: 'pm.response.json()', d: 'pm.globals.clear()', ans: 'b' },
      { m_id: 15, q: 'What does an HTTP 404 response code communicate to the client?', a: 'The server successfully created the record', b: 'The server cannot find the requested resource endpoint', c: 'The server ran out of memory', d: 'The request was blocked by a firewall permanently', ans: 'b' },

      // Milestone 16: Database Validation with SQL (QA / Test Engineer)
      { m_id: 16, q: 'Why do QA Engineers execute SQL queries directly against test databases?', a: 'To verify that frontend UI actions correctly persist and update backend database records', b: 'To bypass UI testing completely', c: 'To format CSS stylesheets on the server', d: 'To rewrite developer business logic', ans: 'a' },
      { m_id: 16, q: 'Which SQL statement retrieves the total count of registered test users?', a: 'SELECT COUNT(*) FROM users;', b: 'COUNT users ALL;', c: 'FETCH TOTAL users;', d: 'SUM(users);', ans: 'a' },
      { m_id: 16, q: 'What is Data Integrity in database testing?', a: 'The accuracy, consistency, and completeness of stored data across relationships and cascades', b: 'The physical color of the database server chassis', c: 'The font size of SQL query results', d: 'The speed of user typing on keyboard', ans: 'a' },

      // Milestone 17: Automation Testing: Cypress / Selenium (QA / Test Engineer)
      { m_id: 17, q: 'What is the primary benefit of end-to-end (E2E) automated testing with Cypress?', a: 'It automates user browser interactions reliably to verify entire user workflows', b: 'It replaces all backend server code', c: 'It automatically fixes CSS bugs without developer input', d: 'It eliminates the need for any unit tests', ans: 'a' },
      { m_id: 17, q: 'In Cypress, which command is used to find a DOM element by CSS selector or data attribute?', a: 'cy.get()', b: 'cy.find_element_by_id()', c: 'cy.select_dom()', d: 'cy.query()', ans: 'a' },
      { m_id: 17, q: 'What is an assertion in an automated test script?', a: 'A checkpoint verifying that actual UI state matches the expected condition', b: 'A comment line explaining author name', c: 'A git commit message', d: 'A network proxy route', ans: 'a' },

      // Milestone 18: Performance & Regression Testing (QA / Test Engineer)
      { m_id: 18, q: 'What is Newman in the Postman ecosystem?', a: 'A command-line collection runner that allows Postman tests to execute in CI/CD pipelines', b: 'A new CSS framework for buttons', c: 'A relational database engine', d: 'A JavaScript code bundler', ans: 'a' },
      { m_id: 18, q: 'What does Load Testing measure in web application performance?', a: 'How the application behaves under expected concurrent user traffic and request volumes', b: 'The weight of the developer laptop', c: 'The number of npm packages installed', d: 'The screen resolution of mobile devices', ans: 'a' },
      { m_id: 18, q: 'What is a Smoke Test in quality assurance?', a: 'A quick baseline test suite verifying that core critical functions work before deep testing', b: 'A test to check hardware overheating', c: 'Testing only deprecated APIs', d: 'An audit of network firewall hardware', ans: 'a' },

      // Milestone 19: Business Analysis Fundamentals (Business / Product Analyst)
      { m_id: 19, q: 'What is the core role of a Business Analyst in a software project?', a: 'Writing low-level compiler optimization algorithms', b: 'Eliciting, analyzing, and documenting business needs into functional engineering requirements', c: 'Managing physical office hardware cabling', d: 'Creating SQL database backups on tape drives', ans: 'b' },
      { m_id: 19, q: 'Who is a Stakeholder in software product development?', a: 'Any individual, group, or organization impacted by or having an interest in the project outcome', b: 'Only the company CEO', c: 'Only external paying customers', d: 'Only frontend React developers', ans: 'a' },
      { m_id: 19, q: 'In requirement analysis, what does a Functional Requirement specify?', a: 'What specific behaviors, features, and functions the system must perform for users', b: 'The system response time in milliseconds', c: 'The hosting server operating system version', d: 'The company legal tax registration number', ans: 'a' },

      // Milestone 20: Excel Modeling (Business / Product Analyst)
      { m_id: 20, q: 'What is Scenario Analysis in financial and business modeling?', a: 'Forecasting potential business outcomes under best-case, base-case, and worst-case conditions', b: 'Checking spelling in Excel documentation', c: 'Sorting rows alphabetically only', d: 'Creating slide presentations in PowerPoint', ans: 'a' },
      { m_id: 20, q: 'Which Excel feature restricts data input in a cell to a predefined dropdown list or number range?', a: 'Data Validation', b: 'Conditional Formatting', c: 'Formula Auditing', d: 'Goal Seek', ans: 'a' },
      { m_id: 20, q: 'What does the Goal Seek tool in Excel allow an analyst to do?', a: 'Find the required input value needed to achieve a desired specific formula result', b: 'Automatically send emails to clients', c: 'Translate spreadsheet text into Spanish', d: 'Draw UML activity flow diagrams', ans: 'a' },

      // Milestone 21: Requirement Engineering: PRDs (Business / Product Analyst)
      { m_id: 21, q: 'What does PRD stand for in modern product management?', a: 'Product Requirements Document', b: 'Public Relations Directory', c: 'Process Regression Diagnostic', d: 'Project Resource Division', ans: 'a' },
      { m_id: 21, q: 'What format is standard for drafting Agile User Stories?', a: '"As a [user role], I want to [action], so that [business benefit]"', b: '"If [bug] then [crash]"', c: 'A 200-page academic thesis format', d: 'SQL SELECT query script', ans: 'a' },
      { m_id: 21, q: 'What is the purpose of Acceptance Criteria in a user story?', a: 'To define the exact boundary conditions that must be fulfilled for the feature to be accepted', b: 'To list developer hourly billing rates', c: 'To assign copyright licenses', d: 'To format CSS grid column templates', ans: 'a' },

      // Milestone 22: Visual Wireframing & Flowcharts (Business / Product Analyst)
      { m_id: 22, q: 'What is a User Journey Map used for?', a: 'Visualizing the sequential steps, touchpoints, and emotions a user experiences to achieve a goal', b: 'Plotting office floor seating plans', c: 'Tracing network packet IP hops', d: 'Tracking developer vacation days', ans: 'a' },
      { m_id: 22, q: 'In standard flowchart notation, what does a Diamond shape represent?', a: 'A decision or branch point with True/False outcomes', b: 'The start or end of the process', c: 'An operational task or processing step', d: 'An external database storage entity', ans: 'a' },
      { m_id: 22, q: 'What is a Low-Fidelity Wireframe?', a: 'A simple, unstyled visual layout showing page structure and element placement without detailed design', b: 'A fully functional production application', c: 'A high-resolution photograph of the product', d: 'A finalized vector logo asset', ans: 'a' },

      // Milestone 23: Product Metrics & Funnel Analysis (Business / Product Analyst)
      { m_id: 23, q: 'In product analytics, what does Customer Lifetime Value (LTV) represent?', a: 'The total revenue a business can reasonably expect from a single customer throughout their relationship', b: 'The total number of app downloads in year one', c: 'The amount of RAM an app consumes on a phone', d: 'The average customer age in years', ans: 'a' },
      { m_id: 23, q: 'What is Funnel Drop-off Analysis?', a: 'Identifying where and why users abandon a step in a multi-stage flow (e.g., signup to payment)', b: 'Analyzing drops in Wi-Fi signal strength', c: 'Measuring database query response times', d: 'Counting invalid password attempts', ans: 'a' },
      { m_id: 23, q: 'What does CAC stand for in growth and product strategy?', a: 'Customer Acquisition Cost', b: 'Centralized Access Control', c: 'Consumer Analytics Core', d: 'Component Action Callback', ans: 'a' },

      // Milestone 24: Capstone Business Case Study (Business / Product Analyst)
      { m_id: 24, q: 'In product prioritization frameworks, what does RICE stand for?', a: 'Reach, Impact, Confidence, and Effort', b: 'Revenue, Investment, Cashflow, and Expense', c: 'Reliability, Infrastructure, Code, and Execution', d: 'Research, Iteration, Concept, and Evaluation', ans: 'a' },
      { m_id: 24, q: 'What is the purpose of conducting Competitive Benchmarking?', a: 'Analyzing competitor product features, pricing, and positioning to uncover market differentiation', b: 'Copying competitor source code verbatim', c: 'Filing legal lawsuits against rival apps', d: 'Limiting app features to match competitors only', ans: 'a' },
      { m_id: 24, q: 'What is Return on Investment (ROI) fundamentally a measure of?', a: 'The profitability or efficiency of an initiative relative to its investment cost', b: 'The number of git commits pushed per day', c: 'The storage capacity of database hard drives', d: 'The count of Slack messages sent in a channel', ans: 'a' },

      // Milestone 25: Design Fundamentals (UI/UX Designer)
      { m_id: 25, q: 'In visual design hierarchy, what makes an element immediately capture the user focus?', a: 'Higher contrast, strategic scale/size, and distinctive positioning', b: 'Making all elements identical in size and gray color', c: 'Using 10 different fonts on the same screen', d: 'Hiding all buttons behind dropdown menus', ans: 'a' },
      { m_id: 25, q: 'What is the minimum recommended contrast ratio for normal body text under WCAG AA accessibility standards?', a: '4.5:1', b: '1.2:1', c: '100:1', d: '2.0:1', ans: 'a' },
      { m_id: 25, q: 'In typography, what is the term for the vertical spacing between lines of text?', a: 'Kerning', b: 'Leading (Line Height)', c: 'Tracking', d: 'Baseline shift', ans: 'b' },

      // Milestone 26: User Research & Personas (UI/UX Designer)
      { m_id: 26, q: 'What is a User Persona in UX design methodology?', a: 'A semi-fictional archetype representing the key traits, motivations, and pain points of a user segment', b: 'A real photo of the lead designer', c: 'A legal user agreement contract', d: 'A list of registered SQL user records', ans: 'a' },
      { m_id: 26, q: 'What is an Empathy Map designed to capture about a user?', a: 'What the user Says, Thinks, Does, and Feels during an experience', b: 'The user bank account balance and credit rating', c: 'The user home Wi-Fi IP address', d: 'The user operating system kernel version', ans: 'a' },
      { m_id: 26, q: 'What is Information Architecture (IA) in digital product design?', a: 'The structural design of shared information environments and navigation schemes', b: 'The brand of servers hosting the website', c: 'The physical building architecture of tech offices', d: 'The licensing terms of software packages', ans: 'a' },

      // Milestone 27: Figma Mastery (UI/UX Designer)
      { m_id: 27, q: 'What is the primary power of Auto-Layout in Figma?', a: 'Creating dynamic frames that automatically adjust size and padding when content changes', b: 'Automatically generating SQL backend code', c: 'Publishing websites directly to production servers', d: 'Running load tests on API endpoints', ans: 'a' },
      { m_id: 27, q: 'In Figma, what are Component Variants used for?', a: 'Grouping related component states (e.g. Primary, Hover, Disabled) into a unified master component', b: 'Translating Figma text into binary code', c: 'Creating multiple separate project files for each button', d: 'Encrypting design files with passwords', ans: 'a' },
      { m_id: 27, q: 'What are Design Tokens in modern UI design systems?', a: 'Centralized design values (colors, spacing, typography scales) stored as reusable variables', b: 'Cryptocurrency coins used to purchase Figma plugins', c: 'OAuth access tokens for backend APIs', d: 'Vector shapes drawn with the pen tool', ans: 'a' },

      // Milestone 28: Design Systems & 8pt Grid (UI/UX Designer)
      { m_id: 28, q: 'Why is an 8-point spatial grid system widely adopted in UI design?', a: 'It creates visual rhythm, consistency, and scales cleanly across various screen pixel densities', b: 'Computer screens only display multiples of 8 colors', c: 'It is a mandatory legal requirement by the W3C', d: 'It prevents developers from using plain CSS', ans: 'a' },
      { m_id: 28, q: 'What is a Responsive Breakpoint in modern web layout design?', a: 'The specific screen width viewport where layout styling shifts to suit the display size', b: 'A deliberate error thrown to pause the browser', c: 'The maximum allowable file size of a PNG image', d: 'A server crash caused by excessive web traffic', ans: 'a' },
      { m_id: 28, q: 'Which UI state indicates that a button or input cannot currently be interacted with by the user?', a: 'Hover state', b: 'Active / Pressed state', c: 'Disabled state', d: 'Focus state', ans: 'c' },

      // Milestone 29: Usability Testing (UI/UX Designer)
      { m_id: 29, q: 'What is a Heuristic Evaluation in user experience auditing?', a: 'An expert review assessing interface usability against established design principles (e.g. Nielsen Norman)', b: 'An automated security vulnerability penetration test', c: 'A test measuring network bandwidth consumption', d: 'A calculation of corporate tax returns', ans: 'a' },
      { m_id: 29, q: 'In Jakob Nielsen 10 Usability Heuristics, what does "Visibility of System Status" mean?', a: 'The system should always keep users informed about what is going on through timely feedback', b: 'The system source code must be public open-source', c: 'The system must always show the user battery percentage', d: 'The UI must display all database table schemas', ans: 'a' },
      { m_id: 29, q: 'What is an A/B Test in product design optimization?', a: 'Comparing two versions of a screen to see which performs better for a specific user conversion goal', b: 'Testing keyboard letters A versus B', c: 'A type of automated database backup', d: 'A grading system for UX designers', ans: 'a' },

      // Milestone 30: Portfolio Curation (UI/UX Designer)
      { m_id: 30, q: 'What is the most critical element hiring managers evaluate in a UX Case Study?', a: 'The problem statement, user research evidence, rationale for design decisions, and measured outcomes', b: 'Having over 100 unrelated mobile mockups without descriptions', c: 'Using as many decorative 3D illustrations as possible', d: 'The candidate high school test scores', ans: 'a' },
      { m_id: 30, q: 'Why is showcasing failed design iterations and how you pivoted valuable in a portfolio?', a: 'It demonstrates critical thinking, humility, and willingness to iterate based on user feedback', b: 'It proves that design requires no research upfront', c: 'Hiring managers only hire designers who never make mistakes', d: 'It reduces the word count of the presentation', ans: 'a' },
      { m_id: 30, q: 'What should be the main call to action on a fresher design portfolio website?', a: 'Clear links to interactive prototypes, case studies, resume PDF, and contact information', b: 'An unskippable auto-playing video advertisement', c: 'A payment gateway asking for donations', d: 'A link to a personal video gaming stream', ans: 'a' },

      // Milestone 31: Linux System Administration (DevOps Engineer)
      { m_id: 31, q: 'Which Linux command is used to display current active system processes and resource consumption in real-time?', a: 'top (or htop)', b: 'pwd', c: 'chmod', d: 'mkdir', ans: 'a' },
      { m_id: 31, q: 'What permission octal value gives read, write, and execute permissions to the owner, and read-only to others?', a: '755', b: '644', c: '777', d: '700', ans: 'a' },
      { m_id: 31, q: 'Which Linux system manager is used to start, stop, enable, and inspect system background services?', a: 'systemctl (systemd)', b: 'apt-get', c: 'tar', d: 'grep', ans: 'a' },

      // Milestone 32: Networking Fundamentals (DevOps Engineer)
      { m_id: 32, q: 'What is the primary role of the Domain Name System (DNS)?', a: 'Translating human-readable domain names (e.g. google.com) into numerical IP addresses', b: 'Encrypting hard disk drives', c: 'Managing CSS animation stylesheets', d: 'Connecting mice and keyboards via USB', ans: 'a' },
      { m_id: 32, q: 'Which transport layer protocol guarantees reliable, ordered, and error-checked delivery of packets?', a: 'UDP', b: 'TCP', c: 'ICMP', d: 'ARP', ans: 'b' },
      { m_id: 32, q: 'What default network port is used for secure HTTPS traffic?', a: '80', b: '443', c: '22', d: '3306', ans: 'b' },

      // Milestone 33: Containerization with Docker (DevOps Engineer)
      { m_id: 33, q: 'What is the fundamental difference between a Docker Container and a Virtual Machine (VM)?', a: 'Containers share the host OS kernel and are lightweight; VMs virtualize an entire guest OS stack', b: 'VMs start in milliseconds while containers take 10 minutes to boot', c: 'Containers can only run Windows operating systems', d: 'Containers require dedicated physical network cards', ans: 'a' },
      { m_id: 33, q: 'Which file contains the step-by-step instructions to build a Docker container image?', a: 'Dockerfile', b: 'package.json', c: 'docker-compose.yml', d: 'Makefile', ans: 'a' },
      { m_id: 33, q: 'What is the purpose of Docker Volumes?', a: 'To persist data generated by and used by Docker containers outside the container lifecycle', b: 'To increase the sound audio level of the server', c: 'To compile TypeScript into JavaScript', d: 'To resize the developer terminal window', ans: 'a' },

      // Milestone 34: Cloud Infrastructure: AWS (DevOps Engineer)
      { m_id: 34, q: 'Which AWS service provides resizable, on-demand virtual compute servers in the cloud?', a: 'Amazon EC2', b: 'Amazon S3', c: 'Amazon RDS', d: 'AWS IAM', ans: 'a' },
      { m_id: 34, q: 'What type of cloud storage service is Amazon S3 (Simple Storage Service)?', a: 'Scalable Object Storage', b: 'Relational SQL Database', c: 'In-memory Cache', d: 'DNS Registrar', ans: 'a' },
      { m_id: 34, q: 'In AWS security, what does the principle of least privilege mean in IAM policies?', a: 'Granting users and services only the minimum permissions necessary to perform their assigned tasks', b: 'Giving all developers full administrator access to avoid blockers', c: 'Using blank passwords for internal databases', d: 'Disabling all firewall rules on port 22', ans: 'a' },

      // Milestone 35: CI/CD Automation: GitHub Actions (DevOps Engineer)
      { m_id: 35, q: 'In GitHub Actions, in which directory must workflow YAML definition files be stored?', a: '.github/workflows/', b: 'src/ci/', c: '.git/actions/', d: 'config/pipelines/', ans: 'a' },
      { m_id: 35, q: 'What is a "Runner" in GitHub Actions architecture?', a: 'The server environment that executes the defined jobs and workflow steps when triggered', b: 'A developer who submits git commits rapidly', c: 'An npm package manager command', d: 'A tool for drawing architecture diagrams', ans: 'a' },
      { m_id: 35, q: 'Why is automated linting and test execution crucial on every pull request?', a: 'It catches errors, syntax flaws, and regressions before code is merged into production branches', b: 'It makes the git repository size smaller', c: 'It replaces having a backend database', d: 'It guarantees zero server cloud costs', ans: 'a' },

      // Milestone 36: Observability & Monitoring (DevOps Engineer)
      { m_id: 36, q: 'What are the three pillars of modern cloud observability?', a: 'Metrics, Logs, and Traces', b: 'HTML, CSS, and JavaScript', c: 'CPU, RAM, and SSD', d: 'Docker, Kubernetes, and Helm', ans: 'a' },
      { m_id: 36, q: 'What is the purpose of a health check probe (e.g. /api/health) on a web service?', a: 'To allow load balancers and orchestrators to verify that the instance is alive and ready to handle traffic', b: 'To display company stock prices', c: 'To restart the server after every user request', d: 'To format database tables into JSON', ans: 'a' },
      { m_id: 36, q: 'What is High Availability (HA) in production infrastructure design?', a: 'Designing systems to operate continuously without failure for a long period, typically with redundancy', b: 'Buying the most expensive server model', c: 'Running code exclusively on developer local machines', d: 'Limiting service access to daylight hours only', ans: 'a' },

      // Milestone 37: Quantitative Aptitude (Govt Exams)
      { m_id: 37, q: 'If an item bought for Rs. 800 is sold for Rs. 1000, what is the profit percentage?', a: '20%', b: '25%', c: '15%', d: '30%', ans: 'b' },
      { m_id: 37, q: 'What is the formula for calculating Simple Interest (SI)?', a: 'SI = (P * R * T) / 100', b: 'SI = P * (1 + R)^T', c: 'SI = P / (R * T)', d: 'SI = (P + R + T) / 100', ans: 'a' },
      { m_id: 37, q: 'A train travels 360 km in 4 hours. What is its speed in meters per second (m/s)?', a: '25 m/s', b: '30 m/s', c: '20 m/s', d: '90 m/s', ans: 'a' },

      // Milestone 38: Logical & Analytical Reasoning (Govt Exams)
      { m_id: 38, q: 'In Syllogisms, if "All cats are animals" and "All animals are living beings", what conclusion is certain?', a: 'All cats are living beings', b: 'Some living beings are not animals', c: 'No cats are living beings', d: 'All living beings are cats', ans: 'a' },
      { m_id: 38, q: 'In Blood Relation questions, what does "My mother only son" signify to a male speaker?', a: 'The speaker himself', b: 'His brother', c: 'His uncle', d: 'His son', ans: 'a' },
      { m_id: 38, q: 'What is the primary strategy to solve complex Circular Seating Arrangement problems?', a: 'Fixing one definite reference position and systematically plotting relative left/right placements', b: 'Guessing positions randomly at first', c: 'Calculating the geometric circumference', d: 'Converting names into ASCII codes', ans: 'a' },

      // Milestone 39: Indian Polity & Governance (Govt Exams)
      { m_id: 39, q: 'Which Article of the Indian Constitution is referred to as the "Heart and Soul of the Constitution" by Dr. B.R. Ambedkar?', a: 'Article 14', b: 'Article 21', c: 'Article 32 (Right to Constitutional Remedies)', d: 'Article 44', ans: 'c' },
      { m_id: 39, q: 'What is the minimum age requirement to contest elections for the office of the President of India?', a: '25 years', b: '30 years', c: '35 years', d: '21 years', ans: 'c' },
      { m_id: 39, q: 'Which schedule of the Indian Constitution contains the division of powers between Union, State, and Concurrent lists?', a: 'Seventh Schedule', b: 'Fifth Schedule', c: 'Eighth Schedule', d: 'Tenth Schedule', ans: 'a' },

      // Milestone 40: Banking Awareness & Indian Economy (Govt Exams)
      { m_id: 40, q: 'Which institution serves as the central bank and monetary regulator of India?', a: 'State Bank of India (SBI)', b: 'Reserve Bank of India (RBI)', c: 'Ministry of Corporate Affairs', d: 'NITI Aayog', ans: 'b' },
      { m_id: 40, q: 'What is the Repo Rate in RBI monetary policy operations?', a: 'The rate at which commercial banks borrow money from the RBI against government securities', b: 'The interest rate customers earn on savings deposits', c: 'The personal loan interest rate set by private banks', d: 'The income tax rate on corporate profits', ans: 'a' },
      { m_id: 40, q: 'What does NPA stand for in the Indian banking system?', a: 'Non-Performing Asset', b: 'National Payment Agency', c: 'New Portfolio Allocation', d: 'Net Profit Assessment', ans: 'a' },

      // Milestone 41: English Comprehension & Descriptive Writing (Govt Exams)
      { m_id: 41, q: 'What is a Précis in competitive descriptive writing examinations?', a: 'A concise summary capturing the essential ideas of a passage in approximately one-third of its original length', b: 'A word-for-word translation into regional language', c: 'An expanded version with personal fictional stories', d: 'A list of grammatical spelling errors', ans: 'a' },
      { m_id: 41, q: 'In formal letter writing, where is the recipient designation and address standardly placed?', a: 'On the left side below the sender details and date', b: 'At the bottom right corner of the envelope', c: 'In the middle of the body paragraph', d: 'Inside the subject line parentheses', ans: 'a' },
      { m_id: 41, q: 'Which word is the closest synonym for the word "Meticulous"?', a: 'Careless', b: 'Detailed and thorough', c: 'Hasty', d: 'Aggressive', ans: 'b' },

      // Milestone 42: Time-Bound Full Length Mock Tests (Govt Exams)
      { m_id: 42, q: 'In competitive exam strategy, what is the primary role of practicing Full Length Mock Tests?', a: 'Developing exam stamina, time-allocation discipline, negative marking management, and identifying weak topics', b: 'Memorizing the questions because exams repeat them word-for-word', c: 'Replacing textbook studying completely', d: 'Skipping mathematical formulas', ans: 'a' },
      { m_id: 42, q: 'How does negative marking impact exam question selection strategy?', a: 'It penalizes random guessing; questions should only be attempted when confident or after calculated elimination', b: 'It gives bonus points for fast submission', c: 'It multiplies the total score by 2', d: 'It only applies to general knowledge sections', ans: 'a' },
      { m_id: 42, q: 'What post-mock analysis activity yields the highest score improvement?', a: 'Carefully reviewing every unattempted and incorrect question to understand the underlying conceptual mistake', b: 'Immediately starting another test without reviewing results', c: 'Deleting the test score report', d: 'Blaming test difficulty without reflection', ans: 'a' }
    ];

    for (const mq of milestoneQuestions) {
      await conn.query(
        `INSERT INTO milestone_questions (milestone_id, question_text, option_a, option_b, option_c, option_d, correct_option)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [mq.m_id, mq.q, mq.a, mq.b, mq.c, mq.d, mq.ans]
      );
    }

    // 7. Seed Demo Users (Admin and Student)
    const adminHash = bcrypt.hashSync('admin123', 10);
    const studentHash = bcrypt.hashSync('student123', 10);

    await conn.query(
      `INSERT INTO users (id, name, email, password_hash, role, target_career_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [1, 'Admin PathFinder', 'admin@pathfinder.com', adminHash, 'admin', 2]
    );

    await conn.query(
      `INSERT INTO users (id, name, email, password_hash, role, target_career_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [2, 'B.Tech Student', 'student@pathfinder.com', studentHash, 'student', 1]
    );

    // 8. Seed Initial Daily Streak for Demo Users
    const todayStr = seedDate;
    await conn.query(
      `INSERT INTO daily_streaks (user_id, last_active_date, streak_count) VALUES (?, ?, ?)`,
      [1, todayStr, 7]
    );
    await conn.query(
      `INSERT INTO daily_streaks (user_id, last_active_date, streak_count) VALUES (?, ?, ?)`,
      [2, todayStr, 3]
    );

    // 9. Seed Initial Passed Quiz Attempts and Milestone Progress for Demo Student (Milestones 1 & 2)
    // Milestone 1 passed
    await conn.query(
      `INSERT INTO milestone_quiz_attempts (user_id, milestone_id, score, total, passed) VALUES (?, ?, ?, ?, ?)`,
      [2, 1, 3, 3, true]
    );
    await conn.query(
      `INSERT INTO user_milestone_progress (user_id, milestone_id, status, proof_note) VALUES (?, ?, 'completed', ?)`,
      [2, 1, 'Mastered VLOOKUP, modern XLOOKUP, Pivot table summaries and data normalization fundamentals. Ready for business reporting.']
    );

    // Milestone 2 passed
    await conn.query(
      `INSERT INTO milestone_quiz_attempts (user_id, milestone_id, score, total, passed) VALUES (?, ?, ?, ?, ?)`,
      [2, 2, 3, 3, true]
    );
    await conn.query(
      `INSERT INTO user_milestone_progress (user_id, milestone_id, status, proof_note) VALUES (?, ?, 'completed', ?)`,
      [2, 2, 'Practiced foundational SQL SELECT, WHERE, GROUP BY, and multi-table LEFT and INNER JOINs on real sample datasets.']
    );

    // 10. Seed Initial Skill Ratings for Demo Student
    await conn.query(
      `INSERT INTO user_skill_ratings (user_id, career_skill_id, rating) VALUES (?, ?, ?)`,
      [2, 1, 3]
    );
    await conn.query(
      `INSERT INTO user_skill_ratings (user_id, career_skill_id, rating) VALUES (?, ?, ?)`,
      [2, 2, 4]
    );

    console.log('✅ Seed completed successfully:');
    console.log('   - 7 Careers (with salary sources and verification dates)');
    console.log('   - 42 Milestones across 3 phases');
    console.log('   - 35 Benchmark skills');
    console.log('   - 5 Quiz questions with 20 options and weighted matrix');
    console.log('   - 126 Milestone verification questions (3 per milestone)');
    console.log('   - Demo Admin (admin@pathfinder.com / admin123)');
    console.log('   - Demo Student (student@pathfinder.com / student123) with initial streak & passed milestones');

  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    throw err;
  } finally {
    if (shouldClose && conn) {
      await conn.end();
    }
  }
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeed()
    .then(() => {
      console.log('✨ Database is completely initialized and ready.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal error during seed:', err);
      process.exit(1);
    });
}

export default runSeed;
