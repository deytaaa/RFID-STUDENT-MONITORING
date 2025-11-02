const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const { authenticateJWT, requireAdmin, requireSuperAdmin } = require('../middleware/authMiddleware');

// Sensitive operations: super admin only
router.post('/', authenticateJWT, requireSuperAdmin, userController.createUser);
router.put('/:id', authenticateJWT, requireSuperAdmin, userController.updateUser);
router.delete('/:id', authenticateJWT, requireSuperAdmin, userController.deleteUser);

// Viewing operations: admin and super admin
router.get('/', authenticateJWT, requireAdmin, userController.getAllUsers);
router.get('/rfid/:tag', authenticateJWT, requireAdmin, userController.getUserByRfid);
router.get('/:id', authenticateJWT, requireAdmin, userController.getUserById);

module.exports = router;