import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:5000';

function App() {
  // State for rooms tracking
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search and filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All'); // All, Available, Booked, Occupied

  // Form State
  const [formData, setFormData] = useState({
    id: null,
    roomNumber: '',
    roomType: 'Single',
    price: '',
    status: 'Available',
    guestName: '',
    guestPhone: '',
    checkInDate: '',
    checkOutDate: ''
  });

  // Client-Side Validation State tracking for button state
  const [isFormValid, setIsFormValid] = useState(false);

  // Auto-alert cleanup
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  // Fetch Rooms base controller
  const fetchRooms = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/rooms`;
      if (activeFilter === 'Available') url = `${API_BASE_URL}/available`;
      if (activeFilter === 'Booked') url = `${API_BASE_URL}/booked`; // Fetches Booked + Occupied from backend

      if (searchQuery.trim() !== '') {
        url = `${API_BASE_URL}/search?room=${encodeURIComponent(searchQuery)}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to fetch rooms.');

      // Extra frontend filter handling if backend composite logic needs adjustments
      if (activeFilter === 'Booked') {
        setRooms(data.filter(r => r.status === 'Booked'));
      } else if (activeFilter === 'Occupied') {
        // Backend /booked handles both; split client view dynamically for precision filtering
        const rawResponse = await fetch(`${API_BASE_URL}/booked`);
        const rawData = await rawResponse.json();
        setRooms(rawData.filter(r => r.status === 'Occupied'));
      } else {
        setRooms(data);
      }

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Triggers whenever view conditions change
  useEffect(() => {
    fetchRooms();
  }, [activeFilter, searchQuery]);

  // Validate form in real-time
  useEffect(() => {
    const { roomNumber, price, guestPhone, checkInDate, checkOutDate } = formData;
    
    if (!roomNumber || roomNumber.trim() === '' || roomNumber.length > 10) {
      setIsFormValid(false);
      return;
    }
    if (!price || isNaN(price) || Number(price) <= 0) {
      setIsFormValid(false);
      return;
    }
    if (guestPhone && guestPhone.trim() !== '' && !/^\d{10}$/.test(guestPhone.trim())) {
      setIsFormValid(false);
      return;
    }
    if (checkInDate && checkOutDate) {
      if (new Date(checkOutDate) < new Date(checkInDate)) {
        setIsFormValid(false);
        return;
      }
    }
    setIsFormValid(true);
  }, [formData]);

  // Handle Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Clear Form handler
  const handleClear = () => {
    setFormData({
      id: null,
      roomNumber: '',
      roomType: 'Single',
      price: '',
      status: 'Available',
      guestName: '',
      guestPhone: '',
      checkInDate: '',
      checkOutDate: ''
    });
  };

  // Create Room action
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      const response = await fetch(`${API_BASE_URL}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save room.');

      setSuccessMsg('Room saved successfully!');
      handleClear();
      fetchRooms();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Update Room action
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.id || !isFormValid) return;

    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${formData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update room.');

      setSuccessMsg('Room updated successfully!');
      handleClear();
      fetchRooms();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Delete Room Action
  const handleDelete = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this room?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete room.');

      setSuccessMsg('Room deleted successfully.');
      fetchRooms();
      if (formData.id === id) handleClear();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Populate form for update
  const handleEditSelect = (room) => {
    setFormData({
      id: room.id,
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      price: room.price.toString(),
      status: room.status,
      guestName: room.guestName || '',
      guestPhone: room.guestPhone || '',
      checkInDate: room.checkInDate || '',
      checkOutDate: room.checkOutDate || ''
    });
  };

  // Dynamic Statistics Calculations
  const totalRooms = rooms.length; 
  // For standard aggregate view metrics contextually synchronized with current records configuration:
  const stats = rooms.reduce((acc, current) => {
    acc[current.status] = (acc[current.status] || 0) + 1;
    return acc;
  }, { Available: 0, Booked: 0, Occupied: 0 });

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Grand Horizon Hotel Management Dashboard</h1>
      </header>

      {/* Notifications system wrapper */}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

      {/* Analytics Cards section */}
      <section className="stats-grid">
        <div className="stat-card total-rooms">
          <h3>Total Grid View</h3>
          <p className="stat-value">{totalRooms}</p>
        </div>
        <div className="stat-card status-available">
          <h3>Available</h3>
          <p className="stat-value">{stats.Available}</p>
        </div>
        <div className="stat-card status-booked">
          <h3>Booked</h3>
          <p className="stat-value">{stats.Booked}</p>
        </div>
        <div className="stat-card status-occupied">
          <h3>Occupied</h3>
          <p className="stat-value">{stats.Occupied}</p>
        </div>
      </section>

      {/* Main Structural Layout Blocks */}
      <div className="dashboard-content">
        
        {/* Room Editor Form Element */}
        <aside className="form-wrapper-card">
          <h2>{formData.id ? 'Modify Room Entry' : 'Register New Room'}</h2>
          <form row-gap="15px">
            <div className="form-group">
              <label>Room Number *</label>
              <input 
                type="text" 
                name="roomNumber" 
                maxLength="10"
                value={formData.roomNumber} 
                onChange={handleInputChange} 
                placeholder="e.g. 101" 
                required
              />
            </div>

            <div className="form-group">
              <label>Room Type *</label>
              <select name="roomType" value={formData.roomType} onChange={handleInputChange}>
                <option value="Single">Single</option>
                <option value="Double">Double</option>
                <option value="Deluxe">Deluxe</option>
                <option value="Suite">Suite</option>
              </select>
            </div>

            <div className="form-group">
              <label>Price ($) *</label>
              <input 
                type="number" 
                name="price" 
                min="0"
                step="0.01"
                value={formData.price} 
                onChange={handleInputChange} 
                placeholder="0.00" 
                required
              />
            </div>

            <div className="form-group">
              <label>Status *</label>
              <select name="status" value={formData.status} onChange={handleInputChange}>
                <option value="Available">Available</option>
                <option value="Booked">Booked</option>
                <option value="Occupied">Occupied</option>
              </select>
            </div>

            <div className="form-group">
              <label>Guest Name</label>
              <input 
                type="text" 
                name="guestName" 
                value={formData.guestName} 
                onChange={handleInputChange} 
                placeholder="John Doe" 
              />
            </div>

            <div className="form-group">
              <label>Guest Phone (10 digits)</label>
              <input 
                type="tel" 
                name="guestPhone" 
                value={formData.guestPhone} 
                onChange={handleInputChange} 
                placeholder="1234567890" 
              />
            </div>

            <div className="form-group">
              <label>Check-In Date</label>
              <input 
                type="date" 
                name="checkInDate" 
                value={formData.checkInDate} 
                onChange={handleInputChange} 
              />
            </div>

            <div className="form-group">
              <label>Check-Out Date</label>
              <input 
                type="date" 
                name="checkOutDate" 
                value={formData.checkOutDate} 
                onChange={handleInputChange} 
              />
            </div>

            <div className="form-actions-row">
              <button 
                type="button" 
                className="btn btn-save" 
                disabled={!isFormValid || formData.id !== null} 
                onClick={handleSave}
              >
                Save
              </button>
              <button 
                type="button" 
                className="btn btn-update" 
                disabled={!isFormValid || formData.id === null} 
                onClick={handleUpdate}
              >
                Update
              </button>
              <button 
                type="button" 
                className="btn btn-clear" 
                onClick={handleClear}
              >
                Clear
              </button>
            </div>
          </form>
        </aside>

        {/* Dynamic Interactive Table Controls component */}
        <main className="table-wrapper-card">
          <div className="table-controls-panel">
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search explicitly by Room Number..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <div className="filter-button-group">
              {['All', 'Available', 'Booked', 'Occupied'].map((filterOpt) => (
                <button
                  key={filterOpt}
                  type="button"
                  className={`btn-filter ${activeFilter === filterOpt ? 'active' : ''}`}
                  onClick={() => { setActiveFilter(filterOpt); setSearchQuery(''); }}
                >
                  {filterOpt}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="loader-container">
              <div className="spinner"></div>
              <p>Fetching Registry Database...</p>
            </div>
          ) : (
            <div className="responsive-table-container">
              <table className="custom-dashboard-table">
                <thead>
                  <tr>
                    <th>Room Number</th>
                    <th>Room Type</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Guest</th>
                    <th>Phone</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>
                        No records matching query criteria found.
                      </td>
                    </tr>
                  ) : (
                    rooms.map((room) => (
                      <tr key={room.id}>
                        <td><strong>{room.roomNumber}</strong></td>
                        <td>{room.roomType}</td>
                        <td>${Number(room.price).toFixed(2)}</td>
                        <td>
                          <span className={`badge badge-${room.status.toLowerCase()}`}>
                            {room.status}
                          </span>
                        </td>
                        <td>{room.guestName || '—'}</td>
                        <td>{room.guestPhone || '—'}</td>
                        <td>{room.checkInDate || '—'}</td>
                        <td>{room.checkOutDate || '—'}</td>
                        <td>
                          <div className="action-buttons-flex">
                            <button 
                              className="btn-action btn-edit" 
                              onClick={() => handleEditSelect(room)}
                            >
                              Edit
                            </button>
                            <button 
                              className="btn-action btn-delete" 
                              onClick={() => handleDelete(room.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>

      </div>
    </div>
  );
}

export default App;