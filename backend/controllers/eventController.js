import Event from '../models/Event.js';

// @desc    Get all events
// @route   GET /api/events
// @access  Public
export const getEvents = async (req, res) => {
  try {
    // Fetches all events and sorts them by creation date (newest first)
    const events = await Event.find().sort({ createdAt: -1 });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not fetch events', error: error.message });
  }
};

// @desc    Create a new event
// @route   POST /api/events
// @access  Private/Admin (We will add auth later)
export const createEvent = async (req, res) => {
  try {
    const { title, date, time, type, description } = req.body;

    // Create a new event instance using the Mongoose model
    const newEvent = new Event({
      title,
      date,
      time,
      type,
      description
    });

    // Save it to MongoDB
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create event', error: error.message });
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private/Admin
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the event by ID and update it with the new data in req.body
    const updatedEvent = await Event.findByIdAndUpdate(id, req.body, { 
      returnDocument: 'after', // <-- New modern syntax
      runValidators: true 
    });

    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json(updatedEvent);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update event', error: error.message });
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private/Admin
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedEvent = await Event.findByIdAndDelete(id);

    if (!deletedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json({ message: 'Event successfully deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete event', error: error.message });
  }
};