const User = require('../models/User');
const Surety = require('../models/Surety');
const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');

// =========================================================
// 🔥 UPDATED HELPER FUNCTION: DATE PARSING (TIME ZONE SAFE)
// =========================================================
const safeDate = (dateValue) => {
    if (dateValue === undefined || dateValue === null || dateValue === '') return null;

    let date;

    // 1. Handle Excel Serial Date (Number)
    if (typeof dateValue === 'number' && !isNaN(dateValue)) {
        // Use the xlsx utility
        const d = xlsx.SSF.parse_date_code(dateValue);
        // Use a UTC-based constructor to avoid local timezone offset issues
        date = new Date(Date.UTC(d.y, d.m - 1, d.d));
    } 
    // 2. Handle String/Other Date Formats
    else {
        // Try DD/MM/YYYY or DD-MM-YYYY format specifically
        const dateParts = String(dateValue).match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
        
        if (dateParts) {
            const day = parseInt(dateParts[1], 10);
            const month = parseInt(dateParts[2], 10) - 1; 
            const year = parseInt(dateParts[3], 10);
            
            // Construct a UTC date (Year, Month, Day) to ensure midnight UTC time
            date = new Date(Date.UTC(year, month, day));
        } else {
            // Fallback for other formats (like YYYY-MM-DD or existing Date objects)
            date = new Date(dateValue);
        }
    }

    // Final validation: check if the resulting date is valid
    return isNaN(date?.getTime()) ? null : date;
};
// =========================================================

