const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireEditor } = require('../middleware/roleMiddleware');
const { uploadSingle, handleUploadError } = require('../middleware/uploadMiddleware');
const adController = require('../controllers/adController');

// Public routes
router.get('/active', adController.getActiveAds);
router.post('/:id/click', adController.trackClick);

// Protected routes (Editor and above)
router.get('/', authMiddleware, requireEditor, adController.getAllAds);
router.get('/stats', authMiddleware, requireEditor, adController.getAdStats);
router.get('/:id', authMiddleware, requireEditor, adController.getAd);
router.post(
  '/',
  authMiddleware,
  requireEditor,
  uploadSingle,
  handleUploadError,
  adController.createAd
);
router.put(
  '/:id',
  authMiddleware,
  requireEditor,
  uploadSingle,
  handleUploadError,
  adController.updateAd
);
router.post('/reorder', authMiddleware, requireEditor, adController.reorderAds);
router.delete('/:id', authMiddleware, requireEditor, adController.deleteAd);

module.exports = router;
