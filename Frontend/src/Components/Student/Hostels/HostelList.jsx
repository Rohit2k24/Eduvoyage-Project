import React, { useState, useEffect } from 'react';
import {
  FaBed,
  FaMapMarkerAlt,
  FaStar,
  FaRupeeSign,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaFilter,
  FaSearch,
  FaSpinner
} from 'react-icons/fa';
import axios from 'axios';
import Swal from 'sweetalert2';
import './HostelList.css';

const HostelList = () => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    priceRange: 'all',
    distance: 'all',
    availability: false
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchHostels();
  }, []);

  const fetchHostels = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/student/hostels', {
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

  const handleApplyForHostel = async (hostel, roomType) => {
    try {
      const result = await Swal.fire({
        title: 'Apply for Hostel',
        html: `
          <div>
            <p><strong>Hostel:</strong> ${hostel.name}</p>
            <p><strong>Room Type:</strong> ${roomType.type}</p>
            <p><strong>Price:</strong> ₹${roomType.price}/month</p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Apply',
        cancelButtonText: 'Cancel',
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          try {
            const response = await axios.post(
              '/api/student/hostel-applications',
              {
                hostelId: hostel._id,
                roomType: roomType.type
              },
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              }
            );

            if (response.data.success) {
              return response.data;
            }
          } catch (error) {
            Swal.showValidationMessage(
              error.response?.data?.message || 'Failed to submit application'
            );
          }
        },
        allowOutsideClick: () => !Swal.isLoading()
      });

      if (result.isConfirmed) {
        Swal.fire({
          icon: 'success',
          title: 'Application Submitted',
          text: 'Your hostel application has been submitted successfully!'
        });
      }
    } catch (error) {
      console.error('Error applying for hostel:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to submit application'
      });
    }
  };

  const filteredHostels = hostels.filter(hostel => {
    if (filters.type !== 'all' && hostel.type !== filters.type) return false;
    
    if (filters.availability && !hostel.roomTypes.some(room => room.availableBeds > 0)) {
      return false;
    }

    if (filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(Number);
      const hasRoomInRange = hostel.roomTypes.some(
        room => room.price >= min && room.price <= max
      );
      if (!hasRoomInRange) return false;
    }

    if (filters.distance !== 'all') {
      const [min, max] = filters.distance.split('-').map(Number);
      if (hostel.location.distanceFromCollege < min || hostel.location.distanceFromCollege > max) {
        return false;
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        hostel.name.toLowerCase().includes(query) ||
        hostel.location.address.toLowerCase().includes(query) ||
        hostel.description.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const renderHostelCard = (hostel) => {
    const totalBeds = hostel.roomTypes.reduce((acc, room) => acc + room.totalBeds, 0);
    const availableBeds = hostel.roomTypes.reduce((acc, room) => acc + room.availableBeds, 0);
    const averageRating = hostel.reviews?.length > 0
      ? (hostel.reviews.reduce((acc, rev) => acc + rev.rating, 0) / hostel.reviews.length).toFixed(1)
      : 'N/A';

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
              <span className="stat-value">{averageRating}</span>
              <span className="stat-label">Rating</span>
            </div>
          </div>
          <div className="stat">
            <FaMapMarkerAlt />
            <div>
              <span className="stat-value">{hostel.location.distanceFromCollege}km</span>
              <span className="stat-label">from College</span>
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
              <div className="room-info">
                <span className="room-name">{room.type}</span>
                <span className="room-price">
                  <FaRupeeSign />{room.price}/month
                </span>
              </div>
              <div className="room-availability">
                {room.availableBeds > 0 ? (
                  <span className="available">
                    <FaCheckCircle /> {room.availableBeds} beds available
                  </span>
                ) : (
                  <span className="full">
                    <FaTimesCircle /> Full
                  </span>
                )}
              </div>
              <button
                className="apply-btn"
                onClick={() => handleApplyForHostel(hostel, room)}
                disabled={room.availableBeds === 0}
              >
                Apply Now
              </button>
            </div>
          ))}
        </div>

        <button
          className="view-details-btn"
          onClick={() => setSelectedHostel(selectedHostel === hostel ? null : hostel)}
        >
          {selectedHostel === hostel ? 'Hide Details' : 'View Details'}
        </button>

        {selectedHostel === hostel && (
          <div className="hostel-details">
            <div className="details-section">
              <h4>Description</h4>
              <p>{hostel.description}</p>
            </div>

            <div className="details-section">
              <h4>Facilities</h4>
              <div className="facilities-grid">
                {hostel.facilities.map((facility, index) => (
                  <div key={index} className="facility-item">
                    <h5>{facility.name}</h5>
                    <p>{facility.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="details-section">
              <h4>Rules</h4>
              <ul className="rules-list">
                {hostel.rules.map((rule, index) => (
                  <li key={index}>{rule}</li>
                ))}
              </ul>
            </div>

            <div className="details-section">
              <h4>Warden Contact</h4>
              <div className="warden-info">
                <p><strong>Name:</strong> {hostel.wardenContact.name}</p>
                <p><strong>Phone:</strong> {hostel.wardenContact.phone}</p>
                {hostel.wardenContact.email && (
                  <p><strong>Email:</strong> {hostel.wardenContact.email}</p>
                )}
              </div>
            </div>

            <div className="details-section">
              <h4>Location</h4>
              <p className="address">{hostel.location.address}</p>
            </div>

            {hostel.images?.length > 1 && (
              <div className="details-section">
                <h4>More Images</h4>
                <div className="image-gallery">
                  {hostel.images.slice(1).map((image, index) => (
                    <img key={index} src={image} alt={`${hostel.name} - ${index + 2}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading">
        <FaSpinner className="spinner" />
        <p>Loading hostels...</p>
      </div>
    );
  }

  return (
    <div className="hostel-list">
      <div className="header">
        <h1><FaBed /> Available Hostels</h1>
        <div className="search-filters">
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
            <FaFilter />
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="all">All Types</option>
              <option value="boys">Boys Hostel</option>
              <option value="girls">Girls Hostel</option>
              <option value="co-ed">Co-ed Hostel</option>
            </select>

            <select
              value={filters.priceRange}
              onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
            >
              <option value="all">All Prices</option>
              <option value="0-5000">Under ₹5,000</option>
              <option value="5000-10000">₹5,000 - ₹10,000</option>
              <option value="10000-15000">₹10,000 - ₹15,000</option>
              <option value="15000-100000">Above ₹15,000</option>
            </select>

            <select
              value={filters.distance}
              onChange={(e) => setFilters(prev => ({ ...prev, distance: e.target.value }))}
            >
              <option value="all">All Distances</option>
              <option value="0-1">Under 1 km</option>
              <option value="1-3">1-3 km</option>
              <option value="3-5">3-5 km</option>
              <option value="5-100">Above 5 km</option>
            </select>

            <label className="availability-filter">
              <input
                type="checkbox"
                checked={filters.availability}
                onChange={(e) => setFilters(prev => ({ ...prev, availability: e.target.checked }))}
              />
              Show Available Only
            </label>
          </div>
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
          <div className="no-results">
            <FaBed />
            <h3>No hostels found</h3>
            <p>Try adjusting your filters or search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HostelList; 