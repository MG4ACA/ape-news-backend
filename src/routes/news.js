const express = require('express');
const router = express.Router();

// Placeholder routes - will be implemented in Phase 2
router.get('/', (req, res) => {
  res.json({ message: 'Get all news - to be implemented' });
});

router.get('/:id', (req, res) => {
  res.json({ message: 'Get single news - to be implemented' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create news - to be implemented' });
});

router.put('/:id', (req, res) => {
  res.json({ message: 'Update news - to be implemented' });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Delete news - to be implemented' });
});

module.exports = router;
