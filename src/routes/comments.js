const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireModerator } = require('../middleware/roleMiddleware');
const commentController = require('../controllers/commentController');

// Public routes (only approved comments)
router.get('/', commentController.getAllComments);
router.get('/news/:newsId', commentController.getNewComments);

// Protected routes - Authenticated users
router.post('/', authMiddleware, commentController.createComment);
router.get('/:id', authMiddleware, commentController.getComment);
router.put('/:id', authMiddleware, commentController.updateComment);
router.delete('/:id', authMiddleware, commentController.deleteComment);

// Moderator routes
router.get('/admin/all', authMiddleware, requireModerator, commentController.getAdminComments);
router.get('/admin/stats', authMiddleware, requireModerator, commentController.getCommentStats);
router.patch('/:id/approve', authMiddleware, requireModerator, commentController.approveComment);
router.patch('/:id/reject', authMiddleware, requireModerator, commentController.rejectComment);

module.exports = router;
