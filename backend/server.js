import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// --- ROUTE IMPORTS ---
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import donationRoutes from './routes/donationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// --- MIDDLEWARE ---
// Allows your React frontend (e.g., localhost:5173) to communicate with this API
app.use(cors()); 
// Parses incoming JSON data from HTTP requests (like your Contact form)
app.use(express.json()); 

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // Exits the server if the database fails to connect
  });

// --- API ROUTES ---
// Mount the imported routers to specific URL paths
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/messages', messageRoutes);

// --- BASE ROUTE (Health Check) ---
app.get('/', (req, res) => {
  res.send('🙏 Achyuta Ananta Ashram API is running smoothly...');
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});