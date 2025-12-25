const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireEditor, requireRole } = require('../middleware/roleMiddleware');
const { uploadSingle, handleUploadError } = require('../middleware/uploadMiddleware');
const newsController = require('../controllers/newsController');

// Public routes
router.get('/', newsController.getAllNews);

// Protected routes - Editor and above (must come before /:id)
router.get('/admin/all', authMiddleware, requireEditor, newsController.getAdminNews);

router.get('/:id', newsController.getNews);
router.post('/', authMiddleware, requireEditor, uploadSingle, handleUploadError, newsController.createNews);
router.put('/:id', authMiddleware, requireEditor, uploadSingle, handleUploadError, newsController.updateNews);

router.delete('/:id', authMiddleware, requireEditor, newsController.deleteNews);
router.patch('/:id/featured', authMiddleware, requireEditor, newsController.toggleFeatured);
router.patch('/:id/breaking', authMiddleware, requireEditor, newsController.toggleBreaking);

module.exports = router;
