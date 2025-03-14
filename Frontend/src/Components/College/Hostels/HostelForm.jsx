import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaUpload } from 'react-icons/fa';
import './HostelForm.css';
import Swal from 'sweetalert2';

const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const HostelForm = ({ hostel, onSubmit, onClose }) => {
  const initialState = {
    name: '',
    type: 'boys', // boys, girls, co-ed
    totalRooms: '',
    availableRooms: '',
    roomTypes: [
      {
        type: 'single',
        price: '',
        totalBeds: '',
        availableBeds: '',
        amenities: [],
        images: []
      }
    ],
    facilities: [{ name: '', description: '' }],
    rules: [''],
    location: {
      address: '',
      distanceFromCollege: ''
    },
    images: [],
    description: '',
    wardenContact: {
      name: '',
      phone: '',
      email: ''
    }
  };

  const [formData, setFormData] = useState(initialState);
  const [imageFiles, setImageFiles] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (hostel) {
      setFormData(hostel);
    }
  }, [hostel]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [name]: value
      }
    }));
  };

  const handleWardenContactChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      wardenContact: {
        ...prev.wardenContact,
        [name]: value
      }
    }));
  };

  const handleRoomTypeChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      roomTypes: prev.roomTypes.map((room, i) => 
        i === index ? { ...room, [field]: value } : room
      )
    }));
  };

  const addRoomType = () => {
    setFormData(prev => ({
      ...prev,
      roomTypes: [
        ...prev.roomTypes,
        {
          type: 'single',
          price: '',
          totalBeds: '',
          availableBeds: '',
          amenities: [],
          images: []
        }
      ]
    }));
  };

  const removeRoomType = (index) => {
    setFormData(prev => ({
      ...prev,
      roomTypes: prev.roomTypes.filter((_, i) => i !== index)
    }));
  };

  const handleFacilityChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.map((facility, i) => 
        i === index ? { ...facility, [field]: value } : facility
      )
    }));
  };

  const addFacility = () => {
    setFormData(prev => ({
      ...prev,
      facilities: [...prev.facilities, { name: '', description: '' }]
    }));
  };

  const removeFacility = (index) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.filter((_, i) => i !== index)
    }));
  };

  const handleRuleChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) => i === index ? value : rule)
    }));
  };

  const addRule = () => {
    setFormData(prev => ({
      ...prev,
      rules: [...prev.rules, '']
    }));
  };

  const removeRule = (index) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    try {
      const base64Images = await Promise.all(files.map(convertToBase64));
      setImageFiles(prev => [...prev, ...base64Images]);
    } catch (error) {
      console.error('Error converting images:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to process images'
      });
    }
  };

  const handleRoomTypeImageUpload = async (index, e) => {
    const files = Array.from(e.target.files);
    try {
      const base64Images = await Promise.all(files.map(convertToBase64));
      setFormData(prev => ({
        ...prev,
        roomTypes: prev.roomTypes.map((room, i) => 
          i === index ? { 
            ...room, 
            images: [...(room.images || []), ...base64Images]
          } : room
        )
      }));
    } catch (error) {
      console.error('Error converting room type images:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to process room type images'
      });
    }
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.type) newErrors.type = 'Type is required';
    if (!formData.totalRooms) newErrors.totalRooms = 'Total rooms is required';
    if (!formData.availableRooms) newErrors.availableRooms = 'Available rooms is required';
    
    formData.roomTypes.forEach((room, index) => {
      if (!room.type) newErrors[`roomType${index}`] = 'Room type is required';
      if (!room.price) newErrors[`roomPrice${index}`] = 'Price is required';
      if (!room.totalBeds) newErrors[`roomTotalBeds${index}`] = 'Total beds is required';
    });

    if (!formData.location.address) newErrors.address = 'Address is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.wardenContact.name) newErrors.wardenName = 'Warden name is required';
    if (!formData.wardenContact.phone) newErrors.wardenPhone = 'Warden phone is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const formDataToSend = { ...formData };
    
    // Add images
    if (hostel) {
      // For update: only send new images
      if (imageFiles.length > 0) {
        formDataToSend.newImages = imageFiles;
      }
    } else {
      // For create: send all images
      formDataToSend.images = imageFiles;
    }

    // Handle room types
    if (formDataToSend.roomTypes) {
      formDataToSend.roomTypes = formDataToSend.roomTypes.map(room => {
        const processedRoom = { ...room };
        if (hostel) {
          // For update: separate existing and new images
          const existingImages = room.images?.filter(img => typeof img === 'string') || [];
          const newImages = room.images?.filter(img => img.startsWith('data:image')) || [];
          processedRoom.images = existingImages;
          if (newImages.length > 0) {
            processedRoom.newImages = newImages;
          }
        }
        // Ensure numeric values are properly converted
        processedRoom.price = Number(processedRoom.price) || 0;
        processedRoom.totalBeds = Number(processedRoom.totalBeds) || 0;
        processedRoom.availableBeds = Number(processedRoom.availableBeds || processedRoom.totalBeds) || 0;
        // Ensure room type is lowercase
        processedRoom.type = processedRoom.type.toLowerCase();
        return processedRoom;
      });
    }

    // Convert numeric values
    formDataToSend.totalRooms = Number(formDataToSend.totalRooms);
    formDataToSend.availableRooms = Number(formDataToSend.availableRooms);
    if (formDataToSend.location.distanceFromCollege) {
      formDataToSend.location.distanceFromCollege = Number(formDataToSend.location.distanceFromCollege);
    }

    onSubmit(formDataToSend);
  };

  return (
    <div className="hostel-form-container">
      <form onSubmit={handleSubmit} className="hostel-form">
        <h2>{hostel ? 'Edit Hostel' : 'Add New Hostel'}</h2>

        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-group">
            <label>Hostel Name*</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter hostel name"
            />
            {errors.name && <span className="error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label>Type*</label>
            <select name="type" value={formData.type} onChange={handleChange}>
              <option value="boys">Boys Hostel</option>
              <option value="girls">Girls Hostel</option>
              <option value="co-ed">Co-ed Hostel</option>
            </select>
            {errors.type && <span className="error">{errors.type}</span>}
          </div>

          <div className="form-group">
            <label>Total Rooms*</label>
            <input
              type="number"
              name="totalRooms"
              value={formData.totalRooms}
              onChange={handleChange}
              placeholder="Enter total number of rooms"
            />
            {errors.totalRooms && <span className="error">{errors.totalRooms}</span>}
          </div>

          <div className="form-group">
            <label>Available Rooms*</label>
            <input
              type="number"
              name="availableRooms"
              value={formData.availableRooms}
              onChange={handleChange}
              placeholder="Enter number of available rooms"
              max={formData.totalRooms}
            />
            {errors.availableRooms && <span className="error">{errors.availableRooms}</span>}
          </div>
        </div>

        <div className="form-section">
          <h3>Room Types</h3>
          {formData.roomTypes.map((room, index) => (
            <div key={index} className="room-type-item">
              <div className="form-group">
                <label>Room Type*</label>
                <select
                  value={room.type}
                  onChange={(e) => handleRoomTypeChange(index, 'type', e.target.value)}
                >
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="triple">Triple</option>
                  <option value="dormitory">Dormitory</option>
                </select>
                {errors[`roomType${index}`] && <span className="error">{errors[`roomType${index}`]}</span>}
              </div>

              <div className="form-group">
                <label>Price per Month*</label>
                <input
                  type="number"
                  value={room.price}
                  onChange={(e) => handleRoomTypeChange(index, 'price', e.target.value)}
                  placeholder="Enter price"
                />
                {errors[`roomPrice${index}`] && <span className="error">{errors[`roomPrice${index}`]}</span>}
              </div>

              <div className="form-group">
                <label>Total Beds*</label>
                <input
                  type="number"
                  value={room.totalBeds}
                  onChange={(e) => handleRoomTypeChange(index, 'totalBeds', e.target.value)}
                  placeholder="Enter total beds"
                />
                {errors[`roomTotalBeds${index}`] && <span className="error">{errors[`roomTotalBeds${index}`]}</span>}
              </div>

              {/* Room Type Images */}
              <div className="form-group">
                <label>Room Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleRoomTypeImageUpload(index, e)}
                  className="file-input"
                />
                <div className="image-preview">
                  {room.images && room.images.map((image, imgIndex) => (
                    <div key={imgIndex} className="image-item">
                      <img 
                        src={typeof image === 'string' ? image : image} 
                        alt={`Room ${index + 1} Preview ${imgIndex + 1}`} 
                      />
                      <button
                        type="button"
                        className="remove-image"
                        onClick={() => {
                          const updatedImages = room.images.filter((_, i) => i !== imgIndex);
                          handleRoomTypeChange(index, 'images', updatedImages);
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="remove-btn"
                onClick={() => removeRoomType(index)}
              >
                <FaTrash /> Remove Room Type
              </button>
            </div>
          ))}
          <button
            type="button"
            className="add-btn"
            onClick={addRoomType}
          >
            <FaPlus /> Add Room Type
          </button>
        </div>

        <div className="form-section">
          <h3>Facilities</h3>
          {formData.facilities.map((facility, index) => (
            <div key={index} className="facility-form">
              <div className="form-group">
                <label>Facility Name</label>
                <input
                  type="text"
                  value={facility.name}
                  onChange={(e) => handleFacilityChange(index, 'name', e.target.value)}
                  placeholder="e.g., WiFi, Gym, Laundry"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={facility.description}
                  onChange={(e) => handleFacilityChange(index, 'description', e.target.value)}
                  placeholder="Describe the facility"
                />
              </div>

              <button
                type="button"
                className="remove-btn"
                onClick={() => removeFacility(index)}
                disabled={formData.facilities.length === 1}
              >
                <FaTrash /> Remove
              </button>
            </div>
          ))}
          <button type="button" className="add-btn" onClick={addFacility}>
            <FaPlus /> Add Facility
          </button>
        </div>

        <div className="form-section">
          <h3>Rules</h3>
          {formData.rules.map((rule, index) => (
            <div key={index} className="rule-form">
              <div className="form-group">
                <input
                  type="text"
                  value={rule}
                  onChange={(e) => handleRuleChange(index, e.target.value)}
                  placeholder="Enter hostel rule"
                />
              </div>

              <button
                type="button"
                className="remove-btn"
                onClick={() => removeRule(index)}
                disabled={formData.rules.length === 1}
              >
                <FaTrash /> Remove
              </button>
            </div>
          ))}
          <button type="button" className="add-btn" onClick={addRule}>
            <FaPlus /> Add Rule
          </button>
        </div>

        <div className="form-section">
          <h3>Location</h3>
          <div className="form-group">
            <label>Address*</label>
            <textarea
              name="address"
              value={formData.location.address}
              onChange={handleLocationChange}
              placeholder="Enter complete address"
            />
            {errors.address && <span className="error">{errors.address}</span>}
          </div>

          <div className="form-group">
            <label>Distance from College (km)</label>
            <input
              type="number"
              name="distanceFromCollege"
              value={formData.location.distanceFromCollege}
              onChange={handleLocationChange}
              placeholder="Enter distance in kilometers"
              step="0.1"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Warden Contact</h3>
          <div className="form-group">
            <label>Name*</label>
            <input
              type="text"
              name="name"
              value={formData.wardenContact.name}
              onChange={handleWardenContactChange}
              placeholder="Enter warden's name"
            />
            {errors.wardenName && <span className="error">{errors.wardenName}</span>}
          </div>

          <div className="form-group">
            <label>Phone*</label>
            <input
              type="tel"
              name="phone"
              value={formData.wardenContact.phone}
              onChange={handleWardenContactChange}
              placeholder="Enter warden's phone number"
            />
            {errors.wardenPhone && <span className="error">{errors.wardenPhone}</span>}
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.wardenContact.email}
              onChange={handleWardenContactChange}
              placeholder="Enter warden's email"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Description</h3>
          <div className="form-group">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter detailed description of the hostel"
              rows="4"
            />
            {errors.description && <span className="error">{errors.description}</span>}
          </div>
        </div>

        <div className="form-section">
          <h3>Images</h3>
          <div className="form-group">
            <label className="upload-label">
              <FaUpload /> Upload Images
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div className="image-preview">
            {imageFiles.map((file, index) => (
              <div key={index} className="image-item">
                <img src={file} alt={`Preview ${index + 1}`} />
                <button
                  type="button"
                  className="remove-image"
                  onClick={() => removeImage(index)}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="submit-btn">
            {hostel ? 'Update Hostel' : 'Add Hostel'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HostelForm; 