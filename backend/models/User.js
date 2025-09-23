const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  dob: { type: Date, required: true },
  mobileNo: { type: String, required: true, unique: true },
  village: { type: String, required: true }, // Court City
  emailId: { type: String, unique: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  password: { type: String, required: true },
});

module.exports = mongoose.model('User', UserSchema);