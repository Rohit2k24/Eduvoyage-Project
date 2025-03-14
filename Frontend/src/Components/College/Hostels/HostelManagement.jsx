import React, { useState, useEffect } from 'react';
import { 
  FaBed, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSpinner,
  FaUsers,
  FaStar,
  FaMapMarkerAlt,
  FaRupeeSign,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaFilter
} from 'react-icons/fa';
import axios from 'axios';
import Swal from 'sweetalert2';
import HostelForm from './HostelForm';
import CollegeSidebar from '../CollegeDashboard/CollegeSidebar';
import './HostelManagement.css';

const HostelManagement = () => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchHostels();
  }, []);

  const fetchHostels = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/hostel`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setHostels(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching hostels:', error);
      setError(error.response?.data?.message || 'Error fetching hostels');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to load hostels'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddHostel = async (formData) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/hostel`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Hostel added successfully'
        });
        setShowAddForm(false);
        fetchHostels();
      }
    } catch (error) {
      console.error('Error adding hostel:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to add hostel'
      });
    }
  };

  const handleUpdateHostel = async (formData) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/hostel/${selectedHostel._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Hostel updated successfully'
        });
        setSelectedHostel(null);
        fetchHostels();
      }
    } catch (error) {
      console.error('Error updating hostel:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to update hostel'
      });
    }
  };

  const handleDeleteHostel = async (id) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        const response = await axios.delete(`${import.meta.env.VITE_API_URL}/api/hostel/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success) {
          Swal.fire(
            'Deleted!',
            'Hostel has been deleted.',
            'success'
          );
          fetchHostels();
        }
      }
    } catch (error) {
      console.error('Error deleting hostel:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to delete hostel'
      });
    }
  };

  const filteredHostels = hostels.filter(hostel => {
    // Filter by type
    if (filterType !== 'all' && hostel.type !== filterType) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        hostel.name.toLowerCase().includes(query) ||
        hostel.location?.address?.toLowerCase().includes(query) ||
        hostel.type.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const renderHostelCard = (hostel) => {
    const totalBeds = hostel.roomTypes.reduce((acc, room) => acc + room.totalBeds, 0);
    const availableBeds = hostel.roomTypes.reduce((acc, room) => acc + room.availableBeds, 0);
    const occupancyRate = ((totalBeds - availableBeds) / totalBeds) * 100;

    return (
      <div key={hostel._id} className="hostel-card">
        <div className="hostel-card-header">
          <div className="hostel-image">
            {hostel.images?.[0] ? (
              <img src={hostel.images[0]} alt={hostel.name} />
            ) : (
              <FaBed className="default-hostel-icon" />
            )}
          </div>
          <div className="hostel-info">
            <h3>{hostel.name}</h3>
            <p className="hostel-type">{hostel.type}</p>
          </div>
        </div>

        <div className="hostel-stats">
          <div className="stat">
            <FaUsers />
            <div>
              <span className="stat-value">{availableBeds}/{totalBeds}</span>
              <span className="stat-label">Beds Available</span>
            </div>
          </div>
          <div className="stat">
            <FaStar />
            <div>
              <span className="stat-value">
                {hostel.reviews?.length > 0 
                  ? (hostel.reviews.reduce((acc, rev) => acc + rev.rating, 0) / hostel.reviews.length).toFixed(1)
                  : 'N/A'}
              </span>
              <span className="stat-label">Rating</span>
            </div>
          </div>
          <div className="stat">
            <FaMapMarkerAlt />
            <div>
              <span className="stat-value">{hostel.location?.distanceFromCollege || 'N/A'}</span>
              <span className="stat-label">km from College</span>
            </div>
          </div>
        </div>

        {hostel.facilities && hostel.facilities.length > 0 && (
          <div className="hostel-facilities">
            <h4>Facilities</h4>
            <div className="facilities-grid">
              {hostel.facilities.map((facility, index) => (
                <div key={index} className="facility-item">
                  {facility.icon && <i className={facility.icon}></i>}
                  <div className="facility-info">
                    <span className="facility-name">{facility.name}</span>
                    {facility.description && (
                      <span className="facility-description">{facility.description}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="room-types">
          {hostel.roomTypes.map((room, index) => (
            <div key={index} className="room-type">
              <span className="room-name">{room.type}</span>
              <span className="room-price">
                <FaRupeeSign />{room.price}/month
              </span>
              <span className={`room-availability ${room.availableBeds > 0 ? 'available' : 'full'}`}>
                {room.availableBeds > 0 ? (
                  <><FaCheckCircle /> {room.availableBeds} beds available</>
                ) : (
                  <><FaTimesCircle /> Full</>
                )}
              </span>
            </div>
          ))}
        </div>

        <div className="hostel-actions">
          <button 
            className="edit-btn"
            onClick={() => setSelectedHostel(hostel)}
          >
            <FaEdit /> Edit
          </button>
          <button 
            className="delete-btn"
            onClick={() => handleDeleteHostel(hostel._id)}
          >
            <FaTrash /> Delete
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <CollegeSidebar />
        <div className="loading">
          <FaSpinner className="spinner" />
          <p>Loading hostels...</p>
        </div>
      </>
    );
  }

  // Get unique hostel types for filter
  const hostelTypes = [...new Set(hostels.map(hostel => hostel.type))];

  return (
    <>
      <CollegeSidebar />
      <div className="hostel-management">
        <div className="header">
          <h1><FaBed /> Hostel Management</h1>
          
          <div className="header-controls">
            <div className="search-bar">
              <FaSearch />
              <input
                type="text"
                placeholder="Search hostels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="filters">
              <div className="filter-group">
                <FaFilter />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  {hostelTypes.map((type, index) => (
                    <option key={index} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <button 
              className="add-hostel-btn"
              onClick={() => setShowAddForm(true)}
            >
              <FaPlus /> Add Hostel
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="hostels-grid">
          {filteredHostels.length > 0 ? (
            filteredHostels.map(renderHostelCard)
          ) : (
            <div className="no-hostels">
              <FaBed />
              <h3>No Hostels Found</h3>
              <p>There are no hostels matching your filters.</p>
            </div>
          )}
        </div>

        {(showAddForm || selectedHostel) && (
          <HostelForm
            hostel={selectedHostel}
            onSubmit={selectedHostel ? handleUpdateHostel : handleAddHostel}
            onClose={() => {
              setShowAddForm(false);
              setSelectedHostel(null);
            }}
          />
        )}
      </div>
    </>
  );
};

export default HostelManagement; 