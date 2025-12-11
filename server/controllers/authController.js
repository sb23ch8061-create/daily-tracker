const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// --- HELPER: Generate Token ---
const generateToken = (id) => {
  return jwt.sign({ id }, "mySuperSecretKey123", { expiresIn: '30d' });
};

// --- HELPER: Send Email (Currently prints to Console for safety) ---
const sendEmail = async (email, subject, text) => {
  // In real app, configure this with Gmail/SendGrid
  // For now, we print to console so you can copy the PIN easily
  console.log("========================================");
  console.log(`📧 MOCK EMAIL TO: ${email}`);
  console.log(`📝 SUBJECT: ${subject}`);
  console.log(`🔑 MESSAGE: ${text}`);
  console.log("========================================");
};

// 1. REGISTER (Step 1: Save User & Send OTP)
// ... existing imports

exports.registerUser = async (req, res) => {
  const { username, email, password, dob, profession } = req.body;
  try {
    let user = await User.findOne({ email });

    // Generate PIN
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins

    if (user) {
      // CASE 1: User exists AND is verified -> Block them
      if (user.isVerified) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      // CASE 2: User exists but NOT verified -> Overwrite & Resend OTP
      user.username = username;
      user.password = password; // Will be hashed by pre-save
      user.dob = dob;
      user.profession = profession;
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();

    } else {
      // CASE 3: New User -> Create
      user = await User.create({
        username, email, password, dob, profession,
        otp, otpExpires, isVerified: false
      });
    }

    await sendEmail(email, "Verify Account", `Your PIN is: ${otp}`);
    res.status(201).json({ message: 'OTP sent to email', email });

  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ... keep the rest of the file same (verifyOtp, loginUser, etc.)

// 2. VERIFY OTP (Step 2: Activate Account)
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    
    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or Expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      token: generateToken(user._id),
    });

  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 3. LOGIN (Supports Email OR Username)
exports.loginUser = async (req, res) => {
  const { identifier, password } = req.body; // 'identifier' can be email or username
  try {
    // Search by Email OR Username
    const user = await User.findOne({
        $or: [{ email: identifier }, { username: identifier }]
    });

    if (user && (await user.matchPassword(password))) {
      if (!user.isVerified) return res.status(401).json({ message: 'Account not verified. Please signup again.' });
      
      res.json({
        _id: user._id,
        username: user.username,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 4. FORGOT PASSWORD (Send OTP)
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail(email, "Reset Password", `Your Password Reset PIN is: ${otp}`);
    res.json({ message: 'OTP sent' });

  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 5. RESET PASSWORD (Verify OTP & Change)
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or Expired OTP' });
    }

    user.password = newPassword; // Will be hashed by pre-save hook
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });

  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 6. CHANGE PASSWORD (Authenticated)
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);
    
    if (user && (await user.matchPassword(currentPassword))) {
      user.password = newPassword; // Pre-save hook will hash it
      await user.save();
      res.json({ message: 'Password Updated Successfully' });
    } else {
      res.status(401).json({ message: 'Invalid current password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};