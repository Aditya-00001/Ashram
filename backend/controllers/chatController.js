import Conversation from '../models/Conversation.js';
import ChatMessage from '../models/ChatMessage.js';

// @desc    Send a message (and create a conversation if needed)
// @route   POST /api/chat/send
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, conversationId, text } = req.body; // <-- Extract conversationId
    const senderId = req.user._id;

    let conversation;

    // 1. If we already know the room (like a Group or existing chat), find it directly!
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    } 
    // 2. Otherwise, look for an existing 1-on-1 chat
    else if (receiverId) {
      conversation = await Conversation.findOne({
        isGroup: false,
        participants: { $all: [senderId, receiverId], $size: 2 } 
      });
    }

    // 3. If NO conversation exists at all, create a brand new 1-on-1
    if (!conversation && receiverId) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId]
      });
    }

    if (!conversation) return res.status(400).json({ message: "Invalid chat request" });

    // 3. Create the actual message document
    const newMessage = new ChatMessage({
      conversationId: conversation._id,
      sender: senderId,
      text: text
    });

    const savedMessage = await newMessage.save();

    // 4. Update the conversation's "lastMessage" so the Inbox UI loads fast
    conversation.lastMessage = savedMessage._id;
    await conversation.save();

    // Note: The real-time ping to the other user's screen will be handled 
    // by Socket.io on the frontend right after this API responds!
    
    res.status(201).json(savedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

// @desc    Get all conversations for the logged-in user (The "Inbox")
// @route   GET /api/chat/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    // Find all conversations where this user is inside the participants array
    const conversations = await Conversation.find({
      participants: { $in: [req.user._id] }
    })
      .populate('participants', 'name email role') // Get the names of the people chatting
      .populate('lastMessage')                     // Get the text of the last message
      .sort({ updatedAt: -1 });                    // Sort by newest first

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
};

// @desc    Get the message history for a specific conversation (PAGINATED)
// @route   GET /api/chat/:conversationId
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // Load 50 messages at a time
    const skip = (page - 1) * limit;

    // 1. Fetch newest messages first to get the correct "chunk"
    const messages = await ChatMessage.find({ conversationId: req.params.conversationId })
      .sort({ createdAt: -1 }) 
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name'); // Populate sender name for group chats!

    // 2. We need to tell the frontend if there are more messages to load
    const totalMessages = await ChatMessage.countDocuments({ conversationId: req.params.conversationId });
    const hasMore = totalMessages > (page * limit);

    // 3. Reverse the array before sending so the oldest in the chunk is at the top!
    res.status(200).json({
      messages: messages.reverse(),
      hasMore,
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

// @desc    Create a new Group Chat
// @route   POST /api/chat/group
// @access  Private
export const createGroupChat = async (req, res) => {
  try {
    const { groupName, selectedUserIds } = req.body;
    
    if (!selectedUserIds || selectedUserIds.length < 2) {
      return res.status(400).json({ message: 'A group requires at least 2 other members.' });
    }

    // Add the creator to the list of participants
    const participants = [req.user._id, ...selectedUserIds];

    const groupConversation = await Conversation.create({
      participants,
      isGroup: true,
      groupName,
      groupAdmin: req.user._id
    });

    res.status(201).json(groupConversation);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create group chat', error: error.message });
  }
};

// @desc    Add new members to an existing Group Chat
// @route   PUT /api/chat/group/add
// @access  Private
export const addGroupMembers = async (req, res) => {
  try {
    const { conversationId, userIdsToAdd } = req.body;

    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation || !conversation.isGroup) {
      return res.status(400).json({ message: 'Group chat not found.' });
    }

    // SECURITY: Only the Group Admin (creator) or a Super Admin can add members
    const isGroupAdmin = conversation.groupAdmin.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role === 'superadmin';
    
    if (!isGroupAdmin && !isSuperAdmin) {
      return res.status(403).json({ message: 'Only the Group Admin can add new members.' });
    }

    // Filter out users who are already in the group to prevent duplicates
    const currentParticipants = conversation.participants.map(id => id.toString());
    const newParticipants = userIdsToAdd.filter(id => !currentParticipants.includes(id));

    if (newParticipants.length === 0) {
      return res.status(400).json({ message: 'Selected users are already in the group.' });
    }

    // Push the new members into the array and save
    conversation.participants.push(...newParticipants);
    await conversation.save();

    // Re-fetch and populate so the frontend has the fresh names/data
    const updatedGroup = await Conversation.findById(conversationId)
      .populate('participants', 'name role')
      .populate('lastMessage');

    res.status(200).json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add members', error: error.message });
  }
};