const axios = require('axios');
const asyncHandler = require('../middleware/async');

// Ensure API key is set
if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables');
  throw new Error('GEMINI_API_KEY is required');
}

const API_KEY = process.env.GEMINI_API_KEY;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Use the stable model
const MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-Flash-lite'
];

/**
 * Sleep function for delay between retries
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Makes API request with retry logic
 */
const makeRequestWithRetry = async (model, prompt, retryCount = 0) => {
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  
  try {
    console.log(`Attempting request with model: ${model}, attempt: ${retryCount + 1}`);
    
    const response = await axios.post(
      `${API_URL}?key=${API_KEY}`,
      {
        contents: [{
          parts: [{ 
            text: prompt 
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
          stopSequences: []
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      },
      { 
        timeout: 60000, // Increased timeout
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Error with ${model}:`, error.message);
    
    // If we have retries left and it's a retryable error
    if (retryCount < MAX_RETRIES && 
        (error.response?.status === 503 || error.response?.status === 429)) {
      // Wait before retrying
      await sleep(RETRY_DELAY * (retryCount + 1));
      
      // Try the next model if available
      const nextModelIndex = MODELS.indexOf(model) + 1;
      if (nextModelIndex < MODELS.length) {
        return makeRequestWithRetry(MODELS[nextModelIndex], prompt, retryCount + 1);
      }
      
      // If no more models, retry with the same model
      return makeRequestWithRetry(model, prompt, retryCount + 1);
    }
    
    throw error;
  }
};

/**
 * Extracts and parses the JSON array from the AI response.
 */
const extractAndParseJSON = (text) => {
  try {
    // First try to extract JSON from markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    let jsonText = codeBlockMatch ? codeBlockMatch[1] : text;

    // Find the first [ and last ] to extract the JSON array
    const startIndex = jsonText.indexOf('[');
    const endIndex = jsonText.lastIndexOf(']');
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error('No JSON array found in response');
    }

    jsonText = jsonText.substring(startIndex, endIndex + 1);

    // Clean up the text
    jsonText = jsonText
      .replace(/\n/g, ' ')
      .replace(/\r/g, '')
      .replace(/\t/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    console.log('Cleaned JSON text:', jsonText);

    // Try to parse the JSON
    const parsed = JSON.parse(jsonText);

    // Validate the structure
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not a valid array');
    }

    if (parsed.length !== 4) {
      throw new Error('Expected exactly 4 career paths');
    }

    // Validate each career object
    const validatedCareers = parsed.map(career => {
      if (!career.title || typeof career.title !== 'string') {
        throw new Error('Invalid or missing title');
      }
      if (!career.description || typeof career.description !== 'string') {
        throw new Error('Invalid or missing description');
      }
      if (!career.salaryRanges || typeof career.salaryRanges !== 'object') {
        throw new Error('Invalid or missing salary ranges');
      }
      if (!Array.isArray(career.requiredSkills) || career.requiredSkills.length === 0) {
        throw new Error('Invalid or missing required skills');
      }
      if (!career.additionalInfo || typeof career.additionalInfo !== 'string') {
        throw new Error('Invalid or missing additional info');
      }

      // Validate salary ranges
      const requiredRanges = [
        'Fresher (0-2 years)',
        'Intermediate (2-5 years)',
        'Senior (5-8 years)',
        'Expert (8+ years)'
      ];

      requiredRanges.forEach(range => {
        if (!career.salaryRanges[range] || !career.salaryRanges[range].includes('₹')) {
          throw new Error(`Invalid or missing salary range for ${range}`);
        }
      });

      return career;
    });

    return { careers: validatedCareers };
  } catch (error) {
    console.error('JSON parsing error:', error.message);
    throw new Error(`Failed to parse AI response: ${error.message}`);
  }
};

/**
 * AI-powered career path analysis using Google's Gemini AI.
 */
exports.analyzeCareerPaths = asyncHandler(async (req, res) => {
  try {
    console.log("Starting career path analysis...");
    const { courseName } = req.body;

    if (!courseName) {
      return res.status(400).json({
        success: false,
        message: "Course name is required"
      });
    }

    // AI Prompt with explicit JSON formatting instructions
    const prompt = `You are a career advisor specializing in technology and education. Generate 4 detailed career paths for ${courseName} graduates.
    
Your response must be a valid JSON array containing exactly 4 career objects. Follow this structure precisely:

[
  {
    "title": "Software Developer",
    "description": "Develops and maintains software applications using modern programming languages and frameworks. Collaborates with teams to design and implement solutions.",
    "salaryRanges": {
      "Fresher (0-2 years)": "₹3-6 LPA",
      "Intermediate (2-5 years)": "₹6-12 LPA",
      "Senior (5-8 years)": "₹12-20 LPA",
      "Expert (8+ years)": "₹20-35 LPA"
    },
    "requiredSkills": ["JavaScript", "Python", "SQL", "Problem Solving", "Team Collaboration"],
    "additionalInfo": "High demand across industries with excellent growth prospects. Opportunities in product companies, startups, and enterprises."
  }
]

Ensure:
1. Each career path is relevant to ${courseName}
2. Salary ranges are realistic for the Indian market
3. Skills include both technical and soft skills
4. Description is 2-3 sentences
5. Additional info covers growth prospects and industry demand
6. Response is properly formatted JSON with no extra text

Generate 4 unique career paths following this exact format.`;

    // Try to get response with retry logic
    const responseData = await makeRequestWithRetry(MODELS[0], prompt);

    // Check if response has the expected structure
    if (!responseData?.candidates?.[0]?.content?.parts) {
      console.error("Invalid API response structure:", responseData);
      throw new Error('Invalid response structure from Gemini AI');
    }

    // Get all text parts from the response
    const allText = responseData.candidates[0].content.parts
      .map(part => part.text || '')
      .join(' ');

    console.log("Combined Response Text:", allText);

    // Extract and parse AI response
    const parsedData = extractAndParseJSON(allText);

    console.log("Final Parsed Data:", JSON.stringify(parsedData, null, 2));

    // Send the response
    res.status(200).json({
      success: true,
      data: parsedData
    });

  } catch (error) {
    console.error("AI analysis error:", error);

    let errorMessage = "Failed to analyze career paths";
    let statusCode = 500;

    if (error.response) {
      console.error("API Error Response:", error.response.data);
      
      if (error.response.status === 401) {
        errorMessage = "Invalid API key. Please check your configuration.";
        statusCode = 401;
      } else if (error.response.status === 429) {
        errorMessage = "Rate limit exceeded. Please try again later.";
        statusCode = 429;
      } else if (error.response.status === 404) {
        errorMessage = "AI model not found. Please contact support.";
        statusCode = 404;
      } else if (error.response.status === 503) {
        errorMessage = "AI service is temporarily busy. Please try again in a few moments.";
        statusCode = 503;
      }
    } else if (error.message.includes("timeout")) {
      errorMessage = "Request timed out. Please try again.";
      statusCode = 504;
    } else if (error.message.includes("Failed to parse")) {
      errorMessage = "Unable to process AI response. Please try again.";
      statusCode = 500;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage
    });
  }
});
