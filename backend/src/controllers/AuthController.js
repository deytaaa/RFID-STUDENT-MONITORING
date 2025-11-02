const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authController = {
  // Register a new user (admin)
  async register(req, res) {
    try {
      const { name, email, password, accessLevel, ...rest } = req.body;
      // Only allow admin registration
      if (accessLevel !== 'admin') {
        return res.status(403).json({ message: 'Only admin accounts can be registered.' });
      }
      // Basic validation
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required.' });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
      }
      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format.' });
      }
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered.' });
      }
      // Set role to admin
      rest.role = 'admin';
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      // Create user
      const user = new User({
        name,
        email,
        password: hashedPassword,
        accessLevel: 'admin',
        ...rest
      });
      await user.save();
      res.status(201).json({ message: 'Admin registered successfully.' });
    } catch (error) {
      res.status(500).json({ message: 'Registration failed.', error });
    }
  },

  // Login user (admiN)
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
      }
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password.' });
      }
      if (user.accessLevel !== 'admin' && user.accessLevel !== 'superadmin') {
        return res.status(403).json({ message: 'Access denied. Only admins and super admins can log in to the system.' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password.' });
      }
      const token = jwt.sign(
        { id: user._id, accessLevel: user.accessLevel, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      console.log('Login response:', { token, user: { id: user._id, name: user.name, email: user.email, accessLevel: user.accessLevel, role: user.role } }); // DEBUG LOG
      res.json({ token, user: { id: user._id, name: user.name, email: user.email, accessLevel: user.accessLevel, role: user.role } });
    } catch (error) {
      res.status(500).json({ message: 'Login failed.', error });
    }
  }
};

module.exports = authController;
