const express = require('express');
const router = express.Router();

// Placeholder routes
router.get('/news/:newsId', (req, res) => {
  res.json({ message: 'Get comments for news - to be implemented' });
});

module.exports = router;
