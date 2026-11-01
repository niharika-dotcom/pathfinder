# 🧭 PathFinder: Gen-Z Career Navigator & Skill Gap Analyzer

> **B.Tech Final Year Capstone Project**  
> A full-stack, zero-external-UI web application designed to help 2nd and 3rd year engineering students eliminate career confusion, choose between coding, non-coding, and civil services/govt paths, evaluate skill gaps, and follow verified roadmaps with mini-quiz progress gates and daily habit streaks.

---

## 📋 1. Problem Statement & Purpose

Engineering students across universities frequently encounter severe career decision paralysis:
- **Coding vs. Non-Coding Tech vs. Public Sector:** Students struggle to decide whether to pursue software engineering (heavy coding), data analytics / product management (low/moderate coding), UI/UX design (creative non-coding), QA automation, or competitive civil services/banking exams.
- **Unverified & Vague Learning Tracks:** Traditional roadmap sites provide static lists without testing student comprehension. Students check off boxes without actually learning the concepts.
- **Unidentified Skill Competency Gaps:** Students lack a structured self-rating tool against industry benchmarks to know where their resume falls short before campus placement drives.
- **Lack of Placement Practice Consistency:** Inconsistent study habits lead to last-minute panic before campus recruitment.

**PathFinder** solves this end-to-end with an evidence-based recommendation quiz, 7 career roadmaps with **mandatory 3-question mini-quiz verification gates**, a transparent **Campus Readiness Score**, Duolingo-style daily habit streaks, credible cited salary benchmarks, and an admin management dashboard.

---

## 🛠️ 2. Strict Tech Stack (No External UI Libraries)

| Layer | Technology | Technical Constraints Followed |
|---|---|---|
| **Frontend** | **React.js 18 (Vite)** | • React hooks only (`useState`, `useEffect`)<br>• Plain CSS only (zero UI libraries, no Tailwind, no Bootstrap, no Lucide)<br>• No TypeScript<br>• No router library (clean state-based view switching) |
| **Backend** | **Node.js + Express.js** | • Clean RESTful API architecture<br>• JSON request/response handling<br>• Stateless JWT authentication middleware |
| **Database** | **MySQL (Strict Only)** | • `mysql2/promise` connection pool<br>• Normalized relational schema with Foreign Keys and `ON DELETE CASCADE`<br>• No in-memory fallback; fails fast if MySQL is unreachable |
| **Security & Utilities** | **jwt, bcrypt, cors, dotenv** | • `bcryptjs` for secure password hashing<br>• `jsonwebtoken` for stateless auth & role-based access control<br>• `cors` & `dotenv` for environment configuration |

---

## 🏗️ 3. System Architecture Diagram (ASCII)

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CLIENT BROWSER (React 18 + Vite)                     │
│  State Views: [Dashboard | Careers | Roadmap | SkillGap | Quiz | Admin]│
│  Components: Trail Roadmap, Quiz Verification Modal, Theme Toggle      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST (JSON)
                                    │ Authorization: Bearer <JWT>
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   EXPRESS REST API SERVER (Node.js)                    │
│                                                                        │
│  ├── Auth Middleware: JWT Verification & Admin Role Guard              │
│  ├── /api/auth: Register & Login (bcryptjs hashing)                    │
│  ├── /api/careers: Filtering by Coding Level & Category                │
│  ├── /api/roadmaps: 3-Phase Milestones with Quiz Pass Gate Status      │
│  ├── /api/milestones/:id/quiz: 3-Question Verification Gate            │
│  ├── /api/user/progress: Enforces Quiz Pass Check (HTTP 403 on bypass) │
│  ├── /api/user/streak: Duolingo-style Streak Rule Calculator           │
│  ├── /api/skill-gap: 1-5 Benchmark Competency Gap Formula              │
│  └── /api/admin: Full CRUD for Careers, Milestones & Questions         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Connection Pool (mysql2/promise)
                                    │ Strict Parameterized SQL
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 MYSQL RELATIONAL DATABASE (pathfinder_db)              │
│                                                                        │
│  Tables: users, career_paths, milestones, user_milestone_progress,     │
│          daily_streaks, career_skills, user_skill_ratings,             │
│          quiz_questions, quiz_options, option_weights,                 │
│          milestone_questions, milestone_quiz_attempts                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ 4. Relational Database Schema & Relationships

