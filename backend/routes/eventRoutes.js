import express from 'express';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../controllers/eventController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Define the routes and link them to the controller functions
router.route('/')
  .get(getEvents)
  .post(protect, authorizeRoles('admin', 'superadmin'), upload.single('image'), createEvent);

router.route('/:id')
  .put(updateEvent)
  .delete(deleteEvent);

export default router;