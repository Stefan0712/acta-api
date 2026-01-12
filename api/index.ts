const express = require('express');
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Import Routes
import authRoutes from '../src/routes/authRoutes';
import userRoutes from '../src/routes/userRoutes';
import invitesRoutes from '../src/routes/invitesRoutes';
import listRoutes from '../src/routes/listRoutes';
import itemRoutes from '../src/routes/itemRoutes';
import groupRoutes from '../src/routes/groupRoutes';
import noteRoutes from '../src/routes/noteRoutes';
import pollRoutes from '../src/routes/pollRoutes';
import notificationRoutes from '../src/routes/notificationRoutes';
import activityRoutes from '../src/routes/activityRoutes';
import uploadRoutes from '../src/routes/uploadRoutes';
import syncRoutes from '../src/routes/syncRoutes';

// Initialize App
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json()); // Parse JSON bodies


const allowedOrigins = [
  'http://localhost:5173',
  'https://stefan0712.github.io' 
];


app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin); 
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

app.use(helmet({crossOriginResourcePolicy: false})); 
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Database connection
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  try {
    await mongoose.connect(process.env.MONGO_URI as string, {
       serverSelectionTimeoutMS: 5000, 
       socketTimeoutMS: 45000,
    });
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
  }
};
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next(); 
  } catch (error) {
    console.error("DB Connection Failed:", error);
    res.status(500).json({ error: "Database Connection Failed" });
  }
});

// Routes
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

app.use('/api/invites', invitesRoutes)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/upload', uploadRoutes);



if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on ${port}`);
  });
}

module.exports = app;