```
┌─────────────────┐       ┌─────────────────┐       ┌────────────────────────┐
│      users      │       │  career_paths   │       │     daily_streaks      │
├─────────────────┤       ├─────────────────┤       ├────────────────────────┤
│ id (PK)         │◄──┐   │ id (PK)         │◄──┐   │ id (PK)                │
│ name            │   │   │ title           │   │   │ user_id (FK) ──────────┼──► users(id)
│ email (UNIQUE)  │   │   │ category        │   │   │ last_active_date       │
│ password_hash   │   │   │ coding_level    │   │   │ streak_count           │
│ role            │   │   │ min_salary      │   │   └────────────────────────┘
│ target_career_id│───┼──►│ max_salary      │   │
│ created_at      │   │   │ demand_tag      │   │   ┌────────────────────────┐
└─────────────────┘   │   │ description     │   │   │     quiz_questions     │
                      │   │ daily_work      │   │   ├────────────────────────┤
                      │   │ source_note     │   │   │ id (PK)                │
                      │   │ salary_source   │   │   │ question_text          │
                      │   │ last_verified   │   │   └────────────────────────┘
                      │   └─────────────────┘   │               ▲
                      │            ▲            │               │
                      │            │            │   ┌───────────┴────────────┐
┌─────────────────────┼─────┐      │            │   │      quiz_options      │
│ user_milestone_progress   │      │            │   ├────────────────────────┤
├───────────────────────────┤      │            │   │ id (PK)                │
│ id (PK)                   │      │            │   │ question_id (FK)       │
│ user_id (FK) ─────────────┼──────┘            │   │ option_text            │
│ milestone_id (FK) ────────┼───┐               │   └────────────────────────┘
│ status                    │   │               │               ▲
│ proof_note                │   │               │               │
│ completed_at              │   │               │   ┌───────────┴────────────┐
└───────────────────────────┘   │               │   │     option_weights     │
                                │               │   ├────────────────────────┤
┌───────────────────────────┐   │               │   │ option_id (FK)         │
│        milestones         │   │               └───┼─career_id (FK)         │
├───────────────────────────┤   │                   │ weight                 │
│ id (PK) ──────────────────┼───┘                   └────────────────────────┘
│ career_id (FK) ───────────┼───────────────────┐
│ phase_number (1, 2, 3)    │                   │   ┌────────────────────────┐
│ title                     │                   │   │   career_skills        │
│ resource_url              │                   │   ├────────────────────────┤
└───────────────────────────┘                   └──►│ id (PK)                │
         ▲                 ▲                        │ career_id (FK)         │
         │                 │                        │ skill_name             │
┌────────┴─────────────┐   │                        │ required_level (1..5)  │
│ milestone_questions  │   │                        └────────────────────────┘
├──────────────────────┤   │                                     ▲
│ id (PK)              │   │                                     │
│ milestone_id (FK)    │   │                        ┌────────────┴───────────┐
│ question_text        │   │                        │   user_skill_ratings   │
│ option_a             │   │                        ├────────────────────────┤
│ option_b             │   │                        │ id (PK)                │
│ option_c             │   │                        │ user_id (FK) ──────────┼──► users(id)
│ option_d             │   │                        │ career_skill_id (FK)   │
│ correct_option (a..d)│   │                        │ rating (1..5)          │
└──────────────────────┘   │                        └────────────────────────┘
                           │
┌──────────────────────────┴───────────────┐
│        milestone_quiz_attempts           │
├──────────────────────────────────────────┤
│ id (PK)                                  │
│ user_id (FK) ────────────────────────────┼──► users(id)
│ milestone_id (FK)                        │
│ score (0..3)                             │
│ total (3)                                │
│ passed (BOOLEAN, score >= 2)             │
│ attempted_at                             │
└──────────────────────────────────────────┘
```

