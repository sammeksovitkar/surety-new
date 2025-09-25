import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FaPlus, FaSignOutAlt, FaFilter, FaFileExcel, FaUsers, FaHome, FaUserCircle, FaTimesCircle, FaCalendarAlt, FaMoneyBillWave } from 'react-icons/fa';
import { MdOutlineSecurity } from 'react-icons/md';

const UserDashboard = () => {
    
    const [user, setUser] = useState(null);
    const [sureties, setSureties] = useState([]);
    const [formData, setFormData] = useState({
        shurityName: '', address: '', aadharNo: '', policeStation: '', caseFirNo: '',
        actName: '', section: '', accusedName: '', accusedAddress: '',
        shurityAmount: '', 
        dateOfSurety: '' 
    });
    const [filters, setFilters] = useState({ name: '', caseNo: '', policeStation: '', aadharNo: '' });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [aadharError, setAadharError] = useState('');
    const navigate = useNavigate();
    const backend_Url = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'; 

    const policeStations = [
        "Malegaon", "Manmad", "Nashik City", "Nashik Road", "Gangapur", "Panchavati",
        "Niphad", "Igatpuri", "Ghoti", "Wadivarhe", "Ozar", "Pimpalgaon Baswant",
        "Sinnar", "Laslgaon", "Wavi", "Saykheda", "MIDC Sinner", "Yeola", "Nandgaon",
        "Chandwad", "Vadner Bhairav", "Trimbakeshwar", "Harsul", "Kalwan", "Dindori",
        "Vani", "Abhona", "Surgana", "Deola", "Satana", "Vadner Khakurdi", "Jaikheda",
        "Azadnagar", "Ayeshnagar", "Pawarwadi", "Ramjanpura", "Malegaon Camp", "Malegaon Killa", "Malegaon Chavani"
    ];

    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };

    const showMessage = (text, type) => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 5000);
    };

    useEffect(() => {
        fetchUserData();
        fetchSureties();
    }, []);

    const fetchUserData = async () => {
        try {
            const res = await axios.get(backend_Url + '/api/user/me', config);
            setUser(res.data);
        } catch (err) {
            console.error('Failed to fetch user data');
        }
    };

    const fetchSureties = async () => {
        try {
            const res = await axios.get(backend_Url + '/api/user/allsureties', config); 
            setSureties(res.data);
        } catch (err) {
            showMessage('Failed to fetch surety records. Please ensure you have the necessary permissions.', 'error');
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === 'aadharNo') {
            if (value.length > 12 || !/^\d*$/.test(value)) {
                setAadharError('Aadhar number must be exactly 12 digits.');
            } else {
                setAadharError('');
            }
        }
    };

    const handleSubmitSurety = async (e) => {
        e.preventDefault();

        if (formData.aadharNo.length !== 12 || !/^\d{12}$/.test(formData.aadharNo)) {
            setAadharError('Aadhar number must be exactly 12 digits.');
            return;
        }

        try {
            await axios.post(backend_Url + '/api/user/sureties', formData, config);
            showMessage('Surety record created successfully! 🎉', 'success');
            setFormData({
                shurityName: '', address: '', aadharNo: '', policeStation: '', caseFirNo: '',
                actName: '', section: '', accusedName: '', accusedAddress: '',
                shurityAmount: '', dateOfSurety: '' 
            });
            setShowModal(false);
            fetchSureties();
        } catch (err) {
            showMessage(err.response?.data?.msg || 'Failed to create surety record', 'error');
        }
    };

    const filteredSureties = sureties.filter((s) => {
        return (
            (!filters.name || s.shurityName.toLowerCase().includes(filters.name.toLowerCase())) &&
            (!filters.caseNo || s.caseFirNo.toLowerCase().includes(filters.caseNo.toLowerCase())) &&
            (!filters.policeStation || s.policeStation === filters.policeStation) &&
            (!filters.aadharNo || s.aadharNo.includes(filters.aadharNo))
        );
    });

    const exportToExcel = () => {
        const excelHeaders = [
            "Surety Name", "Address", "Aadhar No.", "Police Station", "Case/FIR No.",
            "Act Name", "Section", "Accused Name", "Accused Address",
            "Surety Amount", "Date of Surety", "Court City", "Assigned To"
        ];
        const dataForExcel = filteredSureties.map(surety => [
            surety.shurityName, 
            surety.address, 
            surety.aadharNo, 
            surety.policeStation, 
            surety.caseFirNo,
            surety.actName, 
            surety.section, 
            surety.accusedName, 
            surety.accusedAddress,
            surety.shurityAmount, 
            surety.dateOfSurety ? new Date(surety.dateOfSurety).toLocaleDateString() : '',
            surety.courtCity || '',
            surety.assignedToUser?.fullName || surety.assignedToUser || ''
        ]);
        const finalData = [excelHeaders, ...dataForExcel];
        const ws = XLSX.utils.aoa_to_sheet(finalData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Surety List");
        const fileName = "Surety_List_" + new Date().toISOString().slice(0, 10) + ".xlsx";
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(dataBlob, fileName);
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const MessageComponent = ({ message, type }) => {
        if (!message) return null;
        const baseClasses = "py-3 px-6 rounded-xl font-medium text-white mb-3 transition-all duration-300 transform animate-fade-in flex items-center shadow-lg"; // Adjusted mb-4 to mb-3
        const typeClasses = type === "success" ? "bg-green-500" : "bg-red-500";
        const Icon = type === "success" ? MdOutlineSecurity : FaTimesCircle;
        return (
            <div className={`${baseClasses} ${typeClasses}`}>
                <Icon className="mr-3 text-xl"/>
                {message}
            </div>
        );
    };

    // Form Input Component with minimum vertical space (used in Modal)
    const FormInput = ({ label, id, name, value, onChange, type = 'text', required = false, error, children, icon: Icon }) => (
        <div className="flex flex-col mb-2"> 
            <label htmlFor={id} className="text-xs font-medium text-gray-700 flex items-center mb-0.5"> 
                {Icon && <Icon className="mr-2 text-indigo-500 text-sm" />}
                {label} {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
                {children ? children : (
                    <input
                        type={type}
                        id={id}
                        name={name}
                        value={value}
                        onChange={onChange}
                        required={required}
                        className={`w-full p-1.5 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md transition-all duration-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm`}
                        maxLength={id === 'aadharNo' ? 12 : undefined}
                    />
                )}
            </div>
            {error && <p className="text-red-500 text-xs mt-0.5 italic">{error}</p>}
        </div>
    );

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans text-gray-800">
            {/* Sidebar: Current Styling */}
            <div 
                className={`
                    w-52 hidden lg:flex bg-white border-r border-gray-200 p-4 flex-col shadow-lg max-h-screen sticky top-0
                `}
            >
                <div className="flex items-center mb-6 py-2">
                    <MdOutlineSecurity className="text-3xl text-indigo-600 mr-2" />
                    <h1 className="text-xl font-extrabold text-indigo-700">SuretyApp</h1>
                </div>
                
                <div className="flex items-center p-3 bg-indigo-50 rounded-xl mb-5 shadow-inner">
                    <FaUserCircle className="text-3xl text-indigo-600 mr-2" />
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-2xs text-indigo-500 truncate">Logged in as</span>
                        <span className="font-semibold text-sm text-indigo-800 truncate">{user?.fullName || 'User'}</span>
                    </div>
                </div>
                
                <nav className="flex-1 space-y-2 overflow-y-auto">
                    <a href="#" className="flex items-center p-3 rounded-xl text-indigo-700 bg-indigo-100 font-medium hover:bg-indigo-200 transition-colors duration-200 text-sm shadow-md">
                        <FaHome className="mr-3 text-lg" />
                        Dashboard
                    </a>
                </nav>
                
                <div className="mt-auto pt-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center p-3 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-colors duration-300 shadow-lg text-sm"
                    >
                        <FaSignOutAlt className="mr-2" /> Logout
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-4 sm:p-8 lg:p-10">
                
                {/* Header and Buttons (Extremely Compact) */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 pb-2 border-b border-gray-200"> {/* Reduced mb-4 to mb-3 and pb-3 to pb-2 */}
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Surety Records</h1>
                        <p className="text-gray-500 mt-0 text-xs">Manage and view all surety records assigned to your court area.</p> {/* Reduced mt-0.5 to mt-0 and text-sm to text-xs */}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-3 mt-2 md:mt-0"> {/* Reduced mt-3 to mt-2 */}
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold flex items-center hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-300/50 text-sm"
                        >
                            <FaPlus className="mr-2" /> Add Surety
                        </button>
                        <button
                            onClick={exportToExcel}
                            className="px-5 py-2 rounded-xl bg-green-600 text-white font-semibold flex items-center hover:bg-green-700 transition-all duration-300 shadow-lg shadow-green-300/50 text-sm"
                        >
                            <FaFileExcel className="mr-2" /> Export
                        </button>
                    </div>
                </header>

                <MessageComponent message={message} type={messageType} />

                {/* Filters (ULTRA COMPACT) */}
                <div className="bg-white p-2 rounded-xl shadow-xl mb-3 border border-gray-100"> {/* Reduced p-3 to p-2 and mb-4 to mb-3 */}
                    <h3 className="text-sm font-semibold mb-1 flex items-center text-gray-700"><FaFilter className="mr-2 text-sm text-indigo-600" /> Quick Filters</h3> {/* Reduced text-md to text-sm and mb-2 to mb-1 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2"> {/* Reduced gap-3 to gap-2 */}
                        
                        {/* Input Fields - p-1.5, rounded-md, text-sm */}
                        <input
                            type="text"
                            placeholder="Surety Name"
                            value={filters.name}
                            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                            className="p-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner"
                        />
                        <input
                            type="text"
                            placeholder="Aadhar No."
                            value={filters.aadharNo}
                            onChange={(e) => setFilters({ ...filters, aadharNo: e.target.value })}
                            className="p-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner"
                        />
                        <input
                            type="text"
                            placeholder="Case/FIR No"
                            value={filters.caseNo}
                            onChange={(e) => setFilters({ ...filters, caseNo: e.target.value })}
                            className="p-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner"
                        />
                        <select
                            value={filters.policeStation}
                            onChange={(e) => setFilters({ ...filters, policeStation: e.target.value })}
                            className="p-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner appearance-none bg-white"
                        >
                            <option value="">All Police Stations</option>
                            {policeStations.map((station) => (
                                <option key={station} value={station}>{station}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table Container (FIXED FOR INTERNAL SCROLL) */}
                <div className="bg-white rounded-2xl shadow-2xl p-0 border border-gray-100">
                    <div 
                        className="overflow-x-auto overflow-y-auto rounded-2xl" 
                        // Added back fixed height and internal scroll
                        style={{ maxHeight: "calc(100vh - 300px)" }} 
                    > 
                        
                        <table className="min-w-full divide-y divide-gray-200 table-auto"> 
                            {/* Sticky Table Header */}
                            <thead className="bg-indigo-50 sticky top-0 z-10 shadow-md">
                                <tr>
                                    <th className="px-3 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider w-[80px]">Date</th>
                                    <th className="px-3 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider w-[120px]">Surety Name</th>
                                    <th className="px-3 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider w-[100px]">Aadhar No.</th>
                                    <th className="px-3 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider w-[140px]">Address</th>
                                    <th className="px-3 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider w-[80px]">P.S.</th>
                                    <th className="px-3 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider w-[100px]">Case/FIR No.</th>
                                    <th className="px-3 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider w-[80px]">Amount</th>
                                    <th className="px-3 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider w-[120px]">Accused Name</th>
                                    <th className="px-3 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider w-[140px]">Accused Address</th>
                                    <th className="px-3 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider w-[90px]">Act Name</th>
                                    <th className="px-3 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider w-[60px]">Section</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredSureties.map(surety => (
                                    <tr key={surety._id} className="hover:bg-indigo-50 transition-colors duration-200">
                                        <td className="px-3 py-3 text-xs text-gray-800">{surety.dateOfSurety ? new Date(surety.dateOfSurety).toLocaleDateString() : 'N/A'}</td>
                                        <td className="px-3 py-3 text-xs text-gray-800 truncate font-medium max-w-[120px]">{surety.shurityName}</td>
                                        <td className="px-3 py-3 text-xs text-gray-800">{surety.aadharNo}</td>
                                        <td className="px-3 py-3 text-xs text-gray-800 truncate max-w-[140px]">{surety.address}</td>
                                        <td className="px-3 py-3 text-xs text-gray-800 truncate max-w-[80px]">{surety.policeStation}</td>
                                        <td className="px-3 py-3 text-xs text-gray-800 font-mono">{surety.caseFirNo}</td>
                                        <td className="px-3 py-3 text-xs text-green-700 font-semibold">{surety.shurityAmount}</td>
                                        <td className="px-3 py-3 text-xs text-gray-800 truncate max-w-[120px]">{surety.accusedName}</td>
                                        <td className="px-3 py-3 text-xs text-gray-800 truncate max-w-[140px]">{surety.accusedAddress}</td>
                                        <td className="px-3 py-3 text-xs text-gray-800 truncate max-w-[90px]">{surety.actName}</td>
                                        <td className="px-3 py-3 text-xs text-gray-800">{surety.section}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>


                {/* Modal Popup for adding Surety (No Internal Scroll - Unchanged) */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] transform transition-all duration-300 scale-100"> 
                            
                            {/* Modal Header: Title, Actions, and Close Button - Fixed Position */}
                            <div className="flex justify-between items-start mb-4 border-b pb-3">
                                
                                {/* Title */}
                                <h2 className="text-2xl font-extrabold text-indigo-700 flex items-center pt-1">
                                    <FaPlus className="mr-3 text-xl"/> Create New Surety Record
                                </h2>
                                
                                {/* Action Buttons (Grouped on the right) */}
                                <div className="flex space-x-3 items-center">
                                    <button 
                                        type="submit" 
                                        form="suretyForm" 
                                        className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-xl shadow-indigo-400/70 text-sm disabled:bg-indigo-400 disabled:shadow-none"
                                        disabled={!!aadharError}
                                    >
                                       Submit
                                    </button>

                                    <button 
                                        type="button" 
                                        onClick={() => setShowModal(false)} 
                                        className="px-4 py-2 bg-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-400 transition-colors shadow-md text-sm border border-gray-400"
                                    >
                                        Cancel
                                    </button>
                                    
                                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-600 transition-colors text-xl p-1 ml-2">
                                        <FaTimesCircle />
                                    </button>
                                </div>
                            </div>

                            {/* Form Body - No Scroll */}
                            <form onSubmit={handleSubmitSurety} id="suretyForm">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"> 
                                    
                                    {/* Section 1: Surety Details */}
                                    <div className="bg-indigo-50 p-3 rounded-xl shadow-inner border border-indigo-200">
                                        <h3 className="text-md font-bold text-indigo-800 mb-3 border-b border-indigo-300 pb-1">Surety/Bailor Information</h3>
                                        <div className="space-y-1"> 
                                            <FormInput label="Surety Name" id="shurityName" name="shurityName" value={formData.shurityName} onChange={handleFormChange} required />
                                            <FormInput label="Address" id="address" name="address" value={formData.address} onChange={handleFormChange} required />
                                            
                                            <FormInput 
                                                label="Aadhar No. (12 digits)" 
                                                id="aadharNo" 
                                                name="aadharNo" 
                                                value={formData.aadharNo} 
                                                onChange={handleFormChange} 
                                                required 
                                                type="number"
                                                error={aadharError}
                                            />
                                            
                                            <FormInput label="Police Station" id="policeStation" name="policeStation" value={formData.policeStation} onChange={handleFormChange} required>
                                                <select id="policeStation" name="policeStation" value={formData.policeStation} onChange={handleFormChange} required className="w-full p-1.5 border border-gray-300 rounded-md transition-all duration-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm appearance-none bg-white">
                                                    <option value="">Select Police Station</option>
                                                    {policeStations.map((station) => <option key={station} value={station}>{station}</option>)}
                                                </select>
                                            </FormInput>

                                            <div className="grid grid-cols-2 gap-3">
                                                <FormInput 
                                                    label="Surety Amount (₹)" 
                                                    id="shurityAmount" 
                                                    name="shurityAmount" 
                                                    value={formData.shurityAmount} 
                                                    onChange={handleFormChange} 
                                                    required 
                                                    type="number" 
                                                    icon={FaMoneyBillWave}
                                                />
                                                <FormInput 
                                                    label="Date of Surety" 
                                                    id="dateOfSurety" 
                                                    name="dateOfSurety" 
                                                    value={formData.dateOfSurety} 
                                                    onChange={handleFormChange} 
                                                    required 
                                                    type="date" 
                                                    icon={FaCalendarAlt}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Case & Accused Details */}
                                    <div className="bg-gray-50 p-3 rounded-xl shadow-inner border border-gray-200">
                                        <h3 className="text-md font-bold text-gray-700 mb-3 border-b border-gray-300 pb-1">Case & Accused Information</h3>
                                        <div className="space-y-1"> 
                                            <FormInput label="Case/FIR No." id="caseFirNo" name="caseFirNo" value={formData.caseFirNo} onChange={handleFormChange} required />
                                            <FormInput label="Act Name" id="actName" name="actName" value={formData.actName} onChange={handleFormChange} required />
                                            <FormInput label="Section" id="section" name="section" value={formData.section} onChange={handleFormChange} required />
                                            <FormInput label="Accused Name" id="accusedName" name="accusedName" value={formData.accusedName} onChange={handleFormChange} required />
                                            <FormInput label="Accused Address" id="accusedAddress" name="accusedAddress" value={formData.accusedAddress} onChange={handleFormChange} required />
                                        </div>
                                    </div>
                                </div>
                            </form>
                            
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDashboard;
