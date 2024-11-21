import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/api/auth.mjs';
import userRoutes from './routes/api/users.mjs';
import connectDB from './config/db.mjs';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-auth-token'],
}));

// Test route
app.get('/', (req, res) => res.send('It is Working !!! Api Running'));

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Listener
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
