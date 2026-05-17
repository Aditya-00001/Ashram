import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// --- NEW: WebSockets Imports ---
import { createServer } from 'http';
import { Server } from 'socket.io';

import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Inside your sendMessage controller logic:
const sendPushNotification = async (recipientId, messagePayload) => {
  const recipient = await User.findById(recipientId);
  if (recipient && recipient.pushSubscription) {
    try {
      await webpush.sendNotification(
        recipient.pushSubscription,
        JSON.stringify({
          title: `New Message from ${messagePayload.senderName}`,
          body: messagePayload.text,
          url: '/chat'
        })
      );
    } catch (error) {
      console.error('Error sending push notification', error);
    }
  }
};

// --- ROUTE IMPORTS ---
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import donationRoutes from './routes/donationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import galleryRoutes from './routes/galleryRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
import userRoutes from './routes/userRoutes.js';
import pujaRoutes from './routes/pujaRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import faqRoutes from './routes/faqRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

import morgan from 'morgan';
import logger from './utils/logger.js';

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', process.env.FRONTEND_URL],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});


app.set('trust proxy', 1);
// 2. Create the limiters BEFORE your routes
// General API Limiter: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// Strict Auth Limiter: 10 requests per hour for login/register to prevent spam
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10, 
  message: { message: 'Too many authentication attempts, please try again after an hour.' }
});


// --- MIDDLEWARE ---
// Allows your React frontend (e.g., localhost:5173) to communicate with this API
// In production, we only allow requests from YOUR deployed React app
const allowedOrigins = [
  'http://localhost:5173', // Your local React testing
  process.env.FRONTEND_URL   // The future Vercel/live URL
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
// Parses incoming JSON data from HTTP requests (like your Contact form)
app.use(express.json()); 

app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));
// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // Exits the server if the database fails to connect
  });

// --- API ROUTES ---
// Mount the imported routers to specific URL paths
app.use('/api', apiLimiter); // Apply general API rate limiter to all routes under /api
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pujas', pujaRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
// --- BASE ROUTE (Health Check) ---
app.get('/', (req, res) => {
  res.send('🙏 Achyuta Ananta Ashram API is running smoothly...');
});

// // --- START SERVER ---
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
// });

const onlineUsers = new Set();

// --- NEW: Socket.io Connection Logic ---
io.on('connection', (socket) => {
  console.log(`🔌 A user connected: ${socket.id}`);

  // ==========================================
  // 📞 WebRTC SIGNALING LISTENERS
  // ==========================================
  socket.on('call_user', (data) => {
    socket.to(data.userToCall).emit('incoming_call', {
      signal: data.signalData,
      from: data.from,
      name: data.name,
      callType: data.callType
    });
  });

  socket.on('answer_call', (data) => {
    socket.to(data.to).emit('call_accepted', data.signal);
  });

  socket.on('ice_candidate', (data) => {
    socket.to(data.to).emit('ice_candidate', data.candidate);
  });

  socket.on('end_call', (data) => {
    socket.to(data.to).emit('call_ended');
  });


  socket.on('user_online', (userId) => {
    socket.userId = userId; 
    onlineUsers.add(userId);
    
    // --- CRITICAL FIX: Join a room named after the User ID ---
    socket.join(userId); 
    
    io.emit('online_users_list', Array.from(onlineUsers)); 
    console.log(`👤 User ${userId} is now reachable for calls.`);
  });

  // 2. Handle Typing Status
  socket.on('typing_start', (data) => {
    // data: { conversationId, userName }
    socket.to(data.conversationId).emit('user_typing', data);
  });

  socket.on('typing_stop', (data) => {
    socket.to(data.conversationId).emit('user_stopped_typing', data);
  });

  // When a user opens a specific chat, they join a "room" using the Conversation ID
  socket.on('join_chat', (conversationId) => {
    socket.join(conversationId);
    console.log(`User joined room: ${conversationId}`);
  });

  // When a user sends a message, broadcast it to everyone in that specific room
  // Existing send_message event
  socket.on('send_message', (message) => {
    socket.to(message.conversationId).emit('receive_message', message);
  });

  // --- NEW: Relay updated messages (Polls) to everyone else in the chat ---
  socket.on('update_message', (message) => {
    socket.to(message.conversationId).emit('update_message', message);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('online_users_list', Array.from(onlineUsers));
    }
  });

  // --- NEW: Handle Read Receipts ---
  socket.on('mark_as_read', (data) => {
    // data should contain { conversationId, readerId }
    // Broadcast to the room so the sender knows their message was read
    socket.to(data.conversationId).emit('messages_read', data);
  });
  
});

// --- UPDATED: Make sure httpServer is listening, NOT app! ---
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});