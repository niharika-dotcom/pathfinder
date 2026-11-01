import express from 'express';
import { loginOrRegister, setTargetRole, getUserDashboard } from '../controllers/userController.js';

const router = express.Router();

router.post('/login-or-register', loginOrRegister);
router.post('/target-role', setTargetRole);
router.get('/:id/dashboard', getUserDashboard);

export default router;
