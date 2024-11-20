import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { check, validationResult } from 'express-validator';
import User from '../models/user.mjs';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

// @route POST /api/auth/signup
// @desc  Register user
// @access Public
router.post(
    '/signup',
    [
        check('fname', 'First name is required').not().isEmpty(),
        check('lname', 'Last name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check(
            'password',
            'Password must be at least 8 characters'
        ).isLength({ min: 8 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { fname, lname, email, password } = req.body;

        try {
            // Check if user already exists
            let user = await User.findOne({ email });
            if (user) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: 'User already exists' }] });
            }

            // Create new user
            user = new User({ fname, lname, email, password });

            // Encrypt password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            // Save user to DB
            await user.save();

            // Generate JWT token
            const payload = { user: { id: user.id } };
            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: 3600 },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });
                }
            );
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

// @route POST /api/auth/login
// @desc  Login user
// @access Public
router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            // Check if user exists
            let user = await User.findOne({ email });
            if (!user) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: 'Invalid credentials' }] });
            }

            // Compare the password with the hashed password in the database
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: 'Invalid credentials' }] });
            }

            // Generate JWT token
            const payload = { user: { id: user.id } };
            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: 3600 }, // 1 hour expiration
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });
                }
            );
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

export default router;
