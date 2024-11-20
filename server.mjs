import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.mjs';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
// mongoose.connect(process.env.MONGO_URI, 
//     { useNewUrlParser: true, useUnifiedTopology: true })
//     .then(() => console.log('MongoDB connected'))
//     .catch((err) => console.error(err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Test route
app.get('/', (req, res) => res.send('It is Working !!! API Running'));

// Auth routes
app.use('/auth', authRoutes);

// Listener
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
