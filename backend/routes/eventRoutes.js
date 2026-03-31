import express from 'express';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../controllers/eventController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Define the routes and link them to the controller functions
router.route('/')
  .get(getEvents)
  .post(protect, admin, createEvent);

router.route('/:id')
  .put(updateEvent)
  .delete(deleteEvent);

export default router;