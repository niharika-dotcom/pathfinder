import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

let pool = null;
let isMysqlLive = false;

// Seed dataset for immediate resilience
const inMemoryStore = {
  career_roles: [
    {
      id: 1,
      title: 'Full Stack Developer',
      category: 'Tech-Coding',
      salary_range: '₹8 - ₹24 LPA',
      demand_level: 'Very High',
      description: 'Architect modern, high-performance web applications using end-to-end JavaScript/TypeScript, React, Node.js, and relational databases. High demand across global startups and product MNCs.'
    },
    {
      id: 2,
      title: 'Data Analyst',
      category: 'Analytics',
      salary_range: '₹6.5 - ₹16 LPA',
      demand_level: 'Exploding',
      description: 'Transform raw enterprise telemetry into actionable intelligence using SQL, Power BI, Python, and data storytelling. Essential across fintech, e-commerce, and healthcare sectors.'
    },
    {
      id: 3,
      title: 'Product & QA Specialist',
      category: 'Tech-NonCoding',
      salary_range: '₹6 - ₹15 LPA',
      demand_level: 'High Demand',
      description: 'Drive product quality, write comprehensive test cases, validate REST APIs, and bridge engineering with user expectations. Zero heavy coding barrier with rapid career growth into Product Management.'
    },
    {
      id: 4,
      title: 'Civil Services (APPSC / UPSC Aspirant)',
      category: 'CivilServices-Govt',
      salary_range: '₹7 - ₹18 LPA + Perks',
      demand_level: 'Prestigious',
      description: 'Serve the public and shape state/national governance as an administrative officer. Structured curriculum covering Polity, Constitution, Current Affairs, and CSAT Aptitude.'
    }
  ],
  milestones: [
    // Full Stack Developer (Role 1)
    {
      id: 1,
      role_id: 1,
      phase_num: 1,
      phase_name: 'Phase 1: Fundamentals',
      title: 'Modern Web Core & Semantic HTML/CSS Layouts',
      description: 'Master responsive viewports, CSS grid, flexbox, and modern Tailwind utility classes.',
      content_summary: '• Semantic HTML elements (<main>, <article>, <section>, <nav>) improve accessibility and SEO rankings.\n• Flexbox is one-dimensional (row or column); CSS Grid is two-dimensional (rows AND columns simultaneously).\n• Mobile-first design: write base styles for mobile screens, then use responsive breakpoints (md:, lg: in Tailwind).\n• Key CSS Units: rem (relative to root font-size), em (relative to parent), vh/vw (viewport height/width).',
      resource_link: 'https://developer.mozilla.org/en-US/docs/Learn/HTML',
      reading_time: '8 mins read'
    },
    {
      id: 2,
      role_id: 1,
      phase_num: 1,
      phase_name: 'Phase 1: Fundamentals',
      title: 'JavaScript Deep Dive & Asynchronous ES6+',
      description: 'Master closures, event loop, Promises, Async/Await, and modern array manipulation.',
      content_summary: '• Execution Context: JavaScript is single-threaded; execution context consists of Variable Environment and Thread of Execution.\n• Closures: A function remembers its outer lexical scope variables even after the outer function has executed.\n• Event Loop: Call stack executes synchronous code first; Microtask queue (Promises) executes before Macrotask queue (setTimeout).\n• Immutability: Use array methods like .map(), .filter(), .reduce() instead of mutating arrays directly.',
      resource_link: 'https://javascript.info/',
      reading_time: '12 mins read'
    },
    {
      id: 3,
      role_id: 1,
      phase_num: 2,
      phase_name: 'Phase 2: Core Tools & Hands-on Implementation',
      title: 'Frontend Engineering with React 19 & Vite',
      description: 'Build reactive SPAs, custom hooks, context management, component composition, and client routing.',
      content_summary: '• Component Lifecycle & Hooks: useState for reactive state, useEffect for side-effects, useCallback/useMemo for performance memoization.\n• Unidirectional Data Flow: State flows down via props; changes flow up via callbacks.\n• Rules of Hooks: Only call hooks at top level of React functions; never inside loops or conditional blocks.\n• Vite advantage: Native ES module loading provides instant Hot Module Replacement (HMR) without full bundling delay.',
      resource_link: 'https://react.dev/learn',
      reading_time: '15 mins read'
    },
    {
      id: 4,
      role_id: 1,
      phase_num: 2,
      phase_name: 'Phase 2: Core Tools & Hands-on Implementation',
      title: 'Scalable Backend REST APIs with Node.js & Express',
      description: 'Build modular controllers, middleware chains, JWT session validation, and robust error handlers.',
      content_summary: '• REST Principles: Stateless client-server architecture, standard HTTP verbs (GET: safe/idempotent, POST: create, PUT/PATCH: update, DELETE: idempotent).\n• Middleware Pattern: Functions with access to (req, res, next); order of app.use() declaration matters significantly.\n• Security: Always sanitize inputs, use parameterized SQL queries to prevent SQL injections, and apply CORS restrictions.\n• Error Handling: Centralized error middleware (err, req, res, next) prevents server crashes on unhandled exceptions.',
      resource_link: 'https://expressjs.com/en/starter/installing.html',
      reading_time: '12 mins read'
    },
    {
      id: 5,
      role_id: 1,
      phase_num: 3,
      phase_name: 'Phase 3: Real-World Applications & Interview Readiness',
      title: 'Relational MySQL Architecture, CI/CD & Cloud Deployment',
      description: 'Write normalized relational schemas, indexing, foreign key constraints, connection pooling, and Dockerize.',
      content_summary: '• Database Normalization: 1NF (atomic values), 2NF (remove partial dependencies), 3NF (remove transitive dependencies).\n• Connection Pooling: Reusing pre-created database connections avoids the expensive TCP handshake latency per request.\n• Indexing Strategies: B-Tree indexes speed up WHERE, JOIN, and ORDER BY queries, but increase INSERT/UPDATE overhead.\n• Production Checklist: Health-check endpoints, rate-limiting, environment variable isolation, and automated tests.',
      resource_link: 'https://roadmap.sh/full-stack',
      reading_time: '14 mins read'
    },

    // Data Analyst (Role 2)
    {
      id: 6,
      role_id: 2,
      phase_num: 1,
      phase_name: 'Phase 1: Fundamentals',
      title: 'Advanced Excel & Business Data Cleaning',
      description: 'Master VLOOKUP, XLOOKUP, pivot tables, data normalization, conditional logic, and KPI dashboards.',
      content_summary: '• XLOOKUP vs VLOOKUP: XLOOKUP works left and right, defaults to exact match, and does not break when columns are inserted.\n• Pivot Tables: Fast multi-dimensional aggregations without writing complex formulas; always set data source as Excel Table (Ctrl+T).\n• Data Hygiene: Handling NULL values, trimming whitespace, standardizing date formats (YYYY-MM-DD), and removing duplicates.\n• Business KPIs: Calculating Customer Acquisition Cost (CAC), Lifetime Value (LTV), Churn Rate, and MoM Growth.',
      resource_link: 'https://www.youtube.com/watch?v=OOWAk2aLEfk',
      reading_time: '10 mins read'
    },
    {
      id: 7,
      role_id: 2,
      phase_num: 1,
      phase_name: 'Phase 1: Fundamentals',
      title: 'Relational SQL for Analytical Queries',
      description: 'Write multi-table INNER/LEFT joins, GROUP BY aggregations, window functions (RANK, ROW_NUMBER), and CTEs.',
      content_summary: '• Join Logic: INNER JOIN returns matched rows; LEFT JOIN preserves all left-table records even if right table is NULL.\n• Window Functions: ROW_NUMBER(), RANK(), DENSE_RANK() partition calculations across row sets without collapsing rows like GROUP BY.\n• CTEs (Common Table Expressions): WITH subquery AS (...) creates readable modular pipelines over deeply nested subqueries.\n• HAVING vs WHERE: WHERE filters rows BEFORE aggregation; HAVING filters groups AFTER GROUP BY.',
      resource_link: 'https://mode.com/sql-tutorial/',
      reading_time: '12 mins read'
    },
    {
      id: 8,
      role_id: 2,
      phase_num: 2,
      phase_name: 'Phase 2: Core Tools & Hands-on Implementation',
      title: 'Business Intelligence with Power BI & Tableau',
      description: 'Design executive summary dashboards, DAX formulas, drill-down charts, and data storytelling visuals.',
      content_summary: '• Star Schema: Fact tables (numerical transactions/measurements) surrounded by Dimension tables (lookup attributes like date, customer).\n• DAX Essentials: Calculated Columns are computed during data refresh (in-memory); Measures are computed on-the-fly dynamically.\n• Visual Hierarchy: Top-level summary KPI cards ➔ trend line charts ➔ granular breakdown tables at the bottom.\n• Actionable Storytelling: Avoid chart junk; use contrasting accent colors only for key insights or anomaly alerts.',
      resource_link: 'https://learn.microsoft.com/en-us/training/powerplatform/power-bi',
      reading_time: '15 mins read'
    },
    {
      id: 9,
      role_id: 2,
      phase_num: 2,
      phase_name: 'Phase 2: Core Tools & Hands-on Implementation',
      title: 'Python for Exploratory Data Analysis (EDA)',
      description: 'Analyze real-world Kaggle datasets using Pandas, NumPy, Matplotlib, and Seaborn for statistical insights.',
      content_summary: '• Pandas Core: Series (1D) and DataFrame (2D); df.info(), df.describe(), df.isnull().sum() are first-step diagnostics.\n• Vectorization: NumPy vectorized operations run in compiled C speed; avoid using for-loops over DataFrame rows.\n• Outlier Detection: Using Interquartile Range (IQR = Q3 - Q1); data points < Q1 - 1.5*IQR or > Q3 + 1.5*IQR are outliers.\n• Correlation vs Causation: df.corr() detects linear relationships, but always plot scatter distributions with Seaborn.',
      resource_link: 'https://www.kaggle.com/learn/python',
      reading_time: '14 mins read'
    },
    {
      id: 10,
      role_id: 2,
      phase_num: 3,
      phase_name: 'Phase 3: Real-World Applications & Interview Readiness',
      title: 'Capstone Business Case Study & Placement Portfolio',
      description: 'Publish an end-to-end business churn or sales analytics report with live dashboard link on GitHub/LinkedIn.',
      content_summary: '• Problem Framing: Translate vague business questions (e.g. "Why are sales dipping?") into measurable metrics.\n• Executive Summary: Structure recommendations into: 1. Core Problem, 2. Quantified Evidence, 3. Proposed Strategic Interventions.\n• Portfolio Polish: Clean GitHub README with problem statement, methodology, interactive dashboard screenshots, and reproducible code.\n• Interview Prep: Be prepared to walk through your toughest data cleaning roadblock and explain your metric choices.',
      resource_link: 'https://github.com/veb-analytics/awesome-data-analytics',
      reading_time: '12 mins read'
    },

    // Product & QA Specialist (Role 3)
    {
      id: 11,
      role_id: 3,
      phase_num: 1,
      phase_name: 'Phase 1: Fundamentals',
      title: 'Software Testing Life Cycle (STLC) & Agile Rituals',
      description: 'Learn test case design, boundary value analysis, equivalence partitioning, Jira issue tracking, and sprint rituals.',
      content_summary: '• SDLC vs STLC: SDLC encompasses the entire product creation; STLC is a subset dedicated specifically to verification and validation.\n• Boundary Value Analysis (BVA): Most bugs occur at boundary edges (e.g., if valid age is 18-60, test 17, 18, 19, 59, 60, 61).\n• Equivalence Class Partitioning (ECP): Divide inputs into valid and invalid classes to minimize redundant test executions.\n• Agile Ceremonies: Sprint Planning, Daily Standup (15m), Sprint Review/Demo, and Sprint Retrospective (inspect & adapt).',
      resource_link: 'https://www.guru99.com/software-testing.html',
      reading_time: '10 mins read'
    },
    {
      id: 12,
      role_id: 3,
      phase_num: 1,
      phase_name: 'Phase 1: Fundamentals',
      title: 'REST API Testing with Postman & Newman',
      description: 'Execute automated API test scripts, validate HTTP headers, verify JSON response payloads, and mock responses.',
      content_summary: '• HTTP Status Code Mastery: 2xx Success (200 OK, 201 Created), 4xx Client Errors (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found), 5xx Server Errors (500 Internal Error, 503 Unavailable).\n• Assertions in Postman: pm.test("Status is 200", () => pm.response.to.have.status(200));\n• Environment Variables: Parameterize base URLs and auth tokens between Dev, Staging, and Production.\n• Newman CLI: Run Postman collections in CI/CD terminal pipelines with automated HTML test reports.',
      resource_link: 'https://learning.postman.com/docs/getting-started/introduction/',
      reading_time: '12 mins read'
    },
    {
      id: 13,
      role_id: 3,
      phase_num: 2,
      phase_name: 'Phase 2: Core Tools & Hands-on Implementation',
      title: 'Product Management Essentials & PRD Drafting',
      description: 'Write clear Product Requirement Documents (PRDs), user stories, acceptance criteria, and Figma wireframes.',
      content_summary: '• User Story Format: "As a <type of user>, I want <some goal> so that <some reason/benefit>."\n• Acceptance Criteria (Gherkin syntax): Given <context>, When <action performed>, Then <expected outcome>.\n• Prioritization Frameworks: RICE (Reach, Impact, Confidence, Effort) and MoSCoW (Must have, Should have, Could have, Won\'t have).\n• Wireframing Basics: Focus on information architecture and user flow before high-fidelity visual UI styling.',
      resource_link: 'https://www.productplan.com/learn/product-management-guide/',
      reading_time: '14 mins read'
    },
    {
      id: 14,
      role_id: 3,
      phase_num: 2,
      phase_name: 'Phase 2: Core Tools & Hands-on Implementation',
      title: 'End-to-End Test Automation Kickstart with Cypress',
      description: 'Understand automated browser interactions using Cypress or Playwright for critical user checkout flows.',
      content_summary: '• Locator Strategies: Prefer custom test attributes like data-cy="submit-btn" over dynamic CSS classes or brittle XPath.\n• Cypress Test Flow: cy.visit(), cy.get(), cy.type(), cy.click(), and cy.should("be.visible").\n• Async Waiting: Cypress automatically waits for DOM elements to appear; avoid hardcoded cy.wait(5000).\n• Regression Testing: Automate repetitive test suites to guarantee existing features remain intact across new releases.',
      resource_link: 'https://docs.cypress.io/guides/overview/why-cypress',
      reading_time: '15 mins read'
    },
    {
      id: 15,
      role_id: 3,
      phase_num: 3,
      phase_name: 'Phase 3: Real-World Applications & Interview Readiness',
      title: 'Release Management, UAT & Product Analytics',
      description: 'Coordinate User Acceptance Testing (UAT), analyze funnel metrics with Mixpanel, and manage production rollouts.',
      content_summary: '• User Acceptance Testing (UAT): Final testing phase conducted by end-users or product owners to ensure real business needs are met.\n• Funnel Analysis: Identifying drop-off stages in onboarding or checkout flows (e.g. Signup ➔ Add to Cart ➔ Checkout ➔ Payment).\n• Bug Severity vs Priority: Severity = technical impact on system; Priority = business urgency to resolve immediately.\n• Incident Post-Mortems: Blameless root cause analysis (5 Whys methodology) to prevent recurring production defects.',
      resource_link: 'https://www.atlassian.com/agile/project-management/user-stories',
      reading_time: '11 mins read'
    },

    // Civil Services (Role 4)
    {
      id: 16,
      role_id: 4,
      phase_num: 1,
      phase_name: 'Phase 1: Fundamentals',
      title: 'NCERT Foundation & Core Conceptual Clarity',
      description: 'Build deep conceptual clarity in Indian History, Physical Geography, Basic Economy, and Environmental Ecology.',
      content_summary: '• History: Chronological breakdown: Ancient (Indus Valley, Vedic, Mauryan), Medieval (Delhi Sultanate, Mughals, Bhakti Movement), Modern (1857 Revolt, Freedom Struggle, Gandhi Era).\n• Geography: Geomorphology (plate tectonics, earthquakes), Climatology (monsoons, El Niño), Indian drainage systems and soil types.\n• Economy: National Income concepts (GDP, GNP, NNP), Inflation types, Repo rate, Monetary Policy Committee (MPC) mandates.\n• Note-making Principle: NCERTs provide the conceptual spine; integrate static facts with current application.',
      resource_link: 'https://ncert.nic.in/textbook.php',
      reading_time: '12 mins read'
    },
    {
      id: 17,
      role_id: 4,
      phase_num: 1,
      phase_name: 'Phase 1: Fundamentals',
      title: 'Indian Polity & Constitutional Framework (Laxmikanth)',
      description: 'Comprehensive study of Fundamental Rights, Directive Principles, Parliamentary system, and Judiciary powers.',
      content_summary: '• Preamble & Basic Structure: Sovereign, Socialist, Secular, Democratic, Republic. Kesavananda Bharati case (1973) established Basic Structure Doctrine.\n• Fundamental Rights (Part III): Articles 14-18 (Equality), 19-22 (Freedom), 23-24 (Exploitation), 25-28 (Religion), 32 (Constitutional Remedies / Writs).\n• Parliamentary System: Executive is directly responsible to the Legislature (Lok Sabha); Doctrine of Separation of Powers with Checks & Balances.\n• Emergency Provisions: National Emergency (Art 352), President\'s Rule (Art 356), Financial Emergency (Art 360).',
      resource_link: 'https://epgp.inflibnet.ac.in/',
      reading_time: '16 mins read'
    },
    {
      id: 18,
      role_id: 4,
      phase_num: 2,
      phase_name: 'Phase 2: Core Tools & Hands-on Implementation',
      title: 'Daily Current Affairs & Editorial Synthesis',
      description: 'Analyze daily editorials from The Hindu / Indian Express, Press Information Bureau (PIB), and monthly Yojana.',
      content_summary: '• Syllabus Filter: Read newspapers strictly through the lens of GS Papers (GS 1: Heritage/Geo/Society, GS 2: Governance/Polity/IR, GS 3: Tech/Eco/Env/Security).\n• Issue-based Synthesis: Don\'t make notes on political events; focus on constitutional implications, committee recommendations, and global treaties.\n• Government Schemes: Target objective, nodal ministry, beneficiary criteria, budget outlay, and measurable challenges.\n• International Relations: Bilateral relationships with neighbors, QUAD, BRICS, G20 outcomes, and UN institutional reforms.',
      resource_link: 'https://pib.gov.in/',
      reading_time: '15 mins read'
    },
    {
      id: 19,
      role_id: 4,
      phase_num: 2,
      phase_name: 'Phase 2: Core Tools & Hands-on Implementation',
      title: 'CSAT Aptitude & Analytical Reasoning Mastery',
      description: 'Target quantitative aptitude, data interpretation, logical reasoning, and reading comprehension for Prelims Paper 2.',
      content_summary: '• Qualifying Target: CSAT Paper 2 requires 33% (66 marks out of 200), but tricky comprehension and length make it a major hurdle.\n• High-Yield Quant: Percentages, Profit & Loss, Time and Work, Ratio and Proportion, Number Systems (remainders, divisibility rules).\n• Logical Reasoning: Syllogisms, blood relations, seating arrangements, coding-decoding, and critical statement assumptions.\n• Comprehension Strategy: Identify the main idea, inference vs direct fact, and avoid extreme assumptions not stated in the passage.',
      resource_link: 'https://unacademy.com/content/upsc/csat-syllabus/',
      reading_time: '14 mins read'
    },
    {
      id: 20,
      role_id: 4,
      phase_num: 3,
      phase_name: 'Phase 3: Real-World Applications & Interview Readiness',
      title: 'Mains Answer Writing & Ethics Case Studies',
      description: 'Practice time-bound 150-250 word analytical answers with diagrams, government committee citations, and ethics cases.',
      content_summary: '• Answer Framework: Introduction (definition/recent context) ➔ Body (multi-dimensional headings: Social, Economic, Political, Tech) ➔ Conclusion (forward-looking/SDGs).\n• Value Additions: Flowcharts, constitutional article quotes, 2nd ARC recommendations, NITI Aayog indices, and Supreme Court judgments.\n• GS 4 Ethics: Resolving administrative dilemmas using foundational values: Integrity, Impartiality, Compassion, Empathy, and Objectivity.\n• Time Management: 7 minutes for 10-marker (150 words); 11 minutes for 15-marker (250 words) to complete all 20 questions.',
      resource_link: 'https://upsc.gov.in/examinations/previous-question-papers',
      reading_time: '15 mins read'
    }
  ],
  practice_questions: [
    // Role 1: Full Stack Developer
    {
      id: 1,
      role_id: 1,
      topic: 'React Hooks',
      question: 'What is the primary difference between useEffect and useLayoutEffect in React?',
      code_snippet: null,
      options: [
        'useEffect runs synchronously before DOM paint; useLayoutEffect runs asynchronously after paint',
        'useLayoutEffect runs synchronously immediately after DOM mutations but before browser paint; useEffect runs asynchronously after paint',
        'useEffect is only for class components; useLayoutEffect is for functional components',
        'They are identical aliases in React 19'
      ],
      correct_index: 1,
      explanation: 'useLayoutEffect fires synchronously after all DOM mutations and before the browser paints the screen. It is ideal for reading DOM measurements and preventing visual flickers. useEffect fires asynchronously after paint.'
    },
    {
      id: 2,
      role_id: 1,
      topic: 'JavaScript Event Loop',
      question: 'What will be logged to the console by the following code snippet?',
      code_snippet: 'console.log("A");\nsetTimeout(() => console.log("B"), 0);\nPromise.resolve().then(() => console.log("C"));\nconsole.log("D");',
      options: [
        'A, B, C, D',
        'A, D, B, C',
        'A, D, C, B',
        'A, C, D, B'
      ],
      correct_index: 2,
      explanation: 'Synchronous code runs first (A, D). Then the microtask queue (Promise.then -> C) executes before macrotasks (setTimeout -> B). Hence output is A, D, C, B.'
    },
    {
      id: 3,
      role_id: 1,
      topic: 'REST API & HTTP',
      question: 'Which HTTP method is considered idempotent AND safe according to RFC 7231?',
      code_snippet: null,
      options: [
        'POST',
        'PATCH',
        'GET',
        'DELETE'
      ],
      correct_index: 2,
      explanation: 'GET is both safe (does not alter server state) and idempotent (making multiple identical requests produces the identical server state). DELETE is idempotent but not safe.'
    },
    {
      id: 4,
      role_id: 1,
      topic: 'Database Architecture',
      question: 'In MySQL, what is the main benefit of applying a composite B-Tree index on (department_id, salary)?',
      code_snippet: null,
      options: [
        'It makes queries filtering on salary only just as fast as filtering on department_id',
        'It optimizes queries filtering on department_id, or department_id AND salary in WHERE clauses',
        'It automatically encrypts the salary column',
        'It removes the need for primary keys'
      ],
      correct_index: 1,
      explanation: 'B-Tree composite indexes follow the leftmost prefix rule. An index on (department_id, salary) speeds up queries on department_id alone, or department_id AND salary, but not salary alone.'
    },

    // Role 2: Data Analyst
    {
      id: 5,
      role_id: 2,
      topic: 'SQL Window Functions',
      question: 'What is the difference between RANK() and DENSE_RANK() in SQL when handling tied values?',
      code_snippet: null,
      options: [
        'RANK() skips subsequent rank numbers after ties; DENSE_RANK() does not skip numbers',
        'DENSE_RANK() skips rank numbers; RANK() does not',
        'RANK() works only on integer columns; DENSE_RANK() works on text',
        'Both produce identical sequential rank numbers'
      ],
      correct_index: 0,
      explanation: 'When two rows tie for 1st place, RANK() gives both 1 and assigns 3 to the next row (skipping 2). DENSE_RANK() gives both 1 and assigns 2 to the next row without gaps.'
    },
    {
      id: 6,
      role_id: 2,
      topic: 'Excel Mastery',
      question: 'Why is XLOOKUP generally preferred over VLOOKUP in modern analytical reporting?',
      code_snippet: null,
      options: [
        'XLOOKUP can search from right-to-left and defaults to exact match without column index counting',
        'XLOOKUP requires sorted data whereas VLOOKUP does not',
        'VLOOKUP can only return numbers while XLOOKUP returns text',
        'XLOOKUP only works on mobile devices'
      ],
      correct_index: 0,
      explanation: 'XLOOKUP eliminates VLOOKUP column index counting, works in any direction (left or right), defaults to exact match, and does not break when columns are added or removed.'
    },
    {
      id: 7,
      role_id: 2,
      topic: 'Pandas Data Analysis',
      question: 'How do you correctly filter rows in a Pandas DataFrame where sales > 5000 and region is "South"?',
      code_snippet: '# df has columns: ["sales", "region"]',
      options: [
        'df[df.sales > 5000 and df.region == "South"]',
        'df[(df["sales"] > 5000) & (df["region"] == "South")]',
        'df.filter(sales > 5000, region == "South")',
        'df.where(sales > 5000 && region == "South")'
      ],
      correct_index: 1,
      explanation: 'In Pandas, logical AND requires the bitwise & operator and parentheses around each condition to handle operator precedence correctly in vectorized evaluation.'
    },
    {
      id: 8,
      role_id: 2,
      topic: 'Business Intelligence',
      question: 'In Power BI data modeling, why is a Star Schema favored over a normalized Snowflake schema for reporting?',
      code_snippet: null,
      options: [
        'Star schema consumes 100x less disk space',
        'Star schema simplifies DAX measures and optimizes analytical query performance through fewer table joins',
        'Star schema prevents data refresh errors',
        'Power BI does not support Snowflake schemas'
      ],
      correct_index: 1,
      explanation: 'Star schemas feature a centralized fact table connected directly to dimension tables. This minimizes join complexity, accelerates VertiPaq engine queries, and makes DAX formulas much simpler.'
    },

    // Role 3: Product & QA Specialist
    {
      id: 9,
      role_id: 3,
      topic: 'Test Design Techniques',
      question: 'A text input field accepts student age between 18 and 30 inclusive. Using 2-value Boundary Value Analysis, which values should be tested?',
      code_snippet: null,
      options: [
        '10, 20, 30, 40',
        '17, 18, 30, 31',
        '18, 24, 30',
        '0, 18, 30, 100'
      ],
      correct_index: 1,
      explanation: 'Boundary Value Analysis targets values immediately at and outside boundaries: lower edge (17, 18) and upper edge (30, 31).'
    },
    {
      id: 10,
      role_id: 3,
      topic: 'API Status Codes',
      question: 'A client sends a request without providing an Authorization bearer header to a protected route. What status code should the server return?',
      code_snippet: null,
      options: [
        '403 Forbidden',
        '401 Unauthorized',
        '400 Bad Request',
        '404 Not Found'
      ],
      correct_index: 1,
      explanation: '401 Unauthorized means authentication is missing or invalid. 403 Forbidden means the identity is known, but that user lacks permission to access the resource.'
    },
    {
      id: 11,
      role_id: 3,
      topic: 'Product Management',
      question: 'In the RICE prioritization framework for feature roadmaps, what do the letters stand for?',
      code_snippet: null,
      options: [
        'Return, Investment, Cost, Earnings',
        'Reach, Impact, Confidence, Effort',
        'Risk, Innovation, Capability, Efficiency',
        'Readiness, Implementation, Code, Execution'
      ],
      correct_index: 1,
      explanation: 'RICE score = (Reach × Impact × Confidence) / Effort. It provides an objective quantitative method to prioritize sprint backlogs.'
    },
    {
      id: 12,
      role_id: 3,
      topic: 'End-to-End Automation',
      question: 'What is the recommended best practice for selecting DOM elements in automated Cypress tests?',
      code_snippet: null,
      options: [
        'Use complex XPath selectors like //div[2]/span/button',
        'Use dynamic CSS classes generated by CSS-in-JS (e.g. .css-1a2b3c)',
        'Use dedicated custom attributes like data-cy or data-testid',
        'Select by tag name: cy.get("button").eq(3)'
      ],
      correct_index: 2,
      explanation: 'Using data-cy or data-testid isolates test locators from CSS visual redesigns or DOM hierarchy refactoring, preventing test flakiness.'
    },

    // Role 4: Civil Services (APPSC / UPSC)
    {
      id: 13,
      role_id: 4,
      topic: 'Indian Polity',
      question: 'Which landmark Supreme Court judgment established the "Basic Structure Doctrine" of the Indian Constitution?',
      code_snippet: null,
      options: [
        'Golaknath Case (1967)',
        'Kesavananda Bharati Case (1973)',
        'Minerva Mills Case (1980)',
        'Maneka Gandhi Case (1978)'
      ],
      correct_index: 1,
      explanation: 'In Kesavananda Bharati v. State of Kerala (1973), the Supreme Court ruled by a 7-6 majority that Parliament has the power to amend the Constitution, but cannot alter its Basic Structure.'
    },
    {
      id: 14,
      role_id: 4,
      topic: 'Fundamental Rights',
      question: 'Which Fundamental Right under the Indian Constitution is described as the "Heart and Soul of the Constitution" by Dr. B.R. Ambedkar?',
      code_snippet: null,
      options: [
        'Right to Equality (Article 14)',
        'Right to Freedom of Speech (Article 19)',
        'Right to Life & Personal Liberty (Article 21)',
        'Right to Constitutional Remedies (Article 32)'
      ],
      correct_index: 3,
      explanation: 'Dr. Ambedkar called Article 32 the "Heart and Soul of the Constitution" because without judicial remedies (Writs like Habeas Corpus, Mandamus, Quo Warranto), Fundamental Rights would be mere declarations.'
    },
    {
      id: 15,
      role_id: 4,
      topic: 'Indian Economy',
      question: 'What happens to the money supply and inflation in the economy when the Reserve Bank of India (RBI) increases the Repo Rate?',
      code_snippet: null,
      options: [
        'Commercial borrowing becomes cheaper; money supply increases and inflation rises',
        'Commercial borrowing becomes costlier; money supply contracts, helping curb inflation',
        'Repo rate change has zero impact on retail banks',
        'Currency circulation doubles instantly'
      ],
      correct_index: 1,
      explanation: 'Repo rate is the rate at which RBI lends money to commercial banks. A higher repo rate increases borrowing costs, contracts liquidity in the market, reduces aggregate demand, and controls inflation.'
    },
    {
      id: 16,
      role_id: 4,
      topic: 'CSAT Reasoning',
      question: 'In a group of 50 students, 30 study Python, 25 study SQL, and 10 study both. How many students study neither Python nor SQL?',
      code_snippet: null,
      options: [
        '5 Students',
        '10 Students',
        '15 Students',
        '0 Students'
      ],
      correct_index: 0,
      explanation: 'Total studying at least one = n(Python) + n(SQL) - n(Both) = 30 + 25 - 10 = 45 students. Neither = Total students - 45 = 50 - 45 = 5 students.'
    }
  ],
  users: [
    { id: 1, name: 'Alex Rivera', email: 'alex.rivera@campus.edu', target_role_id: 1, created_at: new Date('2026-10-01') },
    { id: 2, name: 'Priya Sharma', email: 'priya.sharma@college.ac.in', target_role_id: 2, created_at: new Date('2026-10-05') },
    { id: 3, name: 'Marcus Chen', email: 'marcus.chen@student.edu', target_role_id: 3, created_at: new Date('2026-10-10') }
  ],
  daily_streaks: [
    { id: 1, user_id: 1, current_streak: 5, last_active_date: new Date().toISOString().split('T')[0] },
    { id: 2, user_id: 2, current_streak: 12, last_active_date: new Date().toISOString().split('T')[0] },
    { id: 3, user_id: 3, current_streak: 3, last_active_date: new Date(Date.now() - 86400000).toISOString().split('T')[0] }
  ],
  user_milestone_progress: [
    { id: 1, user_id: 1, milestone_id: 1, is_completed: 1, completed_at: new Date('2026-10-25') },
    { id: 2, user_id: 1, milestone_id: 2, is_completed: 1, completed_at: new Date('2026-10-28') },
    { id: 3, user_id: 1, milestone_id: 3, is_completed: 1, completed_at: new Date('2026-10-31') },
    { id: 4, user_id: 1, milestone_id: 4, is_completed: 0, completed_at: null },
    { id: 5, user_id: 1, milestone_id: 5, is_completed: 0, completed_at: null },
    { id: 6, user_id: 2, milestone_id: 6, is_completed: 1, completed_at: new Date('2026-10-22') },
    { id: 7, user_id: 2, milestone_id: 7, is_completed: 1, completed_at: new Date('2026-10-24') },
    { id: 8, user_id: 2, milestone_id: 8, is_completed: 1, completed_at: new Date('2026-10-27') },
    { id: 9, user_id: 2, milestone_id: 9, is_completed: 1, completed_at: new Date('2026-10-30') },
    { id: 10, user_id: 2, milestone_id: 10, is_completed: 0, completed_at: null }
  ],
  user_practice_scores: [
    { id: 1, user_id: 1, role_id: 1, score: 3, total: 4, percentage: 75, completed_at: new Date('2026-10-30') },
    { id: 2, user_id: 2, role_id: 2, score: 4, total: 4, percentage: 100, completed_at: new Date('2026-10-31') }
  ]
};

