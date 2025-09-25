import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FaPlus, FaSignOutAlt, FaFilter, FaFileExcel, FaUsers, FaHome, FaUserCircle } from 'react-icons/fa';

const UserDashboard = () => {
    // REMOVED: isSidebarOpen state and logic
    
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
            showMessage('Surety record created successfully!', 'success');
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
            "Surety Amount", "Date of Surety"
        ];
        const dataForExcel = filteredSureties.map(surety => [
            surety.shurityName, surety.address, surety.aadharNo, surety.policeStation, surety.caseFirNo,
            surety.actName, surety.section, surety.accusedName, surety.accusedAddress,
            surety.shurityAmount, surety.dateOfSurety ? new Date(surety.dateOfSurety).toLocaleDateString() : ''
        ]);
        const finalData = [excelHeaders, ...dataForExcel];
        const ws = XLSX.utils.aoa_to_sheet(finalData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Surety List");
        const fileName = "Manmad Police Station Shurity List.xlsx";
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
        const baseClasses = "py-3 px-6 rounded-lg font-medium text-white mb-4 transition-all duration-300 transform animate-fade-in";
        const typeClasses = type === "success" ? "bg-green-500" : "bg-red-500";
        return <div className={`${baseClasses} ${typeClasses}`}>{message}</div>;
    };

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans text-gray-800">
            {/* Sidebar: Fixed w-52 width on larger screens */}
            <div 
                className={`
                    w-52 hidden lg:flex bg-white border-r border-gray-200 p-4 flex-col shadow-lg max-h-screen sticky top-0
                `}
            >
                {/* Header/Logo section */}
                <div className="flex items-center mb-6 py-2">
                    <FaUsers className="text-2xl text-indigo-600 mr-2" />
                    <h1 className="text-xl font-bold">Dashboard</h1>
                </div>
                
                {/* User Info - compact look */}
                <div className="flex items-center p-3 bg-gray-100 rounded-lg mb-5">
                    <FaUserCircle className="text-3xl text-indigo-600 mr-2" />
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-2xs text-gray-500 truncate">Logged in as</span>
                        <span className="font-semibold text-sm text-gray-800 truncate">{user?.fullName || user?.username || 'Guest'}</span>
                    </div>
                </div>
                
                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto">
                    <a href="#" className="flex items-center p-3 rounded-lg text-indigo-600 bg-indigo-50 font-medium hover:bg-indigo-100 transition-colors duration-200 text-sm">
                        <FaHome className="mr-3 text-lg" />
                        Home
                    </a>
                    <a href="#" className="flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-200 text-sm">
                        <FaUsers className="mr-3 text-lg" />
                        Sureties
                    </a>
                </nav>
                
                {/* Logout Button */}
                <div className="mt-auto pt-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center p-3 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors duration-300 shadow-lg text-sm"
                    >
                        <FaSignOutAlt className="mr-2" /> Logout
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-8 sm:p-10">
                
                {/* Header and Buttons */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <div className="flex items-center">
                        {/* REMOVED: The toggle button for the sidebar */}

                        <div>
                            <h1 className="text-4xl font-extrabold text-gray-900">Surety Records</h1>
                            <p className="text-gray-500 mt-1">Manage and view all surety records in one place.</p>
                        </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-3 mt-4 md:mt-0">
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-semibold flex items-center hover:bg-indigo-700 transition-all duration-300 shadow-lg text-sm"
                        >
                            <FaPlus className="mr-2" /> Add Surety
                        </button>
                        <button
                            onClick={exportToExcel}
                            className="px-6 py-2 rounded-xl bg-green-600 text-white font-semibold flex items-center hover:bg-green-700 transition-all duration-300 shadow-lg text-sm"
                        >
                            <FaFileExcel className="mr-2" /> Export
                        </button>
                    </div>
                </header>

                <MessageComponent message={message} type={messageType} />

                {/* Filters */}
                <div className="bg-white p-4 rounded-3xl shadow-xl mb-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-700"><FaFilter className="mr-2 text-sm" /> Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <input
                            type="text"
                            placeholder="Surety Name"
                            value={filters.name}
                            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                            className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                        />
                        <input
                            type="text"
                            placeholder="Aadhar No."
                            value={filters.aadharNo}
                            onChange={(e) => setFilters({ ...filters, aadharNo: e.target.value })}
                            className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                        />
                        <input
                            type="text"
                            placeholder="Case/FIR No"
                            value={filters.caseNo}
                            onChange={(e) => setFilters({ ...filters, caseNo: e.target.value })}
                            className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                        />
                        <select
                            value={filters.policeStation}
                            onChange={(e) => setFilters({ ...filters, policeStation: e.target.value })}
                            className="p-2 border rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">Police Station</option>
                            {policeStations.map((station) => (
                                <option key={station} value={station}>{station}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table Container (Scrolls independently - full width) */}
                <div className="bg-white rounded-3xl shadow-xl p-0">
                    <div className="overflow-x-auto overflow-y-auto rounded-xl shadow-inner-lg" style={{ maxHeight: "calc(100vh - 350px)" }}>
                        
                        <table className="min-w-full divide-y divide-gray-200 table-fixed"> 
                            {/* Sticky Table Header - Minimized Text/Padding/Widths */}
                            <thead className="bg-gray-100 sticky top-0 z-10">
                                <tr>
                                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[100px]">Date</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[140px]">Surety Name</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[100px]">Aadhar No.</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[170px]">Address</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[100px]">P.S.</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[110px]">Case/FIR No.</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[90px]">Amt</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[140px]">Accused Name</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[170px]">Accused Address</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[100px]">Act Name</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[80px]">Section</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredSureties.map(surety => (
                                    <tr key={surety._id} className="hover:bg-gray-50 transition-colors duration-200">
                                        <td className="px-2 py-2 text-xs text-gray-800">{surety.dateOfSurety ? new Date(surety.dateOfSurety).toLocaleDateString() : 'N/A'}</td>
                                        <td className="px-2 py-2 text-xs text-gray-800 truncate">{surety.shurityName}</td>
                                        <td className="px-2 py-2 text-xs text-gray-800">{surety.aadharNo}</td>
                                        <td className="px-2 py-2 text-xs text-gray-800 truncate">{surety.address}</td>
                                        <td className="px-2 py-2 text-xs text-gray-800 truncate">{surety.policeStation}</td>
                                        <td className="px-2 py-2 text-xs text-gray-800">{surety.caseFirNo}</td>
                                        <td className="px-2 py-2 text-xs text-gray-800">{surety.shurityAmount}</td>
                                        <td className="px-2 py-2 text-xs text-gray-800 truncate">{surety.accusedName}</td>
                                        <td className="px-2 py-2 text-xs text-gray-800 truncate">{surety.accusedAddress}</td>
                                        <td className="px-2 py-2 text-xs text-gray-800 truncate">{surety.actName}</td>
                                        <td className="px-2 py-2 text-xs text-gray-800">{surety.section}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>


                {/* Modal Popup for adding Surety (No changes) */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Create New Surety</h2>
                            <form onSubmit={handleSubmitSurety}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
                                    {/* Surety Information Section - Left side */}
                                    <div className="bg-gray-50 p-6 rounded-2xl shadow-inner border border-gray-200">
                                        <h3 className="text-xl font-semibold text-gray-700 mb-4">Surety Information</h3>
                                        <div className="space-y-4">
                                            <div className="flex flex-col">
                                                <label htmlFor="shurityName" className="text-sm font-medium text-gray-600">Surety Name</label>
                                                <input type="text" id="shurityName" name="shurityName" value={formData.shurityName} onChange={handleFormChange} required className="mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                            <div className="flex flex-col">
                                                <label htmlFor="address" className="text-sm font-medium text-gray-600">Address</label>
                                                <input type="text" id="address" name="address" value={formData.address} onChange={handleFormChange} required className="mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                            <div className="flex flex-col">
                                                <label htmlFor="aadharNo" className="text-sm font-medium text-gray-600">Aadhar No. (12 digits)</label>
                                                <input type="text" id="aadharNo" name="aadharNo" value={formData.aadharNo} onChange={handleFormChange} required className="mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" maxLength="12" />
                                                {aadharError && <p className="text-red-500 text-sm mt-1">{aadharError}</p>}
                                            </div>
                                            <div className="flex flex-col">
                                                <label htmlFor="policeStation" className="text-sm font-medium text-gray-600">Police Station</label>
                                                <select id="policeStation" name="policeStation" value={formData.policeStation} onChange={handleFormChange} required className="mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                                                    <option value="">Select Police Station</option>
                                                    {policeStations.map((station) => <option key={station} value={station}>{station}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex flex-col">
                                                <label htmlFor="shurityAmount" className="text-sm font-medium text-gray-600">Surety Amount</label>
                                                <input type="number" id="shurityAmount" name="shurityAmount" value={formData.shurityAmount} onChange={handleFormChange} required className="mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                            <div className="flex flex-col">
                                                <label htmlFor="dateOfSurety" className="text-sm font-medium text-gray-600">Date of Surety</label>
                                                <input type="date" id="dateOfSurety" name="dateOfSurety" value={formData.dateOfSurety} onChange={handleFormChange} required className="mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Accused Information Section - Right side */}
                                    <div className="bg-gray-50 p-6 rounded-2xl shadow-inner border border-gray-200">
                                        <h3 className="text-xl font-semibold text-gray-700 mb-4">Accused Information</h3>
                                        <div className="space-y-4">
                                            <div className="flex flex-col">
                                                <label htmlFor="caseFirNo" className="text-sm font-medium text-gray-600">Case/FIR No.</label>
                                                <input type="text" id="caseFirNo" name="caseFirNo" value={formData.caseFirNo} onChange={handleFormChange} required className="mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                            <div className="flex flex-col">
                                                <label htmlFor="actName" className="text-sm font-medium text-gray-600">Act Name</label>
                                                <input type="text" id="actName" name="actName" value={formData.actName} onChange={handleFormChange} required className="mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                            <div className="flex flex-col">
                                                <label htmlFor="section" className="text-sm font-medium text-gray-600">Section</label>
                                                <input type="text" id="section" name="section" value={formData.section} onChange={handleFormChange} required className="mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                            <div className="flex flex-col">
                                                <label htmlFor="accusedName" className="text-sm font-medium text-gray-600">Accused Name</label>
                                                <input type="text" id="accusedName" name="accusedName" value={formData.accusedName} onChange={handleFormChange} required className="mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                            <div className="flex flex-col">
                                                <label htmlFor="accusedAddress" className="text-sm font-medium text-gray-600">Accused Address</label>
                                                <input type="text" id="accusedAddress" name="accusedAddress" value={formData.accusedAddress} onChange={handleFormChange} required className="mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-4 mt-6">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors">Cancel</button>
                                    <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Submit</button>
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
