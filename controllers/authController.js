const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// 🔐 Token Generator
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '10d',
  });
};

// 🧁 Set Token Cookie and Response (Ye function abhi bhi use ho raha hai loginUser mein)
const sendToken = (res, user) => {
  const token = generateToken(user._id);

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Production mein secure: true rakho
    sameSite: 'Lax',
    maxAge: 10 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    token, // Token bhi bhej do client side pe
  });
};

// ✅ REGISTER USER WITH OTP EMAIL
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);

    // ✅ Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.create({
      name,
      email,
      password: hashedPass,
      verificationOtp: hashedOtp,
      verificationOtpExpires: Date.now() + 10 * 60 * 1000, // 10 min
    });

    // Email content for the user
    const message = `Hello ${name},\n\nYour OTP for verifying your account is: ${otp}\n\nIt will expire in 10 minutes.`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Your OTP',
        text: `Your OTP is: ${otp}`, // fallback
        html: `<h3>Hello ${user.name},</h3><p>Your OTP is: <b>${otp}</b></p>`, // pretty look
      });

      res.status(201).json({
        message: 'User registered. OTP sent to email.',
        userId: user._id, // ✅ user._id frontend ko bheja ja raha hai
      });
    } catch (emailErr) {
      await User.findByIdAndDelete(user._id); // Agar email nahi gaya toh user ko delete kar do
      console.error('❌ Email sending error after registration:', emailErr);
      return res.status(500).json({ message: 'Failed to send OTP email. Please try again.' });
    }

  } catch (err) {
    console.error('❌ Register Error:', err);
    res.status(500).json({ message: 'Registration Failed' });
  }
};

// ✅ VERIFY OTP FUNCTION (Updated)
const verifyOtp = async (req, res) => {
  const { userId, otp } = req.body;

  try {
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
      _id: userId,
      verificationOtp: hashedOtp,
      verificationOtpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // OTP verified successfully, update user status
    user.isVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpires = undefined;
    await user.save();

    // ✅ NEW: User ko automatically login kar do
    sendToken(res, user); // sendToken function user ko cookie set karega aur response bhejne
                          // jismein user data aur token hoga
  } catch (err) {
    console.error('❌ OTP Verify Error:', err);
    res.status(500).json({ message: 'OTP verification failed' });
  }
};

// ✅ LOGIN WITH VERIFICATION CHECK
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Wrong email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Wrong email or password' });

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email to login' });
    }

    sendToken(res, user);
  } catch (err) {
    res.status(500).json({ message: 'LOGIN ERROR' });
  }
};

// ✅ FORGOT PASSWORD (No changes here)
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const message = `
      <h2>Password Reset</h2>
      <p>Click the link to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
    `;

    // sendEmail function yahan string arguments le raha hai, confirm your sendEmail utility
    await sendEmail({
      to: user.email,
      subject: 'Password Reset - CodeX Todo',
      text: `Click the link to reset your password: ${resetUrl}`,
      html: message,
    });

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (err) {
    console.error('❌ Forgot Password Error:', err);
    res.status(500).json({ message: 'Something Went Wrong' });
  }
};

// ✅ GET LOGGED-IN USER (No changes here)
const getMe = (req, res) => {
  res.status(200).json(req.user);
};

module.exports = {
  registerUser,
  verifyOtp,
  loginUser,
  getMe,
  forgotPassword,
};