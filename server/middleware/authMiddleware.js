const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 1. Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log("🔹 Middleware: Token received:", token.substring(0, 10) + "...");

      // 2. Verify token
      const decoded = jwt.verify(token, "mySuperSecretKey123");
      console.log("🔹 Middleware: Token Valid. User ID:", decoded.id);

      // 3. Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      // Check if user actually exists in DB
      if (!req.user) {
        console.log("❌ Middleware: User not found in database!");
        return res.status(401).json({ message: 'User not found' });
      }

      next(); // Move to the controller
    } catch (error) {
      console.error("❌ Middleware Error:", error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
      console.log("❌ Middleware: No Bearer Token in header");
      return res.status(401).json({ message: 'Not authorized, no token' });
  }
};