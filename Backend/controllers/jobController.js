const JobListing = require('../models/JobListing');
const asyncHandler = require('../middleware/async');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Get job listings by country
// @route   GET /api/student/jobs/:country
// @access  Private (Student)
exports.getJobsByCountry = asyncHandler(async (req, res) => {
  const { country } = req.params;

  const jobs = await JobListing.find({ 
    country,
    studentFriendly: true 
  }).sort({ postedDate: -1 });

  // If no jobs found, generate jobs using AI
  if (jobs.length === 0) {
    const aiGeneratedJobs = await generateJobsWithAI(country);
    return res.status(200).json({
      success: true,
      data: aiGeneratedJobs
    });
  }

  res.status(200).json({
    success: true,
    data: jobs
  });
});

// Helper function to generate jobs using AI
const generateJobsWithAI = async (country) => {
  try {
    const prompt = `Generate 5 realistic part-time job opportunities for international students in ${country}.
    Return ONLY a JSON array with this exact format (no additional text):
    [
      {
        "title": "Library Assistant",
        "company": "University Library",
        "location": "On Campus",
        "type": "Part-Time",
        "salary": {
          "amount": 15,
          "currency": "USD",
          "period": "Hour"
        },
        "description": "Brief job description",
        "requirements": ["req1", "req2"],
        "benefits": ["benefit1", "benefit2"],
        "workingHours": {
          "min": 10,
          "max": 20
        }
      }
    ]
    Use appropriate currency for ${country} (USD for USA, GBP for UK, EUR for EU countries, etc).
    Make sure jobs are realistic and comply with student visa work restrictions.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Clean up the response text
    let jsonStr = response.text().trim();
    if (jsonStr.includes('```')) {
      jsonStr = jsonStr.match(/```(?:json)?([\s\S]*?)```/)[1].trim();
    }
    jsonStr = jsonStr.replace(/^[^[]*/, '').replace(/[^\]]*$/, '');

    // Parse and validate the JSON
    let jobs = JSON.parse(jsonStr);

    // Validate and clean up each job
    jobs = jobs.map(job => ({
      ...job,
      applicationLink: '#',
      postedDate: new Date(),
      studentFriendly: true
    }));

    // Add some common jobs as fallback
    const commonJobs = getCommonJobs(country);
    return [...jobs, ...commonJobs];

  } catch (error) {
    console.error('Error generating jobs with AI:', error);
    // Return fallback jobs if AI generation fails
    return getCommonJobs(country);
  }
};

// Fallback function for common jobs
const getCommonJobs = (country) => {
  const currency = {
    USA: 'USD',
    UK: 'GBP',
    Canada: 'CAD',
    Australia: 'AUD',
    Germany: 'EUR',
    France: 'EUR',
    Ireland: 'EUR',
    Netherlands: 'EUR'
  }[country] || 'USD';

  const baseRate = {
    USD: 15,
    GBP: 11,
    CAD: 18,
    AUD: 22,
    EUR: 13
  }[currency] || 15;

  return [
    {
      title: 'Campus Library Assistant',
      company: 'University Library',
      location: 'On Campus',
      type: 'Part-Time',
      salary: { amount: baseRate, currency, period: 'Hour' },
      description: 'Help manage library resources and assist students with research needs.',
      requirements: ['Current student status', 'Good organizational skills'],
      benefits: ['Flexible schedule', 'Quiet work environment'],
      workingHours: { min: 10, max: 20 },
      applicationLink: '#',
      postedDate: new Date(),
      studentFriendly: true
    },
    {
      title: 'Student Ambassador',
      company: 'International Student Office',
      location: 'On Campus',
      type: 'Flexible',
      salary: { amount: baseRate + 2, currency, period: 'Hour' },
      description: 'Assist new international students and represent the university at events.',
      requirements: ['Excellent communication skills', 'International student status'],
      benefits: ['Leadership experience', 'Networking opportunities'],
      workingHours: { min: 8, max: 15 },
      applicationLink: '#',
      postedDate: new Date(),
      studentFriendly: true
    }
  ];
}; 