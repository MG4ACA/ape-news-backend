const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireEditor } = require('../middleware/roleMiddleware');
const analyticsController = require('../controllers/analyticsController');

// Public routes
router.get('/popular', analyticsController.getPopularArticles);
router.get('/trending', analyticsController.getTrendingArticles);

// Protected routes (requires authentication)
router.post('/track', analyticsController.trackView); // Can be called by anyone (logged in or not)
router.get('/user/activity', authMiddleware, analyticsController.getUserActivity);

// Admin routes (Editor and above)
router.get('/dashboard', authMiddleware, requireEditor, analyticsController.getDashboardStats);
router.get('/article/:id', authMiddleware, requireEditor, analyticsController.getArticleAnalytics);
router.get('/categories', authMiddleware, requireEditor, analyticsController.getViewsByCategory);

module.exports = router;