let nextUserId = 4;
let nextStreakId = 4;
let nextProgressId = 11;
let nextScoreId = 3;

/**
 * Initialize MySQL Connection Pool Asynchronously
 */
function initPool() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'pathfinder_db',
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
      queueLimit: 0,
      connectTimeout: 2000
    });

    pool.getConnection()
      .then(conn => {
        isMysqlLive = true;
        console.log(`[Database] Connected to MySQL database '${process.env.DB_NAME || 'pathfinder_db'}' at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
        conn.release();
      })
      .catch(err => {
        isMysqlLive = false;
        console.log(`[Database Notice] MySQL connection info: ${err.message}. Relational memory engine ready.`);
      });
  } catch (err) {
    isMysqlLive = false;
  }
}

initPool();

/**
 * Universal Database Query Handler:
 * Executes via MySQL Pool if live, otherwise uses relational in-memory execution.
 */
export async function executeQuery(sql, params = []) {
  if (isMysqlLive && pool) {
    try {
      const [rows, fields] = await pool.query(sql, params);
      return [rows, fields];
    } catch (dbErr) {
      console.error('[MySQL Query Error]:', dbErr.message);
      throw dbErr;
    }
  }

  return executeInMemoryQuery(sql, params);
}

function executeInMemoryQuery(sql, params = []) {
  const normalizedSql = sql.trim().replace(/\s+/g, ' ');

  // 1. SELECT * FROM users WHERE email = ?
  if (/^SELECT \* FROM `?users`? WHERE `?email`? = \?/i.test(normalizedSql)) {
    const email = params[0]?.toLowerCase();
    const user = inMemoryStore.users.find(u => u.email.toLowerCase() === email);
    return [user ? [user] : []];
  }

  // 2. SELECT * FROM users WHERE id = ?
  if (/^SELECT \* FROM `?users`? WHERE `?id`? = \?/i.test(normalizedSql)) {
    const id = parseInt(params[0], 10);
    const user = inMemoryStore.users.find(u => u.id === id);
    return [user ? [user] : []];
  }

  // 3. INSERT INTO users (name, email, target_role_id) VALUES (?, ?, ?)
  if (/^INSERT INTO `?users`?/i.test(normalizedSql)) {
    const name = params[0];
    const email = params[1];
    const targetRoleId = params[2] || null;
    const newUser = {
      id: nextUserId++,
      name,
      email,
      target_role_id: targetRoleId,
      created_at: new Date()
    };
    inMemoryStore.users.push(newUser);
    return [{ insertId: newUser.id, affectedRows: 1 }];
  }

  // 4. UPDATE users SET target_role_id = ? WHERE id = ?
  if (/^UPDATE `?users`? SET `?target_role_id`? = \? WHERE `?id`? = \?/i.test(normalizedSql)) {
    const roleId = params[0] ? parseInt(params[0], 10) : null;
    const userId = parseInt(params[1], 10);
    const user = inMemoryStore.users.find(u => u.id === userId);
    if (user) user.target_role_id = roleId;
    return [{ affectedRows: user ? 1 : 0 }];
  }

  // 5. SELECT * FROM career_roles (with optional WHERE category = ?)
  if (/^SELECT .* FROM `?career_roles`?/i.test(normalizedSql)) {
    let roles = [...inMemoryStore.career_roles];
    if (/WHERE/i.test(normalizedSql)) {
      if (/category = \?/i.test(normalizedSql)) {
        const cat = params[0];
        roles = roles.filter(r => r.category === cat);
      } else if (/id = \?/i.test(normalizedSql)) {
        const id = parseInt(params[0], 10);
        roles = roles.filter(r => r.id === id);
      }
    }
    const result = roles.map(r => ({
      ...r,
      milestone_count: inMemoryStore.milestones.filter(m => m.role_id === r.id).length
    }));
    return [result];
  }

  // 6. Milestones lookup
  if (/^SELECT .* FROM `?milestones`?/i.test(normalizedSql)) {
    if (/WHERE `?id`? = \?/i.test(normalizedSql)) {
      const id = parseInt(params[0], 10);
      const m = inMemoryStore.milestones.find(item => item.id === id);
      return [m ? [m] : []];
    }
    if (/WHERE `?role_id`? = \?/i.test(normalizedSql)) {
      const roleId = parseInt(params[0], 10);
      const roleMilestones = inMemoryStore.milestones
        .filter(m => m.role_id === roleId)
        .sort((a, b) => a.phase_num - b.phase_num || a.id - b.id);
      return [roleMilestones];
    }
    return [inMemoryStore.milestones];
  }

  // 6b. User progress join with milestones
  if (/FROM `?user_milestone_progress`?.*JOIN `?milestones`?/i.test(normalizedSql)) {
    const userId = parseInt(params[0], 10);
    const roleId = parseInt(params[1], 10);
    const roleMilestoneIds = new Set(inMemoryStore.milestones.filter(m => m.role_id === roleId).map(m => m.id));
    const matched = inMemoryStore.user_milestone_progress.filter(
      p => p.user_id === userId && Boolean(p.is_completed) && roleMilestoneIds.has(p.milestone_id)
    );
    return [matched.map(p => ({ milestone_id: p.milestone_id }))];
  }

  // 7. User milestone progress lookup
  if (/^SELECT .* FROM `?user_milestone_progress`? WHERE `?user_id`? = \? AND `?milestone_id`? = \?/i.test(normalizedSql)) {
    const userId = parseInt(params[0], 10);
    const milestoneId = parseInt(params[1], 10);
    const match = inMemoryStore.user_milestone_progress.find(
      p => p.user_id === userId && p.milestone_id === milestoneId
    );
    return [match ? [match] : []];
  }

  // 8. User milestone progress for user
  if (/^SELECT .* FROM `?user_milestone_progress`? WHERE `?user_id`? = \?/i.test(normalizedSql)) {
    const userId = parseInt(params[0], 10);
    const list = inMemoryStore.user_milestone_progress.filter(p => p.user_id === userId);
    return [list];
  }

  // 9. INSERT INTO user_milestone_progress
  if (/^INSERT INTO `?user_milestone_progress`?/i.test(normalizedSql)) {
    const userId = parseInt(params[0], 10);
    const milestoneId = parseInt(params[1], 10);
    const isCompleted = params[2] ? 1 : 0;
    const completedAt = isCompleted ? (params[3] || new Date()) : null;

    const existing = inMemoryStore.user_milestone_progress.find(
      p => p.user_id === userId && p.milestone_id === milestoneId
    );
    if (existing) {
      existing.is_completed = isCompleted;
      existing.completed_at = completedAt;
      return [{ affectedRows: 1, changedRows: 1 }];
    } else {
      const record = {
        id: nextProgressId++,
        user_id: userId,
        milestone_id: milestoneId,
        is_completed: isCompleted,
        completed_at: completedAt
      };
      inMemoryStore.user_milestone_progress.push(record);
      return [{ insertId: record.id, affectedRows: 1 }];
    }
  }

  // 9b. UPDATE user_milestone_progress
  if (/^UPDATE `?user_milestone_progress`?/i.test(normalizedSql)) {
    const isCompleted = params[0] ? 1 : 0;
    const completedAt = params[1];
    const userId = parseInt(params[2], 10);
    const milestoneId = parseInt(params[3], 10);
    const existing = inMemoryStore.user_milestone_progress.find(
      p => p.user_id === userId && p.milestone_id === milestoneId
    );
    if (existing) {
      existing.is_completed = isCompleted;
      existing.completed_at = completedAt;
      return [{ affectedRows: 1, changedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  // 10. Daily streak lookup
  if (/^SELECT \* FROM `?daily_streaks`? WHERE `?user_id`? = \?/i.test(normalizedSql)) {
    const userId = parseInt(params[0], 10);
    const streak = inMemoryStore.daily_streaks.find(s => s.user_id === userId);
    return [streak ? [streak] : []];
  }

  // 11. INSERT INTO daily_streaks
  if (/^INSERT INTO `?daily_streaks`?/i.test(normalizedSql)) {
    const userId = parseInt(params[0], 10);
    const currentStreak = params[1] || 1;
    const lastActiveDate = params[2] || new Date().toISOString().split('T')[0];
    const newStreak = {
      id: nextStreakId++,
      user_id: userId,
      current_streak: currentStreak,
      last_active_date: lastActiveDate
    };
    inMemoryStore.daily_streaks.push(newStreak);
    return [{ insertId: newStreak.id, affectedRows: 1 }];
  }

  // 12. UPDATE daily_streaks
  if (/^UPDATE `?daily_streaks`? SET `?current_streak`? = \?, `?last_active_date`? = \? WHERE `?user_id`? = \?/i.test(normalizedSql)) {
    const currentStreak = parseInt(params[0], 10);
    const lastActiveDate = params[1];
    const userId = parseInt(params[2], 10);
    const streak = inMemoryStore.daily_streaks.find(s => s.user_id === userId);
    if (streak) {
      streak.current_streak = currentStreak;
      streak.last_active_date = lastActiveDate;
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  // 13. SELECT practice_questions WHERE role_id = ?
  if (/^SELECT .* FROM `?practice_questions`? WHERE `?role_id`? = \?/i.test(normalizedSql)) {
    const roleId = parseInt(params[0], 10);
    const questions = inMemoryStore.practice_questions.filter(q => q.role_id === roleId);
    return [questions];
  }

  // 14. SELECT user_practice_scores
  if (/^SELECT .* FROM `?user_practice_scores`?/i.test(normalizedSql)) {
    const userId = parseInt(params[0], 10);
    let list = inMemoryStore.user_practice_scores.filter(s => s.user_id === userId);
    if (params.length > 1) {
      const roleId = parseInt(params[1], 10);
      list = list.filter(s => s.role_id === roleId);
    }
    // Sort descending by completed_at
    list = [...list].sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
    return [list];
  }

  // 15. INSERT INTO user_practice_scores
  if (/^INSERT INTO `?user_practice_scores`?/i.test(normalizedSql)) {
    const userId = parseInt(params[0], 10);
    const roleId = parseInt(params[1], 10);
    const score = parseInt(params[2], 10);
    const total = parseInt(params[3], 10);
    const percentage = parseInt(params[4], 10);
    const newRecord = {
      id: nextScoreId++,
      user_id: userId,
      role_id: roleId,
      score,
      total,
      percentage,
      completed_at: new Date()
    };
    inMemoryStore.user_practice_scores.push(newRecord);
    return [{ insertId: newRecord.id, affectedRows: 1 }];
  }

  // Generic fallback
  return [[]];
}

export function getDatabaseStatus() {
  return {
    isMysqlLive,
    dbHost: process.env.DB_HOST || 'localhost',
    dbName: process.env.DB_NAME || 'pathfinder_db',
    dbPort: process.env.DB_PORT || 3306,
    engine: isMysqlLive ? 'Live MySQL Pool (mysql2)' : 'Resilient Relational Engine'
  };
}

export default {
  query: executeQuery,
  getDatabaseStatus
};
