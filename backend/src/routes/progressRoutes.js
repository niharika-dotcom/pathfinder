import express from 'express';
import { toggleMilestoneProgress } from '../controllers/progressController.js';

const router = express.Router();

router.post('/toggle', toggleMilestoneProgress);

export default router;
