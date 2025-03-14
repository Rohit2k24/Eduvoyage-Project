import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  FaBed,
  FaRupeeSign,
  FaUsers,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaSpinner,
  FaEye
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import './HostelList.css';

const HostelList = ({ 
  collegeId, 
  applications = [], 
  onApplicationSubmit,
  renderActions 
}) => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [existingApplication, setExistingApplication] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHostels();
    checkExistingApplication();
  }, [collegeId]);

  const fetchHostels = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/hostel/college/${collegeId}`, {
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
    } finally {
      setLoading(false);
    }
  };

  const checkExistingApplication = async () => {
    try {
      const response = await axios.get('/api/v1/hostels/student/applications');
      const applications = response.data.data;
      const existingApp = applications.find(app => 
        app.hostel.college.toString() === collegeId.toString() &&
        (app.status === 'pending' || app.status === 'approved')
      );
      setExistingApplication(existingApp);
    } catch (err) {
      console.error('Error checking existing applications:', err);
    }
  };

  const handleApplyHostel = async (hostel, roomType) => {
    try {
      if (existingApplication) {
        const result = await Swal.fire({
          title: 'Existing Application Found',
          text: 'You already have an application for this college. Would you like to view it?',
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'View Application',
          cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
          navigate('/student/hostel-applications');
        }
        return;
      }

      const result = await Swal.fire({
        title: 'Confirm Application',
        html: `
          <p>You are applying for a ${roomType.type} room.</p>
          <p>Price: ₹${roomType.price} per month</p>
          <p>Available Beds: ${roomType.availableBeds}</p>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Apply',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/hostel/apply`,
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

        await Swal.fire({
          title: 'Success!',
          text: 'Your application has been submitted successfully.',
          icon: 'success',
          confirmButtonText: 'View Application'
        });

        navigate('/student/hostel-applications');
      }
    } catch (error) {
      console.error('Error applying for hostel:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to submit hostel application'
      });
    }
  };

  const handleViewApplication = () => {
    navigate('/student/hostel-applications');
  };

  const renderRoomTypeCard = (hostel, roomType, index) => {
    const hasAvailableBeds = roomType.availableBeds > 0;
    const buttonProps = existingApplication
      ? {
          className: 'view-application-button',
          onClick: handleViewApplication,
          children: (
            <>
              <FaEye /> View Application
            </>
          )
        }
      : {
          className: `apply-button ${!hasAvailableBeds ? 'disabled' : ''}`,
          onClick: () => hasAvailableBeds && handleApplyHostel(hostel, roomType),
          disabled: !hasAvailableBeds,
          children: hasAvailableBeds ? 'Apply Now' : 'No Beds Available'
        };

    return (
      <div key={index} className="room-type-card">
        <div className="room-type-header">
          <h5>{roomType.type}</h5>
          <span className="price">
            <FaRupeeSign />
            {roomType.price}/month
          </span>
        </div>
        <div className="room-details">
          <span>Available Beds: {roomType.availableBeds}</span>
          {roomType.amenities && roomType.amenities.length > 0 && (
            <div className="amenities">
              {roomType.amenities.map((amenity, i) => (
                <span key={i} className="amenity">{amenity}</span>
              ))}
            </div>
          )}
        </div>
        <button {...buttonProps} />
      </div>
    );
  };

  const renderHostelCard = (hostel) => (
    <div key={hostel._id} className="hostel-card">
      <div className="hostel-images">
        {hostel.images && hostel.images.length > 0 ? (
          <img src={hostel.images[0]} alt={hostel.name} />
        ) : (
          <div className="placeholder-image">
            <FaBed />
          </div>
        )}
      </div>

      <div className="hostel-content">
        <h3>{hostel.name}</h3>
        <div className="hostel-type">{hostel.type} hostel</div>

        <div className="hostel-info">
          <div className="info-item">
            <FaMapMarkerAlt />
            <span>{hostel.location?.address || 'Location not specified'}</span>
          </div>
          <div className="info-item">
            <FaUsers />
            <span>{hostel.availableRooms} rooms available</span>
          </div>
        </div>

        <div className="room-types">
          <h4>Available Room Types</h4>
          <div className="room-types-grid">
            {hostel.roomTypes.map((roomType, index) => renderRoomTypeCard(hostel, roomType, index))}
          </div>
        </div>

        {hostel.wardenContact && (
          <div className="warden-contact">
            <h4>Warden Contact</h4>
            <div className="contact-info">
              <div className="info-item">
                <FaPhoneAlt />
                <span>{hostel.wardenContact.phone}</span>
              </div>
              <div className="info-item">
                <FaEnvelope />
                <span>{hostel.wardenContact.email}</span>
              </div>
            </div>
          </div>
        )}

        <div className="hostel-actions">
          {renderActions ? (
            renderActions(hostel)
          ) : (
            <button
              className="apply-btn"
              onClick={() => handleApplyHostel(hostel, selectedRoomType)}
              disabled={loading}
            >
              <FaBed /> Apply for Hostel
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading">
        <FaSpinner className="spinner" />
        <p>Loading hostels...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        {error}
      </div>
    );
  }

  if (hostels.length === 0) {
    return (
      <div className="no-hostels">
        <FaBed />
        <h3>No Hostels Available</h3>
        <p>This college has not listed any hostels yet.</p>
      </div>
    );
  }

  return (
    <div className="hostel-list">
      <div className="hostels-grid">
        {hostels.map(hostel => renderHostelCard(hostel))}
      </div>
    </div>
  );
};

export default HostelList; 