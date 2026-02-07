const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  verifyOtp, 
  loginUser, 
  getMe, 
  forgotPassword 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp); // ✅ improved naming

module.exports = router;
