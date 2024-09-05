const express = require('express');
const router = express.Router();
const User = require('../models/user');
const UserFeedbackIds = require('../models/userfeedbackIds')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserFeedback = require('../models/userfeedback'); // Adjust the path as necessary
const AIFeedback = require('../models/aifeedback')
const axios = require('axios')
require('dotenv').config(); // Load environment variables


// Function to create AI feedback
const createAIFeedback = async (userId,id) => {
    try {
      const userFeedbacks = await UserFeedback.find({ uniqueId: id });
      const feedbackTexts = userFeedbacks.map(fb => fb.feedback).join('\n');
  
      const gptResponse = await axios.post('https://api.openai.com/v1/engines/davinci-codex/completions', {
        prompt: `Evaluate the provided feedbacks and generate an evaluation of an individual regarding which these feedbacks pertain to. Format the reply overviewing the following parameters: Professionalism, Personal Life, Area to improve.\n\nFeedbacks:\n${feedbackTexts}`,
        max_tokens: 500,
        temperature: 0.7,
      }, {
        headers: {
          'Authorization': `${process.env.OPEN_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
  
      const aiFeedbackText = gptResponse.data.choices[0].text.trim();

    //   const aiFeedback = await AIFeedback.findOneAndUpdate(
    //     { uniqueId: userId },
    //     { feedback: "aiFeedbackText" },
    //     { new: true, upsert: true }
    //   );
      return "aiFeedback";
    } catch (error) {
      console.error('Error creating AI feedback:', error);
      throw new Error('Failed to create AI feedback.');
    }
  };

// Endpoint to check if feedback exists
router.get('/aifeedback/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const userFeedbackId = await UserFeedbackIds.findOne({ feedbackId: id });
      const aifeedback = await AIFeedback.findOne({ uniqueId: userFeedbackId.userId });
  
      if (aifeedback) {
        res.json({ feedback: aifeedback.feedback });
      } else {
        const userFeedbacks = await UserFeedback.find({ uniqueId: id });
  
        if (userFeedbacks.length >= 5) {
        //   const userFeedbackId = await UserFeedbackIds.findOne({ feedbackId: id });
  
          if (userFeedbackId) {
            const createdFeedback = await createAIFeedback(userFeedbackId.userId,id);
            res.json({ feedback: "createdFeedback.feedback" });
            // res.json({ feedback: 'this is test' });
          } else {
            res.json({ message: 'User ID not found.' });
          }
        } else {
          res.json({ message: 'Feedback not available yet.' });
        }
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      res.status(500).json({ message: error });
    }
  });
 

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

  router.post('/feedback', async (req, res) => {
    const { uniqueId, feedback } = req.body;

    try {
        const newFeedback = new UserFeedback({ uniqueId, feedback });
        await newFeedback.save();
        res.status(201).json({ message: 'Feedback submitted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

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
      const existingFeedback = await UserFeedbackIds.findOne({ feedbackId: uniqueId });
      if (!existingFeedback) {
        isUnique = true;
      }
    }
  
    const newFeedback = new UserFeedbackIds({ feedbackId: uniqueId, userId });
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
