import React, { useState, useEffect } from 'react';
import { FaStar, FaThumbsUp, FaFlag, FaImage, FaVideo, FaEdit, FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import axios from 'axios';
import './ReviewSection.css';

const ReviewSection = ({ type, id, canReview = false }) => {
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null);
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    review: '',
    pros: [''],
    cons: [''],
    media: []
  });
  const [previewMedia, setPreviewMedia] = useState([]);

  useEffect(() => {
    if (type && id) {
      console.log(`ReviewSection mounted - type: ${type}, id: ${id}, canReview: ${canReview}`);
      fetchReviews();
    }
  }, [type, id]);

  const fetchReviews = async () => {
    try {
      console.log(`Fetching ${type} reviews for ID:`, id);
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/reviews`, {
        params: {
          type,
          id,
          status: 'approved'
        }
      });

      console.log('Reviews response:', response.data);
      
      if (response.data.success) {
        const reviews = response.data.data;
        // Check ownership for each review
        const reviewsWithOwnership = await Promise.all(
          reviews.map(async (review) => {
            try {
              console.log('Checking ownership for review:', review._id);
              const ownershipResponse = await axios.get(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/reviews/${review._id}/ownership`,
                {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                }
              );
              console.log('Ownership response for review', review._id, ':', ownershipResponse.data);
              return {
                ...review,
                isOwner: ownershipResponse.data.success && ownershipResponse.data.isOwner
              };
            } catch (error) {
              console.error('Error checking review ownership:', error.response?.data || error.message);
              // If there's an error checking ownership, we'll assume the user is not the owner
              return {
                ...review,
                isOwner: false
              };
            }
          })
        );
        console.log('Reviews with ownership:', reviewsWithOwnership);
        setReviews(reviewsWithOwnership);
      } else {
        console.error('Failed to fetch reviews:', response.data.message);
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error.response?.data || error.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load reviews. Please try again later.'
      });
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review);
    setFormData({
      rating: review.rating,
      title: review.title,
      review: review.review,
      pros: review.pros.length > 0 ? review.pros : [''],
      cons: review.cons.length > 0 ? review.cons : [''],
      media: []
    });
    setPreviewMedia(review.media.map(m => ({
      type: m.type,
      url: m.url
    })));
    setShowReviewForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('type', type);
      formDataToSend.append('id', id);
      formDataToSend.append('rating', formData.rating);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('review', formData.review);
      formData.pros.forEach((pro) => {
        if (pro.trim()) formDataToSend.append('pros[]', pro);
      });
      formData.cons.forEach((con) => {
        if (con.trim()) formDataToSend.append('cons[]', con);
      });
      formData.media.forEach((file) => {
        formDataToSend.append('media', file);
      });

      let response;
      if (editingReview) {
        // Update existing review
        response = await axios.put(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/reviews/${editingReview._id}`,
          formDataToSend,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      } else {
        // Create new review
        response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/reviews`,
          formDataToSend,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: editingReview ? 'Review updated successfully' : 'Review submitted successfully'
        });

        setShowReviewForm(false);
        setEditingReview(null);
        setFormData({
          rating: 0,
          title: '',
          review: '',
          pros: [''],
          cons: [''],
          media: []
        });
        setPreviewMedia([]);
        fetchReviews();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      
      let errorMessage = 'Failed to submit review';
      
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonColor: '#3498db'
      });
    }
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      media: [...prev.media, ...files]
    }));

    // Create preview URLs
    const newPreviews = files.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'video'
    }));
    setPreviewMedia(prev => [...prev, ...newPreviews]);
  };

  const handleMarkHelpful = async (reviewId) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/reviews/${reviewId}/helpful`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      fetchReviews();
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to mark review as helpful'
      });
    }
  };

  const handleReport = async (reviewId) => {
    try {
      const { value: reason } = await Swal.fire({
        title: 'Report Review',
        input: 'textarea',
        inputLabel: 'Why are you reporting this review?',
        inputPlaceholder: 'Enter your reason...',
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) {
            return 'Please provide a reason';
          }
        }
      });

      if (reason) {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/reviews/${reviewId}/report`,
          { reason },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        Swal.fire('Reported', 'Review has been reported for moderation', 'success');
      }
    } catch (error) {
      console.error('Error reporting review:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to report review'
      });
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FaStar
        key={index}
        className={index < rating ? 'star filled' : 'star'}
      />
    ));
  };

  const renderMediaPreviews = () => {
    return previewMedia.map((media, index) => (
      <div key={index} className="media-preview">
        {media.type === 'image' ? (
          <img src={media.url} alt={`Preview ${index + 1}`} />
        ) : (
          <video src={media.url} controls />
        )}
        <button
          type="button"
          className="remove-media"
          onClick={() => {
            setPreviewMedia(prev => prev.filter((_, i) => i !== index));
            setFormData(prev => ({
              ...prev,
              media: prev.media.filter((_, i) => i !== index)
            }));
          }}
        >
          ×
        </button>
      </div>
    ));
  };

  if (loading) {
    return <div className="loading">Loading reviews...</div>;
  }

  return (
    <div className="review-section">
      <div className="review-header">
        <h2>Reviews</h2>
        {canReview && !showReviewForm && (
          <button
            className="write-review-btn"
            onClick={() => {
              console.log('Opening review form - canReview:', canReview);
              setShowReviewForm(true);
              setEditingReview(null);
              setFormData({
                rating: 0,
                title: '',
                review: '',
                pros: [''],
                cons: [''],
                media: []
              });
              setPreviewMedia([]);
            }}
          >
            Write a Review
          </button>
        )}
      </div>

      {showReviewForm && (
        <form onSubmit={handleSubmit} className="review-form">
          <h3>{editingReview ? 'Edit Review' : 'Write a Review'}</h3>
          <div className="rating-input">
            <label>Rating:</label>
            {[...Array(5)].map((_, index) => (
              <FaStar
                key={index}
                className={index < formData.rating ? 'star filled' : 'star'}
                onClick={() => setFormData({ ...formData, rating: index + 1 })}
              />
            ))}
          </div>

          <div className="form-group">
            <input
              type="text"
              placeholder="Review Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <textarea
              placeholder="Write your review..."
              value={formData.review}
              onChange={(e) => setFormData({ ...formData, review: e.target.value })}
              required
            />
          </div>

          <div className="pros-cons">
            <div className="pros">
              <h4>Pros</h4>
              {formData.pros.map((pro, index) => (
                <div key={index} className="list-item">
                  <input
                    type="text"
                    value={pro}
                    onChange={(e) => {
                      const newPros = [...formData.pros];
                      newPros[index] = e.target.value;
                      if (index === formData.pros.length - 1 && e.target.value) {
                        newPros.push('');
                      }
                      setFormData({ ...formData, pros: newPros });
                    }}
                    placeholder="Add a pro"
                  />
                  {index !== formData.pros.length - 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newPros = formData.pros.filter((_, i) => i !== index);
                        setFormData({ ...formData, pros: newPros });
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="cons">
              <h4>Cons</h4>
              {formData.cons.map((con, index) => (
                <div key={index} className="list-item">
                  <input
                    type="text"
                    value={con}
                    onChange={(e) => {
                      const newCons = [...formData.cons];
                      newCons[index] = e.target.value;
                      if (index === formData.cons.length - 1 && e.target.value) {
                        newCons.push('');
                      }
                      setFormData({ ...formData, cons: newCons });
                    }}
                    placeholder="Add a con"
                  />
                  {index !== formData.cons.length - 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newCons = formData.cons.filter((_, i) => i !== index);
                        setFormData({ ...formData, cons: newCons });
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="media-upload">
            <label className="upload-btn">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleMediaChange}
                style={{ display: 'none' }}
              />
              <FaImage /> Add Photos/Videos
            </label>
            <div className="media-previews">
              {renderMediaPreviews()}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn">
              {editingReview ? 'Update Review' : 'Submit Review'}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => {
                setShowReviewForm(false);
                setEditingReview(null);
                setFormData({
                  rating: 0,
                  title: '',
                  review: '',
                  pros: [''],
                  cons: [''],
                  media: []
                });
                setPreviewMedia([]);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="reviews-list">
        {reviews.length === 0 ? (
          <p className="no-reviews">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="review-card">
              <div className="review-header">
                <div className="reviewer-info">
                  <img
                    src={review.student.profilePic || '/default-avatar.png'}
                    alt={review.student.name}
                    className="reviewer-avatar"
                  />
                  <div>
                    <h4>{review.student.name}</h4>
                    <div className="rating">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                </div>
                <div className="review-actions">
                  {review.isOwner && (
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(review)}
                    >
                      <FaEdit /> Edit
                    </button>
                  )}
                  <div className="review-date">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <h3 className="review-title">{review.title}</h3>
              <p className="review-content">{review.review}</p>

              {(review.pros.length > 0 || review.cons.length > 0) && (
                <div className="pros-cons-display">
                  {review.pros.length > 0 && (
                    <div className="pros">
                      <h5>Pros</h5>
                      <ul>
                        {review.pros.map((pro, index) => (
                          <li key={index}>{pro}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {review.cons.length > 0 && (
                    <div className="cons">
                      <h5>Cons</h5>
                      <ul>
                        {review.cons.map((con, index) => (
                          <li key={index}>{con}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {review.media && review.media.length > 0 && (
                <div className="review-media">
                  {review.media.map((media, index) => (
                    <div key={index} className="media-item">
                      {media.type === 'image' ? (
                        <img src={media.url} alt={`Review ${index + 1}`} />
                      ) : (
                        <video src={media.url} controls />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="review-actions">
                <button
                  className={`helpful-btn ${review.helpful.users.includes(localStorage.getItem('userId')) ? 'marked' : ''}`}
                  onClick={() => handleMarkHelpful(review._id)}
                >
                  <FaThumbsUp /> Helpful ({review.helpful.count})
                </button>
                <button
                  className="report-btn"
                  onClick={() => handleReport(review._id)}
                >
                  <FaFlag /> Report
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewSection; 