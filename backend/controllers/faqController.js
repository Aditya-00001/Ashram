import Faq from '../models/Faq.js';

// @desc    Get all active FAQs for the public website
// @route   GET /api/faqs/public
// @access  Public
export const getPublicFaqs = async (req, res) => {
  try {
    // Only fetch FAQs that the admin has marked as "active"
    const faqs = await Faq.find({ isActive: true }).sort({ category: 1, createdAt: -1 });
    res.status(200).json(faqs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch FAQs' });
  }
};

// @desc    Get ALL FAQs (including drafts) for the Admin panel
// @route   GET /api/faqs
// @access  Private/Admin
export const getAllFaqs = async (req, res) => {
  try {
    const faqs = await Faq.find({}).sort({ category: 1, createdAt: -1 });
    res.status(200).json(faqs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch FAQs' });
  }
};

// @desc    Create a new FAQ
// @route   POST /api/faqs
// @access  Private/Admin
export const createFaq = async (req, res) => {
  try {
    const newFaq = new Faq(req.body);
    const savedFaq = await newFaq.save();
    res.status(201).json(savedFaq);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create FAQ', error: error.message });
  }
};

// @desc    Update an FAQ
// @route   PUT /api/faqs/:id
// @access  Private/Admin
export const updateFaq = async (req, res) => {
  try {
    const updatedFaq = await Faq.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedFaq) return res.status(404).json({ message: 'FAQ not found' });
    res.status(200).json(updatedFaq);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update FAQ', error: error.message });
  }
};

// @desc    Delete an FAQ
// @route   DELETE /api/faqs/:id
// @access  Private/Admin
export const deleteFaq = async (req, res) => {
  try {
    await Faq.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'FAQ deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete FAQ' });
  }
};