---

## 🎯 5. 7 Seeded Careers & Data Credibility Citations

Every career path features realistic LPA salary ranges with public source citations and recent verification dates (`2026-11-01`):

| Career Path | Category | Coding Level | Approximate CTC (LPA) | Public Data Source Cited | Last Checked |
|---|---|---|---|---|---|
| **Data Analyst** | Tech | Some | ₹5.5 - ₹14.0 LPA | AmbitionBox / Naukri India Fresher Analyst Benchmark | 2026-11-01 |
| **Software Developer** | Tech | Heavy | ₹7.5 - ₹24.0 LPA | Glassdoor India / Levels.fyi Campus SDE Index | 2026-11-01 |
| **QA / Test Engineer** | Tech | Some | ₹5.0 - ₹12.5 LPA | AmbitionBox / Naukri QA Automation Survey | 2026-11-01 |
| **Business / Product Analyst** | Non-Tech | None | ₹6.0 - ₹15.0 LPA | PayScale / LinkedIn Entry-Level APM Survey | 2026-11-01 |
| **UI/UX Designer** | Non-Tech | None | ₹5.0 - ₹14.5 LPA | Dribbble / Glassdoor Junior Product Designer Index | 2026-11-01 |
| **Cloud / DevOps Engineer** | Tech | Some | ₹7.0 - ₹20.0 LPA | AmbitionBox / Upwork Cloud Practitioner Fresher Index | 2026-11-01 |
| **Govt Exams (Group-2 / Bank PO)** | Govt | None | ₹6.0 - ₹16.0 LPA | IBPS & State Public Service Commission Gazette Pay Scales | 2026-11-01 |

---

## 🚀 6. Core Features Implemented

### 1. Verification Mini-Quiz Gate (Progress Integrity)
- Ticking a roadmap step opens a **Verification Modal** containing:
  - **3 factually accurate, beginner-level multiple-choice questions** specific to that milestone.
  - A reflection textarea: *"What did you learn from this step? (minimum 20 characters required)"*.
- **Strict Server Evaluation:**
  - Pass threshold is **at least 2 out of 3**.
  - On failure: Displays current score (e.g., `Score: 1/3`), advises the student to study the free resource, and does **not** reveal correct answers.
  - On pass: Submits the step as completed along with the `proof_note`.
- **Security Check:** If a user attempts to call `POST /api/user/progress` without having a passed attempt in `milestone_quiz_attempts`, the API rejects the request with **HTTP 403 Forbidden** (`"Pass the mini quiz to complete this step"`).
- Completed steps display a green `✓ Quiz Passed` badge and show the saved reflection note:  
  💬 *What I Learned:* `"Mastered VLOOKUP, modern XLOOKUP, Pivot table summaries and data normalization..."`
- Unticking a step to undo is always permitted.

### 2. Readiness Score & Streak Transparency ("How It Works")
Accessible via the **"ℹ️ How It Works"** button:
- **Campus Readiness Score Formula:**
  $$\text{Readiness Score (\%)} = \left(\frac{\text{Completed Steps}}{\text{Total Steps}}\right) \times 100$$
- **Daily Streak Rules (Duolingo Style):**
  - **Same Calendar Day:** Streak remains unchanged (no duplicate increments).
  - **Consecutive Day (Yesterday):** Streak increments by `+1` day.
  - **Missed Day (> 1 Day):** Streak resets to `1` day.
  - Maintained by: passing milestone verification quizzes, updating skill ratings, or clicking `"🔥 I Practised Today"`.

