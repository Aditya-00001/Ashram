import express from 'express';
import { getPublicPujas, createPuja, getAllPujas, deletePuja, updatePuja, getMyPujas } from '../controllers/pujaController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route for the dashboard widgets
router.get('/public', getPublicPujas);

// Protected Admin route to schedule a new one
router.post('/', protect, authorizeRoles('admin'), createPuja);

// --- ADD THIS LINE HERE (Above the /:id routes) ---
router.get('/my-pujas', protect, getMyPujas);

router.get('/', protect, authorizeRoles('admin'), getAllPujas);
router.delete('/:id', protect, authorizeRoles('admin'), deletePuja);
router.put('/:id', protect, authorizeRoles('admin'), updatePuja);


export default router;