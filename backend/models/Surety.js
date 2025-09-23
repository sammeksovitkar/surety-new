const mongoose = require('mongoose');

const SuretySchema = new mongoose.Schema({
  shurityName: { type: String, required: true },
  address: { type: String, required: true },
  aadharNo: { type: String, required: true },
  policeStation: { type: String, required: true },
  caseFirNo: { type: String, required: true },
  actName: { type: String, required: true },
  section: { type: String, required: true },
  accusedName: { type: String, required: true },
  accusedAddress: { type: String, required: true },
  assignedToUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courtCity: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Surety', SuretySchema);