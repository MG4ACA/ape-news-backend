const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpire, jwtRefreshExpire } = require('../config/jwt');

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, jwtSecret, { expiresIn: jwtExpire });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, jwtSecret, { expiresIn: jwtRefreshExpire });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, jwtSecret);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
};
