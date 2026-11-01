import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import userRoutes from './routes/userRoutes.js';
import careerRoutes from './routes/careerRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import streakRoutes from './routes/streakRoutes.js';
import practiceRoutes from './routes/practiceRoutes.js';
import { requestLogger, errorHandler } from './middleware/errorHandler.js';
import db from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing
app.use(cors({
  origin: '*', // Allows local Vite dev server (e.g. http://localhost:5173) and preview ports
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use(requestLogger);

// Health & Diagnostics Endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = db.getDatabaseStatus();
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'PathFinder Backend API',
    database: dbStatus
  });
});

// REST API Endpoints
app.use('/api/users', userRoutes);
app.use('/api/user', userRoutes); // Support both singular /api/user/:id/dashboard & plural
app.use('/api/careers', careerRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/streak', streakRoutes);
app.use('/api/practice', practiceRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use(errorHandler);

// Start HTTP Server
let server = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🔥 PathFinder Server is live on http://localhost:${PORT}`);
    console.log(`📡 API Health Check:   http://localhost:${PORT}/api/health`);
    console.log(`🎯 Careers Catalog:    http://localhost:${PORT}/api/careers`);
    console.log(`=======================================================`);
  });
}

export { server };
export default app;
