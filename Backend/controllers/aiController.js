const axios = require('axios');
const asyncHandler = require('../middleware/async');

// Ensure API key is set
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set in environment variables');
  throw new Error('OPENAI_API_KEY is required');
}

const API_URL = "https://api.openai.com/v1/chat/completions";
const headers = {
  "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
  "Content-Type": "application/json"
};

/**
 * Extracts and parses the JSON array from the AI response.
 */
const extractAndParseJSON = (text) => {
  try {
    // First try to extract JSON from markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    let jsonText = codeBlockMatch ? codeBlockMatch[1] : text;

    // Clean up the text
    jsonText = jsonText
      .replace(/^\s*\[/, '[') // Remove leading whitespace before [
      .replace(/\]\s*$/, ']') // Remove trailing whitespace after ]
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
 * AI-powered career path analysis.
 */
exports.analyzeCareerPaths = asyncHandler(async (req, res) => {
  try {
    console.log("Analyzing career paths...");
    const { courseName } = req.body;

    if (!courseName) {
      return res.status(400).json({
        success: false,
        message: "Course name is required"
      });
    }

    // AI Prompt
    const systemPrompt = `You are a career advisor specializing in technology and education. 
    When providing career information, always return a properly formatted JSON array containing exactly 4 career paths. 
    Include realistic salary ranges in Indian Rupees (LPA), current market data, and specific required skills.
    Return ONLY the JSON array with no additional text or explanation.`;

    const userPrompt = `Generate 1 career paths for ${courseName} graduates with this exact structure:
[
  {
    "title": "Specific Job Title",
    "description": "2-3 sentences about role and responsibilities",
    "salaryRanges": {
      "Fresher (0-2 years)": "₹X-Y LPA",
      "Intermediate (2-5 years)": "₹X-Y LPA",
      "Senior (5-8 years)": "₹X-Y LPA",
      "Expert (8+ years)": "₹X-Y LPA"
    },
    "requiredSkills": ["skill1", "skill2", "skill3"],
    "additionalInfo": "Growth prospects and industry demand"
  }
]`;

    // Make request to OpenAI API
    const response = await axios.post(
      API_URL,
      {
        model: "gpt-4o-mini",
        store: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      },
      { 
        headers,
        timeout: 60000 // 60 second timeout
      }
    );

    if (!response.data?.choices?.[0]?.message?.content) {
      console.error("Invalid API response structure:", response.data);
      throw new Error('Invalid response from AI service');
    }

    console.log("Raw AI Response:", response.data.choices[0].message.content);

    // Extract and parse AI response
    const parsedData = extractAndParseJSON(response.data.choices[0].message.content);

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
      } else if (error.response.status === 500) {
        errorMessage = "AI service is currently unavailable. Please try again later.";
        statusCode = 503;
      }
    } else if (error.message.includes("timeout")) {
      errorMessage = "AI service request timed out. Please try again.";
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
