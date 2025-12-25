const express = require('express');
const router = express.Router();

// Placeholder routes - will be implemented in Phase 2
router.post('/register', (req, res) => {
  res.json({ message: 'Register endpoint - to be implemented' });
});

router.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint - to be implemented' });
});

router.get('/me', (req, res) => {
  res.json({ message: 'Get current user - to be implemented' });
});

module.exports = router;
