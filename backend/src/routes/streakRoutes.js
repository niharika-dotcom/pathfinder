import express from 'express';
import { checkInStreak } from '../controllers/streakController.js';

const router = express.Router();

router.post('/check-in', checkInStreak);

export default router;
