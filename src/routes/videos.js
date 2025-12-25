const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireEditor } = require('../middleware/roleMiddleware');
const videoController = require('../controllers/videoController');

// Public routes
router.get('/', videoController.getAllVideos);

// Protected routes (Editor and above)
router.get('/admin/all', authMiddleware, requireEditor, videoController.getAdminVideos);
router.get('/admin/stats', authMiddleware, requireEditor, videoController.getVideoStats);
router.post('/', authMiddleware, requireEditor, videoController.createVideo);
router.put('/:id', authMiddleware, requireEditor, videoController.updateVideo);
router.patch('/:id/active', authMiddleware, requireEditor, videoController.toggleFeatured);
router.delete('/:id', authMiddleware, requireEditor, videoController.deleteVideo);

// Get single video (must be last)
router.get('/:id', videoController.getVideo);

module.exports = router;