// ---------------------------------------------------------------- //
// ---------------------------- USER LOGIC -------------------------- //
// ---------------------------------------------------------------- //

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'user' });
        res.json(users);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.createUser = async (req, res) => {
    const { fullName, dob, mobileNo, village, emailId } = req.body;
    try {
        let user = await User.findOne({ mobileNo });
        if (user) return res.status(400).json({ msg: 'User with this mobile number already exists' });

        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash(dob, salt);

        user = new User({ fullName, dob, mobileNo, village, emailId, password });
        await user.save();

        res.status(201).json({ msg: 'User created successfully' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.updateUser = async (req, res) => {
    const { fullName, dob, mobileNo, village, emailId } = req.body;
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.fullName = fullName || user.fullName;
        user.dob = dob || user.dob;
        user.mobileNo = mobileNo || user.mobileNo;
        user.village = village || user.village;
        user.emailId = emailId || user.emailId;

        if (dob) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(dob, salt);
        }

        await user.save();
        res.json({ msg: 'User updated successfully' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json({ msg: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.importUsersFromExcel = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

        const workbook = xlsx.read(req.file.buffer);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        for (const row of data) {
            const { 'Full Name': fullName, 'DOB (YYYY-MM-DD)': dob, 'Mobile No': mobileNo, Village, 'Email ID': emailId } = row;

            if (!fullName || !dob || !mobileNo || !Village) continue;

            const userExists = await User.findOne({ mobileNo });
            if (userExists) continue;

            const salt = await bcrypt.genSalt(10);
            const password = await bcrypt.hash(dob, salt);

            const newUser = new User({
                fullName,
                dob,
                mobileNo,
                village: Village,
                emailId,
                password,
            });

            await newUser.save();
        }
        res.json({ msg: 'Users imported successfully' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

// ---------------------------------------------------------------- //
// --------------------------- SURETY LOGIC ------------------------- //
// ---------------------------------------------------------------- //

exports.getAllSureties = async (req, res) => {
    try {
        const sureties = await Surety.find().populate('assignedToUser', 'fullName mobileNo');
        res.json(sureties);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.createSurety = async (req, res) => {
    // 🔥 NOTE: Changed shurityDate to dateOfSurety for consistency with common model naming
    const { shurityName, address, aadharNo, policeStation, caseFirNo, actName, section, accusedName, accusedAddress, shurityAmount, dateOfSurety, courtCity, assignedToUser } = req.body;
    try {
        // Check for existing surety by Aadhar
        let exists = await Surety.findOne({ aadharNo });
        if (exists) return res.status(400).json({ msg: 'Surety with this Aadhar number already exists' });
        
        // Determine the user to assign this to
        const userToAssignId = assignedToUser || req.user?.id; 

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
            dateOfSurety: safeDate(dateOfSurety), // <-- Use safeDate for consistency
            courtCity,
            assignedToUser: userToAssignId, 
        });

        await newSurety.save();
        res.status(201).json({ msg: 'Surety created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error during surety creation' });
    }
};

exports.updateSurety = async (req, res) => {
    const { shurityName, address, aadharNo, policeStation, caseFirNo, actName, section, accusedName, accusedAddress, shurityAmount, dateOfSurety } = req.body;
    try {
        const surety = await Surety.findById(req.params.id);
        if (!surety) return res.status(404).json({ msg: 'Surety record not found' });

        surety.shurityName = shurityName || surety.shurityName;
        surety.address = address || surety.address;
        surety.aadharNo = aadharNo || surety.aadharNo;
        surety.policeStation = policeStation || surety.policeStation;
        surety.caseFirNo = caseFirNo || surety.caseFirNo;
        surety.actName = actName || surety.actName;
        surety.section = section || surety.section;
        surety.accusedName = accusedName || surety.accusedName;
        surety.accusedAddress = accusedAddress || surety.accusedAddress;
        surety.shurityAmount = shurityAmount || surety.shurityAmount;
        surety.dateOfSurety = safeDate(dateOfSurety) || surety.dateOfSurety; // <-- Use safeDate for update

        await surety.save();
        res.json({ msg: 'Surety record updated successfully' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.deleteSurety = async (req, res) => {
    try {
        const surety = await Surety.findByIdAndDelete(req.params.id);
        if (!surety) return res.status(404).json({ msg: 'Surety record not found' });
        res.json({ msg: 'Surety record deleted successfully' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

// =========================================================
// 🔥 FIX APPLIED HERE: Using safeDate for date parsing
// =========================================================
exports.importSuretiesFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: "No file uploaded" });
        }

        // --- User Check --- (Unchanged)
        let userToAssign = await User.findOne({ mobileNo: "9999999999" });
        if (!userToAssign) {
             const salt = await bcrypt.genSalt(10);
             const password = await bcrypt.hash("2000-01-01", salt); 
             userToAssign = await User.create({
                 fullName: "Default Admin",
                 dob: "2000-01-01",
                 mobileNo: "9999999999",
                 village: "Default",
                 emailId: "default@example.com",
                 password: password, 
             });
        }
        // --- End User Check ---

        const workbook = xlsx.read(req.file.buffer);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        let duplicates = [];
        let savedCount = 0;
        let failedCount = 0;

        for (const row of data) {
            // --- 1. Data Extraction (using common headers) ---
            const aadharNo = String(row["Aadhar No."] || row["Aadhar No"] || row.aadharNo);
            const shurityName = row.shurityName || row["shurityName"] || row["Surety Name"];
            const address = row.Address || row["address"];
            const policeStation = row["Police Station"] || row.policeStation;
            const caseFirNo = String(row["Case/FIR No."] || row["Case/FIR No"] || row.caseFirNo); // Keep this a string
            const actName = row["Act Name"] || row.actName;
            const section = row.Section || row.section;
            const accusedName = row["Accused Name"] || row.accusedName;
            const accusedAddress = row["Accused Address"] || row.accusedAddress;
            const courtCity = row.courtCity || row["Court City"];

            // --- 2. Data Cleaning and Parsing ---
            const rawAmount = row["Surety Amount"] || row.shurityAmount;
            let shurityAmount = 0;
            if (rawAmount !== undefined && rawAmount !== null) {
                shurityAmount = parseFloat(String(rawAmount).replace(/[^0-9.]/g, ''));
                if (isNaN(shurityAmount)) shurityAmount = 0;
            }
            
            const rawDate = row["Surety Date"] || row.shurityDate || row["Date of Surety"] || row["Surety date"] || row.dateOfSurety || row["Surety Date "];
            const dateOfSurety = safeDate(rawDate); // Assuming safeDate is defined elsewhere
            
            // --- 3. Validation Check (Minimal required fields) ---
            // If shurityAmount is 0 (or less), treat it as incomplete
            if (!aadharNo || aadharNo.length !== 12 || !shurityName || shurityAmount <= 0 || !caseFirNo) { 
                console.warn(`Skipping incomplete/invalid row. Aadhar: ${aadharNo}, Amount: ${shurityAmount}, FIR: ${caseFirNo}`);
                failedCount++;
                continue; 
            }

            // --- 4. Duplicate Check (Aadhar only) ---
            // This is explicit check for better logging before Mongoose throws E11000
            const exists = await Surety.findOne({ aadharNo });
            if (exists) {
                duplicates.push({ 
                    aadharNo, 
                    reason: `Aadhar number already exists with surety: ${exists.shurityName}` 
                });
                failedCount++;
                continue; 
            }

            // --- 5. Prepare and Save Document ---
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
                courtCity,
                shurityAmount,
                dateOfSurety,
                assignedToUser: userToAssign._id,
            });

            // 🔥 CRITICAL FIX: Try/Catch inside the loop for save
            try {
                await newSurety.save();
                savedCount++;
            } catch (saveErr) {
                failedCount++;
                // If you removed unique: true on caseFirNo, this error is likely a required field missing
                console.error(`--- FAILED TO SAVE SURETY (Mongoose Error) ---`);
                console.error(`Error: ${saveErr.message}`);
                console.error(`Failing Document Data (Aadhar: ${aadharNo}, FIR: ${caseFirNo})`);
                console.error(`--------------------------------------------------`);
                // Check for E11000 again, just in case a unique index on a different field is the issue
                if (saveErr.code === 11000) {
                     duplicates.push({ 
                        aadharNo, 
                        reason: `Duplicate key violation (Aadhar or another unique index) for key: ${JSON.stringify(saveErr.keyValue)}` 
                    });
                }
                continue; // Skip the bad row
            }
        }

        // --- 6. Response Messages ---
        const totalProcessed = data.length;
        const totalSkipped = totalProcessed - savedCount;
        
        const responseMsg = `Import completed. Saved: ${savedCount}, Skipped: ${totalSkipped}.`;

        return res.json({
            msg: responseMsg,
            saved: savedCount,
            skipped: totalSkipped,
            duplicates: duplicates,
        });

    } catch (err) {
        console.error("❌ Surety import error (System/File):", err);
        res.status(500).json({ msg: "Server error during surety import" });
    }
};