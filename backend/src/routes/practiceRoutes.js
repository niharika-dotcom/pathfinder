import express from 'express';
import { getPracticeQuestions, submitPracticeQuiz } from '../controllers/practiceController.js';

const router = express.Router();

router.get('/:roleId', getPracticeQuestions);
router.post('/submit', submitPracticeQuiz);

export default router;
