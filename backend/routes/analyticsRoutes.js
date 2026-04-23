import express from 'express';
import { getDashboardStats } from '../controllers/analyticsController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Notice: 'trustee' is included here! They can read this data, but can't edit it.
router.get('/', protect, authorizeRoles('admin', 'superadmin', 'trustee'), getDashboardStats);

export default router;