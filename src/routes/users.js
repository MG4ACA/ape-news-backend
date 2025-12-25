const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireSuperAdmin } = require('../middleware/roleMiddleware');
const userController = require('../controllers/userController');

// User profile routes (authenticated users)
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);

// Bookmark routes (authenticated users)
router.get('/bookmarks', authMiddleware, userController.getBookmarks);
router.post('/bookmarks', authMiddleware, userController.addBookmark);
router.delete('/bookmarks/:newsId', authMiddleware, userController.removeBookmark);
router.get('/bookmarks/check/:newsId', authMiddleware, userController.checkBookmark);

// Admin routes (Super Admin only)
router.get('/admin', authMiddleware, requireSuperAdmin, userController.getAllUsers);
router.get('/admin/:id', authMiddleware, requireSuperAdmin, userController.getUserById);
router.post('/admin', authMiddleware, requireSuperAdmin, userController.createUser);
router.put('/admin/:id', authMiddleware, requireSuperAdmin, userController.updateUser);
router.delete('/admin/:id', authMiddleware, requireSuperAdmin, userController.deleteUser);

module.exports = router;
