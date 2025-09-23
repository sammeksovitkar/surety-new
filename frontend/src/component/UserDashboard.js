import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FaPlus, FaSignOutAlt, FaFilter, FaFileExcel, FaUsers, FaHome, FaUserCircle } from 'react-icons/fa';

const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [sureties, setSureties] = useState([]);
  const [formData, setFormData] = useState({
    shurityName: '', address: '', aadharNo: '', policeStation: '', caseFirNo: '',
    actName: '', section: '', accusedName: '', accusedAddress: ''
  });
  const [filters, setFilters] = useState({ name: '', caseNo: '', policeStation: '', aadharNo: '' });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [aadharError, setAadharError] = useState('');
  const navigate = useNavigate();

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
      const res = await axios.get('http://localhost:5000/api/user/me', config);
      setUser(res.data);
    } catch (err) {
      console.error('Failed to fetch user data');
    }
  };

  const fetchSureties = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/user/allsureties', config);
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
      await axios.post('http://localhost:5000/api/user/sureties', formData, config);
      showMessage('Surety record created successfully!', 'success');
      setFormData({
        shurityName: '', address: '', aadharNo: '', policeStation: '', caseFirNo: '',
        actName: '', section: '', accusedName: '', accusedAddress: ''
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
      "Act Name", "Section", "Accused Name", "Accused Address"
    ];
    const dataForExcel = filteredSureties.map(surety => [
      surety.shurityName, surety.address, surety.aadharNo, surety.policeStation, surety.caseFirNo,
      surety.actName, surety.section, surety.accusedName, surety.accusedAddress
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
      {/* Sidebar */}
      <div className="hidden md:flex w-64 bg-white border-r border-gray-200 p-6 flex-col shadow-lg">
        <div className="flex items-center mb-8">
          <FaUsers className="text-3xl text-indigo-600 mr-3" />
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        
        {/* User Profile Section */}
        <div className="flex items-center p-4 bg-gray-100 rounded-lg mb-6">
          <FaUserCircle className="text-4xl text-indigo-600 mr-3" />
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Logged in as</span>
            {/* UPDATED: Show full name, with fallback to username or Guest */}
            <span className="font-semibold text-gray-800">{user?.fullName || user?.username || 'Guest'}</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <a href="#" className="flex items-center p-3 rounded-lg text-indigo-600 bg-indigo-50 font-medium hover:bg-indigo-100 transition-colors duration-200">
            <FaHome className="mr-4 text-xl" />
            Home
          </a>
          <a href="#" className="flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-200">
            <FaUsers className="mr-4 text-xl" />
            Sureties
          </a>
        </nav>
        <div className="mt-auto pt-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-3 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors duration-300 shadow-lg"
          >
            <FaSignOutAlt className="mr-2" /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 sm:p-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">Surety Records</h1>
            <p className="text-gray-500 mt-1">Manage and view all surety records in one place.</p>
          </div>
          <div className="flex space-x-3 mt-4 md:mt-0">
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-semibold flex items-center hover:bg-indigo-700 transition-all duration-300 shadow-lg"
            >
              <FaPlus className="mr-2" /> Add Surety
            </button>
            <button
              onClick={exportToExcel}
              className="px-6 py-2 rounded-xl bg-green-600 text-white font-semibold flex items-center hover:bg-green-700 transition-all duration-300 shadow-lg"
            >
              <FaFileExcel className="mr-2" /> Export
            </button>
          </div>
        </header>

        <MessageComponent message={message} type={messageType} />

        {/* Filters and Table Section */}
        <div className="bg-white p-6 rounded-3xl shadow-xl">
          <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-700"><FaFilter className="mr-2" /> Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <input
              type="text"
              placeholder="Filter by Surety Name"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
            <input
              type="text"
              placeholder="Filter by Aadhar No."
              value={filters.aadharNo}
              onChange={(e) => setFilters({ ...filters, aadharNo: e.target.value })}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
            <input
              type="text"
              placeholder="Filter by Case/FIR No"
              value={filters.caseNo}
              onChange={(e) => setFilters({ ...filters, caseNo: e.target.value })}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
            <select
              value={filters.policeStation}
              onChange={(e) => setFilters({ ...filters, policeStation: e.target.value })}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="">Filter by Police Station</option>
              {policeStations.map((station) => (
                <option key={station} value={station}>{station}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl shadow-inner-lg" style={{ maxHeight: "calc(100vh - 350px)" }}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Surety Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Aadhar No.</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Police Station</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Case/FIR No.</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Act Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Section</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Accused Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Accused Address</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSureties.map(surety => (
                  <tr key={surety._id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{surety.shurityName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{surety.address}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{surety.aadharNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{surety.policeStation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{surety.caseFirNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{surety.actName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{surety.section}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{surety.accusedName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{surety.accusedAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Popup with updated form */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Create New Surety</h2>
              <form onSubmit={handleSubmitSurety}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Surety Information Section */}
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
                    </div>
                  </div>

                  {/* Accused Information Section */}
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