### 3. Career Recommendation Quiz
- 5 weighted questions covering logic/math comfort, coding preference, work environment stability, favorite daily activity, and preferred study style.
- Returns a ranked match list with percentages (e.g. *96% Match for Data Analyst*).

### 4. Interactive Skill Gap Analyzer
- Evaluates 5 industry benchmark competencies per career (1 to 5 scale).
- Students self-rate their proficiency to calculate their exact **Gap %**:
  $$\text{Gap (\%)} = \max\left(0, \frac{\text{Required} - \text{Rating}}{\text{Required}} \times 100\right)$$

### 5. Admin Panel (Full CRUD)
- **Careers:** Create, Edit (including salary sources and verification dates), and Delete.
- **Milestones:** Create, Edit, and Delete across Phases 1, 2, and 3.
- **Verification Questions:** View all questions with `correct_option`, Create new questions, Edit options, and Delete questions.

---

## 📡 7. Full REST API Reference & Example Requests

### 1. Authentication

#### Register Student
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "Kavya Reddy",
  "email": "kavya@university.edu",
  "password": "password123",
  "role": "student",
  "target_career_id": 1
}
```
*Response (201 Created):*
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": { "id": 3, "name": "Kavya Reddy", "email": "kavya@university.edu", "role": "student", "target_career_id": 1 }
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{ "email": "student@pathfinder.com", "password": "student123" }
```
*Response (200 OK):* Returns JWT token and user profile.

---

### 2. Careers Catalog & Quiz

#### Fetch Careers
```bash
GET /api/careers?coding=some&category=tech
```
*Response (200 OK):* Returns filtered careers with `salary_source` and `last_verified`.

#### Submit Career Preference Quiz
```bash
POST /api/quiz/submit
Authorization: Bearer <TOKEN>
Content-Type: application/json

{ "answers": { "1": 1, "2": 6, "3": 9, "4": 14, "5": 18 } }
```
*Response (200 OK):*
```json
{
  "success": true,
  "top_match": { "career_id": 1, "title": "Data Analyst", "match_percentage": 96 },
  "rankings": [ ... ]
}
```

---

### 3. Roadmaps & Milestone Verification

#### Fetch Roadmap
```bash
GET /api/roadmaps/1
Authorization: Bearer <TOKEN>
```
*Response (200 OK):* Returns career details, readiness score, and 6 milestones with `is_completed`, `quiz_passed`, and `proof_note`.

#### Fetch Milestone Verification Questions (Student View)
```bash
GET /api/milestones/1/questions
Authorization: Bearer <TOKEN>
```
*Response (200 OK):* Excludes `correct_option` to prevent cheating.
```json
{
  "success": true,
  "milestoneId": 1,
  "total": 3,
  "has_passed": true,
  "questions": [
    { "id": 1, "question_text": "What does the first argument of VLOOKUP specify?", "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "..." }
  ]
}
```

#### Submit Milestone Verification Quiz
```bash
POST /api/milestones/1/quiz
Authorization: Bearer <TOKEN>
Content-Type: application/json

{ "answers": ["a", "b", "b"] }
```
*Response on Pass (200 OK):*
```json
{
  "success": true,
  "score": 3,
  "total": 3,
  "passed": true,
  "message": "Passed! You scored 3/3. You can now complete this milestone."
}
```
*Response on Fail (200 OK):*
```json
{
  "success": true,
  "score": 1,
  "total": 3,
  "passed": false,
  "message": "You scored 1/3. At least 2/3 is required to pass. Please review the learning resource and try again."
}
```

#### Mark Milestone Completed (Enforces Passed Quiz Attempt)
```bash
POST /api/user/progress
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "milestoneId": 1,
  "status": "completed",
  "proof_note": "Mastered VLOOKUP, modern XLOOKUP, and Pivot table aggregations."
}
```
*Response if quiz not passed (403 Forbidden):*
```json
{ "success": false, "error": "Pass the mini quiz to complete this step" }
```
*Response if quiz passed (200 OK):*
```json
{
  "success": true,
  "milestoneId": 1,
  "status": "completed",
  "proof_note": "Mastered VLOOKUP...",
  "readiness_score": 17,
  "streak": { "streak_count": 4, "is_new": true }
}
```

