const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { User } = require('../models');

// Register route
router.post('/register', authController.register);

// Login route
router.post('/login', authController.login);

// Get current user info
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: {
      id: user._id,
      name: user.name,
      email: user.email,
      accessLevel: user.accessLevel,
      role: user.role,
      rfIdTag: user.rfIdTag,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }});
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
