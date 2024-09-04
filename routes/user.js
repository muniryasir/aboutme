const express = require('express');
const router = express.Router();
const User = require('../models/user');
const UserFeedback = require('../models/userfeedbackIds')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config(); // Load environment variables

// userfeedbackID

function generateUniqueId(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  router.post('/generateId', async (req, res) => {
    const { userId } = req.body;
  
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    let uniqueId;
    let isUnique = false;
  
    while (!isUnique) {
      uniqueId = generateUniqueId(8);
      const existingFeedback = await UserFeedback.findOne({ feedbackId: uniqueId });
      if (!existingFeedback) {
        isUnique = true;
      }
    }
    let {name, email, password} = {name: "test123", email:"test@test.com", password:"test123"}
    const user = new User({ name, email, password });
    await user.save();
    const newFeedback = new UserFeedback({ feedbackId: uniqueId, userId });
    await newFeedback.save();
  
    res.json({ uniqueId });
  })

router.post('/generate-Id', async (req, res) => {
    // res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    const { userId } = req.body;
  
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
  
    let uniqueId;
    let isUnique = false;
  
    while (!isUnique) {
      uniqueId = generateUniqueId(8);
      const existingFeedback = await UserFeedback.findOne({ feedbackId: uniqueId });
      if (!existingFeedback) {
        isUnique = true;
      }
    }
  
    const newFeedback = new UserFeedback({ feedbackId: uniqueId, userId });
    await newFeedback.save();
  
    res.json({ uniqueId });
  });
  
// Sign-up route
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = new User({ name, email, password });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ token, userId: user._id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ token, userId: user._id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get one user
router.get('/:id', getUser, (req, res) => {
    res.json(res.user);
});

// Create a user
router.post('/adduser', async (req, res) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    });

    try {
        const newUser = await user.save();
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a user
router.patch('/updateuser/:id', getUser, async (req, res) => {
    if (req.body.name != null) {
        res.user.name = req.body.name;
    }
    if (req.body.email != null) {
        res.user.email = req.body.email;
    }
    if (req.body.password != null) {
        res.user.password = req.body.password;
    }

    try {
        const updatedUser = await res.user.save();
        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a user
router.delete('/deleteusr/:id', getUser, async (req, res) => {
    try {
        await res.user.remove();
        res.json({ message: 'Deleted User' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

async function getUser(req, res, next) {
    let user;
    try {
        user = await User.findById(req.params.id);
        if (user == null) {
            return res.status(404).json({ message: 'Cannot find user' });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }

    res.user = user;
    next();
}

module.exports = router;
