import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { check, validationResult } from 'express-validator';
import User from '../../models/User.mjs';
import auth from '../../middleware/auth.mjs';
import { upload } from '../../middleware/upload.mjs';
import cloudinary from '../../config/cloudinary.mjs'; 
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

// @route    POST api/users
// @desc     Register a new user
// @access   Public
router.post(
  '/signup',
  [
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      user = new User({
        firstName,
        lastName,
        email,
        password,
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = { user: { id: user.id } };

      jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1hr' }, (err, token) => {
        if (err) throw err;
        res.json({ token });
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
  }
);

// @route    GET api/users/:id
// @desc     Get user by ID
// @access   Private
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ errors: [{ msg: 'Server Error' }] });
  }
});

// @route    PUT api/users/:id
// @desc     Update user details
// @access   Private
router.put('/:id', auth, async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const updatedFields = {};

  if (firstName) updatedFields.firstName = firstName;
  if (lastName) updatedFields.lastName = lastName;
  if (email) updatedFields.email = email;
  if (password) {
    const salt = await bcrypt.genSalt(10);
    updatedFields.password = await bcrypt.hash(password, salt);
  }

  try {
    const user = await User.findByIdAndUpdate(req.params.id, { $set: updatedFields }, { new: true });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ errors: [{ msg: 'Server Error' }] });
  }
});

// @route    DELETE api/users/:id
// @desc     Delete user
// @access   Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ errors: [{ msg: 'Server Error' }] });
  }
});

// @route    POST api/users/upload/:id
// @desc     Upload profile picture
// @access   Private
router.post('/upload/:id', [auth, upload], async (req, res) => {
  try {
    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({ errors: [{ msg: 'No file uploaded' }] });
    }

    // Upload the image to Cloudinary
    const result = await cloudinary.v2.uploader.upload(req.file.path);

    // Get the image URL from Cloudinary response
    const profilePictureUrl = result.secure_url;

    // Generate an optimized image URL (auto format and quality)
    const optimizedUrl = cloudinary.url(result.public_id, { fetch_format: 'auto', quality: 'auto' });

    // Update the user's profile picture URL in the database
    const user = await User.findByIdAndUpdate(req.params.id, { profilePicture: optimizedUrl }, { new: true });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Delete the temporary file from the local server
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error('Error deleting temporary file:', err);
      } else {
        console.log('Temporary file deleted');
      }
    });

    // Respond with the updated user profile including the new profile picture
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

export default router;
