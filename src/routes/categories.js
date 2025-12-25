const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireEditor } = require('../middleware/roleMiddleware');
const categoryController = require('../controllers/categoryController');

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:id/children', categoryController.getCategoryChildren);
router.get('/:id', categoryController.getCategory);

// Protected routes (Editor and above)
router.post('/', authMiddleware, requireEditor, categoryController.createCategory);
router.put('/:id', authMiddleware, requireEditor, categoryController.updateCategory);
router.patch(
  '/:id/deactivate',
  authMiddleware,
  requireEditor,
  categoryController.deactivateCategory
);
router.post('/reorder', authMiddleware, requireEditor, categoryController.reorderCategories);
router.delete('/:id', authMiddleware, requireEditor, categoryController.deleteCategory);

module.exports = router;
