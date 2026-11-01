import express from 'express';
import { getCareers, getCareerRoadmap } from '../controllers/careerController.js';

const router = express.Router();

router.get('/', getCareers);
router.get('/:id/roadmaps', getCareerRoadmap);

export default router;
