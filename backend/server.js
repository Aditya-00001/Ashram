import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// --- NEW: WebSockets Imports ---
import { createServer } from 'http';
import { Server } from 'socket.io';

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
// --- BASE ROUTE (Health Check) ---
app.get('/', (req, res) => {
  res.send('🙏 Achyuta Ananta Ashram API is running smoothly...');
});

// // --- START SERVER ---
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
// });

// --- NEW: Socket.io Connection Logic ---
io.on('connection', (socket) => {
  console.log(`🔌 A user connected: ${socket.id}`);

  // When a user opens a specific chat, they join a "room" using the Conversation ID
  socket.on('join_chat', (conversationId) => {
    socket.join(conversationId);
    console.log(`User joined room: ${conversationId}`);
  });

  // When a user sends a message, broadcast it to everyone in that specific room
  socket.on('send_message', (data) => {
    // data should contain { conversationId, senderId, text, createdAt, etc. }
    io.to(data.conversationId).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

// --- UPDATED: Make sure httpServer is listening, NOT app! ---
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});