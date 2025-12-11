const express = require('express');
const { registerUser, loginUser, verifyOtp, forgotPassword, resetPassword, changePassword } = require('../controllers/authController'); // <--- Added changePassword
const { protect } = require('../middleware/authMiddleware'); // <--- Needed for protection
const router = express.Router();

router.post('/register', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/change-password', protect, changePassword); // <--- New Route

module.exports = router;