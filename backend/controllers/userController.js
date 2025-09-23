const Surety = require('../models/Surety');
const User = require('../models/User');

exports.createSurety = async (req, res) => {
  const { shurityName, address, aadharNo, policeStation, caseFirNo, actName, section, accusedName, accusedAddress } = req.body;
  const userId = req.user.id;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const newSurety = new Surety({
      shurityName,
      address,
      aadharNo,
      policeStation,
      caseFirNo,
      actName,
      section,
      accusedName,
      accusedAddress,
      assignedToUser: userId,
      courtCity: user.village,
    });

    await newSurety.save();
    res.status(201).json({ msg: 'Surety created successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getUserSureties = async (req, res) => {
  try {
    const sureties = await Surety.find({ assignedToUser: req.user.id });
    res.json(sureties);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getAllSureties = async (req, res) => {
  try {
    const sureties = await Surety.find().populate('assignedToUser', 'fullName mobileNo');
    res.json(sureties);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};