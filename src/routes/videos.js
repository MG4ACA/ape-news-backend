const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireEditor } = require('../middleware/roleMiddleware');
const videoController = require('../controllers/videoController');

// Public routes
router.get('/', videoController.getAllVideos);

// Protected routes (Editor and above) - must come before /:id
router.get('/admin/all', authMiddleware, requireEditor, videoController.getAdminVideos);
router.get('/admin/stats', authMiddleware, requireEditor, videoController.getVideoStats);
router.post('/', authMiddleware, requireEditor, videoController.createVideo);
router.patch('/:id/featured', authMiddleware, requireEditor, videoController.toggleFeatured);
router.put('/:id', authMiddleware, requireEditor, videoController.updateVideo);
router.delete('/:id', authMiddleware, requireEditor, videoController.deleteVideo);

// Get single video (must be last)
router.get('/:id', videoController.getVideo);

module.exports = router;