---

### 4. Admin Management (Admin Token Required)

- `GET /api/admin/milestones/:id/questions` — View questions including `correct_option`.
- `POST /api/admin/milestones/:id/questions` — Add question (`{ question_text, option_a, option_b, option_c, option_d, correct_option: 'a' }`).
- `PUT /api/admin/questions/:id` — Update question text/options.
- `DELETE /api/admin/questions/:id` — Delete question.
- `POST /api/admin/careers` & `PUT /api/admin/careers/:id` — Manage career paths.
- `POST /api/admin/milestones` & `PUT /api/admin/milestones/:id` — Manage roadmap steps.

---

## 💻 8. Setup & Run Instructions for Windows

### Prerequisites
1. **Node.js** (v18.0 or newer)
2. **MySQL Server** (v8.0+ or v9.x) installed and running locally on port `3306`

---

### Step 1: Fix Windows PowerShell Execution Policy (If Needed)
If running `npm` commands shows `File cannot be loaded because running scripts is disabled on this system`:
Open PowerShell and run:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
*(Or invoke `npm.cmd` instead of `npm`).*

---

### Step 2: Configure Environment Variables
Inside `backend/.env`, set your local MySQL credentials:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=pathfinder_super_secret_jwt_key_btech_2026

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=YOUR_MYSQL_PASSWORD_HERE
DB_NAME=pathfinder_db
DB_CONNECTION_LIMIT=10
```

---

### Step 3: Initialize & Seed MySQL Database
Run the automated seed script to create the schema and populate all 7 careers, 42 milestones, 35 skills, and 126 verification questions:
```powershell
cd backend
node seed.js
```

---

### Step 4: Run Automated Verification Tests
Run the 19-stage integration test suite:
```powershell
cd backend
node test.js
```

---

### Step 5: Start Backend and Frontend Servers

**Terminal 1 — Backend API Server:**
```powershell
cd backend
node server.js
```
*Backend runs on: `http://localhost:5000`*

**Terminal 2 — Frontend Vite Server:**
```powershell
cd frontend
npm.cmd run dev
```
*Frontend runs on: `http://localhost:5173`*

Open your browser at:  
👉 **`http://localhost:5173`**

---

## 🔑 9. Demo Accounts for Evaluation

| Role | Email | Password | Access Capabilities |
|---|---|---|---|
| **Admin** | `admin@pathfinder.com` | `admin123` | Full access + Admin Panel (CRUD for Careers, Milestones, and Quiz Questions) |
| **Student** | `student@pathfinder.com` | `student123` | Dashboard, Quiz, Career Explorer, Roadmap Trail, Mini-Quiz Gates, Skill Gap Analyzer |

*(1-click demo buttons are available on the Sign In screen for viva evaluators).*

---

## 🔍 10. Limitations & Future Work

1. **Verification Boundary:**
   - *Current Implementation:* Students' learning outside the application is verified by in-app 3-question conceptual mini quizzes and written reflection notes.
   - *Future Work:* Integration with GitHub API to verify commits pushed to portfolio repositories and automatic code execution sandboxes.
2. **Salary Data Scope:**
   - *Current Implementation:* Salary figures are provided as entry-level fresher ranges and explicitly cited from public surveys (AmbitionBox, Glassdoor, PayScale, IBPS Gazettes) with check dates.
   - *Future Work:* Integration with live job board APIs (e.g., LinkedIn Jobs, Adzuna) for dynamic real-time market CTC updates.
3. **Automated Mentorship:**
   - *Future Work:* Integration with AI career mentor agents to critique student resume bullets and suggest customized project ideas based on the skill gap analyzer.
