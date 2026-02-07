const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },

  // 🔐 Password Reset
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  // ❌ Remove old token system (you can keep if you want both OTP + Link)
  // verificationToken: String,
  // verificationTokenExpires: Date,

  // ✅ New OTP-based Verification System
  verificationOtp: String,
  verificationOtpExpires: Date,

  // ✅ Email Verified Flag
  isVerified: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('User', userSchema);
