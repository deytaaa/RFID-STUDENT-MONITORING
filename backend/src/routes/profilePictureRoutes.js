const express = require('express');
const multer = require('multer');
const path = require('path');
const { User } = require('../models');

const router = express.Router();

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/profile-pictures'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${req.params.id}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// Upload profile picture
router.post('/:id/upload-profile-picture', upload.single('profilePicture'), async (req, res) => {
  try {
    const userId = req.params.id;
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const imageUrl = `/uploads/profile-pictures/${req.file.filename}`;
    await User.findByIdAndUpdate(userId, { profilePicture: imageUrl });
    res.json({ success: true, imageUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Upload failed', error: err.message });
  }
});

module.exports = router;
