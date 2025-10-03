const Surety = require('../models/Surety');
const User = require('../models/User');
const mongoose = require('mongoose');

// =========================================================
// 🔥 HELPER FUNCTION: DATE PARSING (MUST BE DEFINED)
// =========================================================
const safeDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return null;

    // Check for YYYY-MM-DD format (often sent from frontend after parsing Excel)
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
    }

    // Regex to match DD/MM/YYYY or DD-MM-YYYY
    const dateParts = dateString.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);

    if (dateParts) {
        // Note: JavaScript Date constructor is year, month-1, day
        const day = parseInt(dateParts[1], 10);
        const month = parseInt(dateParts[2], 10) - 1; // Month is 0-indexed
        const year = parseInt(dateParts[3], 10);
        
        const date = new Date(year, month, day);

        // Final check to see if the date is valid
        if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
            return date;
        }
    }
    
    // Fallback attempt for other formats if custom parsing fails
    const genericDate = new Date(dateString);
    return isNaN(genericDate.getTime()) ? null : genericDate;
};

// =========================================================
// 🔥 CREATE SINGLE SURETY
// =========================================================
exports.createSurety = async (req, res) => {
    const { 
        shurityName, 
        address, 
        aadharNo, 
        policeStation, 
        caseFirNo, 
        actName, 
        section, 
        accusedName, 
        accusedAddress,
        shurityAmount,
        dateOfSurety,
        ...restOfBody
    } = req.body;

    const userId = req.user.id; 
    
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

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
            shurityAmount,
            dateOfSurety: safeDate(dateOfSurety),
            assignedToUser: userId,
            courtCity: user.village, // Assuming 'village' from the user model maps to 'courtCity'
            ...restOfBody
        });

        await newSurety.save();
        res.status(201).json({ msg: 'Surety created successfully', surety: newSurety });
    } catch (err) {
        console.error('Server Error on Create Surety:', err.message);
        res.status(500).json({ msg: `Server Error: ${err.message}` });
    }
};

// =========================================================
// 🔥 BATCH IMPORT SURETY
// =========================================================
exports.batchImportSurety = async (req, res) => {
    const recordsToImport = req.body;
    const userId = req.user.id;

    if (!Array.isArray(recordsToImport) || recordsToImport.length === 0) {
        return res.status(400).json({ msg: 'Import payload must be a non-empty array of surety records.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = await User.findById(userId).session(session);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ msg: 'User not found' });
        }

        const documentsToInsert = recordsToImport.map(record => ({
            ...record,
            dateOfSurety: safeDate(record.dateOfSurety),
            assignedToUser: userId,
            courtCity: user.village
        }));

        const result = await Surety.insertMany(documentsToInsert, { session, ordered: false });
        
        await session.commitTransaction();
        session.endSession();
        
        res.status(201).json({ 
            msg: `Successfully imported ${result.length} surety records.`, 
            count: result.length 
        });

    } catch (err) {
        console.error('Batch Import Server Error:', err);
        await session.abortTransaction();
        session.endSession();
        
        res.status(500).json({ 
            msg: `Server failed to process the batch. Error: ${err.message}`,
            error: err.message, 
            count: 0
        });
    }
};

// =========================================================
// 🔥 FETCH SURETIES FOR THE LOGGED-IN USER
// =========================================================
exports.getUserSureties = async (req, res) => {
    try {
        const sureties = await Surety.find({ assignedToUser: req.user.id });
        res.json(sureties);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// =========================================================
// 🔥 FETCH ALL SURETIES (ADMIN/SUPERUSER ACCESS)
// =========================================================
exports.getAllSureties = async (req, res) => {
    try {
        // Populating the user details makes the response more informative
        const sureties = await Surety.find().populate('assignedToUser', 'fullName mobileNo');
        res.json(sureties);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// =========================================================
// 🔥 DELETE SURETY
// =========================================================
exports.deleteSurety = async (req, res) => {
    const suretyId = req.params.id;

    try {
        const deletedSurety = await Surety.findByIdAndDelete(suretyId);

        if (!deletedSurety) {
            return res.status(404).json({ msg: 'Surety record not found.' });
        }
        res.json({ msg: 'Surety record deleted successfully' });
    } catch (err) {
        console.error('Server Error on Delete:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};