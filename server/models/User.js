const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // --- NEW FIELDS ---
  dob: { type: Date },
  profession: { type: String },
  
  // Security Fields
  isVerified: { type: Boolean, default: false }, // User must verify OTP to login
  otp: { type: String },
  otpExpires: { type: Date }
});

// Password Encryption (FIXED: Removed 'next')
UserSchema.pre('save', async function () {
  // If password is not modified, simply return (exit function)
  if (!this.isModified('password')) return;
  
  // Hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);