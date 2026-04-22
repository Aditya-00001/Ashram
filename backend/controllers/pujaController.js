import Puja from '../models/Puja.js';
import User from '../models/User.js';
// @desc    Get data for the public Puja Widgets (Today & Next)
// @route   GET /api/pujas/public
// @access  Public
export const getPublicPujas = async (req, res) => {
  try {
    // 1. Calculate the exact boundaries of "Today" in the server's timezone
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 2. Find a Puja scheduled for today
    const todayPuja = await Puja.findOne({
      date: { $gte: todayStart, $lte: todayEnd },
      status: 'Scheduled'
    });

    // 3. Find the strictly NEXT upcoming Puja (happening anytime after 11:59 PM tonight)
    const nextPuja = await Puja.findOne({
      date: { $gt: todayEnd },
      status: 'Scheduled'
    }).sort({ date: 1 }); // .sort({ date: 1 }) ensures we get the closest upcoming date!

    res.status(200).json({
      today: todayPuja,
      upcoming: nextPuja
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch public pujas', error: error.message });
  }
};

// @desc    Create a new Puja Schedule
// @route   POST /api/pujas
// @access  Private/Admin
export const createPuja = async (req, res) => {
  try {
    const { pujaName, sponsorName, sponsorEmail, date, time } = req.body;
    
    // --- NEW: Email Lookup Logic ---
    let sponsorId = null;
    if (sponsorEmail) {
      const user = await User.findOne({ email: sponsorEmail.toLowerCase() });
      if (!user) {
        return res.status(404).json({ message: `No registered user found with email: ${sponsorEmail}` });
      }
      sponsorId = user._id; // Link established!
    }

    const newPuja = new Puja({ pujaName, sponsorName, sponsorId, date, time });
    const savedPuja = await newPuja.save();
    
    // Populate before sending back to UI
    await savedPuja.populate('sponsorId', 'email');
    res.status(201).json(savedPuja);
  } catch (error) {
    res.status(400).json({ message: 'Failed to schedule puja', error: error.message });
  }
};

// @desc    Get all pujas (for Admin dashboard)
// @route   GET /api/pujas
// @access  Private/Admin
// @desc    Get all pujas (for Admin dashboard)
export const getAllPujas = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || '';
    const query = search ? {
      $or: [
        { pujaName: { $regex: search, $options: 'i' } },
        { sponsorName: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const total = await Puja.countDocuments(query);
    const pujas = await Puja.find(query)
      .populate('sponsorId', 'email') // <-- NEW: Fetch the linked email for the Admin table
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({ pujas, currentPage: page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pujas' });
  }
};

// --- NEW: Update an existing Puja ---
// @desc    Update a puja
// @route   PUT /api/pujas/:id
// @access  Private/Admin
export const updatePuja = async (req, res) => {
  try {
    const { pujaName, sponsorName, sponsorEmail, date, time, status } = req.body;

    // --- NEW: Email Lookup Logic ---
    let sponsorId = req.body.sponsorId; 
    if (sponsorEmail) {
      const user = await User.findOne({ email: sponsorEmail.toLowerCase() });
      if (!user) {
        return res.status(404).json({ message: `No registered user found with email: ${sponsorEmail}` });
      }
      sponsorId = user._id; // Update the link!
    }

    const updatedPuja = await Puja.findByIdAndUpdate(req.params.id, {
      pujaName, sponsorName, sponsorId, date, time, status
    }, { new: true, runValidators: true }).populate('sponsorId', 'email');

    if (!updatedPuja) return res.status(404).json({ message: 'Puja not found' });
    
    res.status(200).json(updatedPuja);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update puja', error: error.message });
  }
};

// @desc    Delete a puja
// @route   DELETE /api/pujas/:id
// @access  Private/Admin
export const deletePuja = async (req, res) => {
  try {
    await Puja.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Puja deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete puja' });
  }
};

// @desc    Get logged in user's booked pujas
// @route   GET /api/pujas/my-pujas
// @access  Private
export const getMyPujas = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // req.user._id comes from the 'protect' middleware
    const total = await Puja.countDocuments({ sponsorId: req.user._id });
    
    const pujas = await Puja.find({ sponsorId: req.user._id })
      .sort({ date: 1 }) // Closest dates first
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      pujas,
      currentPage: page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch your pujas' });
  }
};