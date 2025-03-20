import React, { useState, useEffect } from 'react';
import { FaCalculator, FaChartLine, FaGlobe, FaHome, FaPlane, FaGraduationCap, FaBriefcase, FaClock, FaMapMarkerAlt, FaDollarSign } from 'react-icons/fa';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './BudgetEstimator.css';

const BudgetEstimator = () => {
  const [formData, setFormData] = useState({
    country: '',
    courseDuration: '',
    courseType: '',
    accommodationType: '',
    lifestyle: 'moderate',
    currency: 'USD'
  });

  const [estimates, setEstimates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jobListings, setJobListings] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  const countries = [
    { value: 'USA', label: 'United States', currency: 'USD' },
    { value: 'UK', label: 'United Kingdom', currency: 'GBP' },
    { value: 'Canada', label: 'Canada', currency: 'CAD' },
    { value: 'Australia', label: 'Australia', currency: 'AUD' },
    { value: 'Germany', label: 'Germany', currency: 'EUR' },
    { value: 'France', label: 'France', currency: 'EUR' },
    { value: 'Ireland', label: 'Ireland', currency: 'EUR' },
    { value: 'Netherlands', label: 'Netherlands', currency: 'EUR' }
  ];

  const courseTypes = [
    { value: 'bachelors', label: 'Bachelor\'s Degree' },
    { value: 'masters', label: 'Master\'s Degree' },
    { value: 'phd', label: 'PhD' }
  ];

  const accommodationTypes = [
    { value: 'onCampus', label: 'On-Campus Housing' },
    { value: 'offCampus', label: 'Off-Campus Housing' },
    { value: 'homestay', label: 'Homestay' }
  ];

  useEffect(() => {
    if (formData.country) {
      fetchJobListings(formData.country);
    }
  }, [formData.country]);

  const fetchJobListings = async (country) => {
    setJobsLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/student/jobs/${country}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setJobListings(response.data.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setJobsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/student/budget-estimate`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setEstimates(response.data.data);
      } else {
        setError(response.data.message || 'Failed to generate budget estimate');
      }
    } catch (error) {
      console.error('Budget estimation error:', error);
      setError(error.response?.data?.message || 'Failed to generate budget estimate');
    } finally {
      setLoading(false);
    }
  };

  const chartData = estimates ? [
    { name: 'Tuition', value: estimates.tuition },
    { name: 'Accommodation', value: estimates.accommodation },
    { name: 'Living Expenses', value: estimates.livingExpenses },
    { name: 'Travel', value: estimates.travel },
    { name: 'Miscellaneous', value: estimates.miscellaneous }
  ] : [];

  return (
    <div className="budget-estimator-container">
      <div className="estimator-header">
        <h1>AI-Based Education Budget Estimator</h1>
        <p>Get personalized cost estimates for your international education journey</p>
      </div>

      <div className="estimator-grid">
        <div className="estimator-form glass-card">
          <h2>Enter Your Details</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select Country</label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              >
                <option value="">Select a country</option>
                {countries.map(country => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Course Type</label>
              <select
                value={formData.courseType}
                onChange={(e) => setFormData({ ...formData, courseType: e.target.value })}
                required
              >
                <option value="">Select course type</option>
                {courseTypes.map(course => (
                  <option key={course.value} value={course.value}>
                    {course.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Course Duration (years)</label>
              <input
                type="number"
                min="1"
                max="6"
                value={formData.courseDuration}
                onChange={(e) => setFormData({ ...formData, courseDuration: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Accommodation Type</label>
              <select
                value={formData.accommodationType}
                onChange={(e) => setFormData({ ...formData, accommodationType: e.target.value })}
                required
              >
                <option value="">Select accommodation type</option>
                {accommodationTypes.map(accommodation => (
                  <option key={accommodation.value} value={accommodation.value}>
                    {accommodation.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Lifestyle</label>
              <select
                value={formData.lifestyle}
                onChange={(e) => setFormData({ ...formData, lifestyle: e.target.value })}
                required
              >
                <option value="budget">Budget</option>
                <option value="moderate">Moderate</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>

            <button type="submit" className="estimate-btn" disabled={loading}>
              {loading ? 'Generating Estimate...' : 'Generate Estimate'}
            </button>
          </form>
        </div>

        <div className="estimator-results glass-card">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Generating your personalized budget estimate...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
            </div>
          ) : estimates ? (
            <>
              <h2>Your Estimated Budget</h2>
              <div className="total-budget">
                <h3>Total Estimated Cost</h3>
                <p className="amount">{formData.currency} {estimates.total.toLocaleString()}</p>
              </div>

              <div className="budget-breakdown">
                <h3>Cost Breakdown</h3>
                <div className="breakdown-list">
                  <div className="breakdown-item">
                    <FaGraduationCap />
                    <span>Tuition</span>
                    <span>{formData.currency} {estimates.tuition.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-item">
                    <FaHome />
                    <span>Accommodation</span>
                    <span>{formData.currency} {estimates.accommodation.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-item">
                    <FaChartLine />
                    <span>Living Expenses</span>
                    <span>{formData.currency} {estimates.livingExpenses.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-item">
                    <FaPlane />
                    <span>Travel</span>
                    <span>{formData.currency} {estimates.travel.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-item">
                    <FaGlobe />
                    <span>Miscellaneous</span>
                    <span>{formData.currency} {estimates.miscellaneous.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="financial-insights">
                <h3>AI-Generated Insights</h3>
                <ul>
                  {estimates.insights.map((insight, index) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <FaCalculator className="calculator-icon" />
              <p>Fill in the form to get your personalized budget estimate</p>
            </div>
          )}

          {formData.country && (
            <div className="job-listings-section">
              <h3><FaBriefcase /> Part-Time Job Opportunities</h3>
              {jobsLoading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading job opportunities...</p>
                </div>
              ) : jobListings.length > 0 ? (
                <div className="job-cards">
                  {jobListings.map((job, index) => (
                    <div key={index} className="job-card">
                      <div className="job-header">
                        <h4>{job.title}</h4>
                        <span className="job-type">{job.type}</span>
                      </div>
                      
                      <div className="job-company">
                        <FaBriefcase />
                        <span>{job.company}</span>
                      </div>
                      
                      <div className="job-location">
                        <FaMapMarkerAlt />
                        <span>{job.location}</span>
                      </div>
                      
                      <div className="job-salary">
                        <FaDollarSign />
                        <span>
                          {job.salary.amount} {job.salary.currency}/{job.salary.period}
                        </span>
                      </div>
                      
                      <div className="job-hours">
                        <FaClock />
                        <span>{job.workingHours.min}-{job.workingHours.max} hours/week</span>
                      </div>
                      
                      <div className="job-description">
                        <p>{job.description}</p>
                      </div>
                      
                      {job.requirements.length > 0 && (
                        <div className="job-requirements">
                          <h5>Requirements:</h5>
                          <ul>
                            {job.requirements.map((req, i) => (
                              <li key={i}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
{/*                       
                      <a 
                        href={job.applicationLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="apply-button"
                      >
                        Apply Now
                      </a> */}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-jobs">
                  <p>No job listings available for this country at the moment.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetEstimator; 