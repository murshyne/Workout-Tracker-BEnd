import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { check, validationResult } from 'express-validator';
import User from '../../models/User.mjs'; // Assuming your User model is here
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

// @route    POST api/users
// @desc     Register a new user
// @access   Public
router.post(
  '/',
  [
    check('firstName', 'Name is required').not().isEmpty(),
    check('lastName', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 8 or more characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    // Run our validation 'checks' on the request body
    const errors = validationResult(req);

    // If there are errors, respond with the errors
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const {  firstName, lastName, email, password } = req.body;

    try {
      // Check if user already exists in the DB
      let user = await User.findOne({ email });

      // If user exists, return with error message
      if (user) {
        return res.status(400).json({ errors: [{ msg: 'User Already Exists' }] });
      }

      // Create a new User
      user = new User({
        firstName,
        lastName,
        email,
        password,
      });

      // Encrypt the password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // Save the new user to the database
      await user.save();

      // Create JWT payload
      const payload = {
        user: {
          id: user.id,
        },
      };

      // Sign the JWT token with expiration of 1 hour
      jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1hr' }, (err, token) => {
        if (err) throw err;
        // Return the token to the client
        res.json({ token });
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
  }
);

export default router;
