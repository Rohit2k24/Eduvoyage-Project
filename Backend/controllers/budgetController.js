const { GoogleGenerativeAI } = require('@google/generative-ai');
const BudgetEstimate = require('../models/BudgetEstimate');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateBudgetEstimate = async (req, res) => {
  try {
    const {
      country,
      courseDuration,
      courseType,
      accommodationType,
      lifestyle,
      currency
    } = req.body;

    // Get base costs from AI
    const baseCosts = await getBaseCosts(country, courseType);

    // Calculate initial estimates
    const estimates = calculateInitialEstimates(baseCosts, {
      courseDuration,
      accommodationType,
      lifestyle
    });

    // Generate AI insights using Gemini
    const insights = await generateAIInsights(estimates, {
      country,
      courseType,
      lifestyle
    });

    // Create budget estimate record
    const budgetEstimate = await BudgetEstimate.create({
      userId: req.user._id,
      country,
      courseDuration,
      courseType,
      accommodationType,
      lifestyle,
      currency,
      estimates,
      insights
    });

    res.status(200).json({
      success: true,
      data: {
        ...estimates,
        insights
      }
    });
  } catch (error) {
    console.error('Budget estimation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate budget estimate'
    });
  }
};

const getBaseCosts = async (country, courseType) => {
  try {
    const prompt = `Generate realistic base costs for studying ${courseType} in ${country}. 
    Return ONLY a JSON object in this exact format, with numeric values (no text, no currency symbols):
    {
      "tuition": 25000,
      "accommodation": 12000,
      "living": 15000
    }
    Use realistic values in USD, but only return the JSON.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log(response.text());
    // Clean up the response text
    let jsonStr = response.text().trim();
    
    // Remove any markdown formatting or extra text
    if (jsonStr.includes('```')) {
      jsonStr = jsonStr.match(/```(?:json)?([\s\S]*?)```/)[1].trim();
    }
    
    // Remove any non-JSON text before or after
    jsonStr = jsonStr.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
    
    // Parse the JSON response
    let baseCosts;
    try {
      baseCosts = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Invalid JSON format received from AI');
    }

    // Convert values to numbers and validate
    const validatedCosts = {
      tuition: parseFloat(String(baseCosts.tuition).replace(/[^0-9.]/g, '')),
      accommodation: parseFloat(String(baseCosts.accommodation).replace(/[^0-9.]/g, '')),
      living: parseFloat(String(baseCosts.living).replace(/[^0-9.]/g, ''))
    };

    // Validate the values
    for (const [key, value] of Object.entries(validatedCosts)) {
      if (isNaN(value) || value <= 0) {
        console.error(`Invalid ${key} value:`, value);
        throw new Error(`Invalid ${key} value received from AI`);
      }
    }

    console.log('Validated costs:', validatedCosts);
    return validatedCosts;

  } catch (error) {
    console.error('Error getting base costs from AI:', error);
    console.log('Using fallback values');
    
    // Fallback costs based on course type
    const fallbackCosts = {
      bachelors: {
        tuition: 25000,
        accommodation: 12000,
        living: 15000
      },
      masters: {
        tuition: 30000,
        accommodation: 12000,
        living: 15000
      },
      phd: {
        tuition: 35000,
        accommodation: 12000,
        living: 15000
      }
    };
    
    return fallbackCosts[courseType] || fallbackCosts.bachelors;
  }
};

const calculateInitialEstimates = (baseCosts, options) => {
  const { courseDuration, accommodationType, lifestyle } = options;
  
  // Calculate tuition based on duration
  const tuition = baseCosts.tuition * courseDuration;
  
  // Adjust accommodation based on type
  let accommodation = baseCosts.accommodation;
  switch (accommodationType) {
    case 'onCampus':
      accommodation *= 1.2;
      break;
    case 'offCampus':
      accommodation *= 0.8;
      break;
    case 'homestay':
      accommodation *= 0.6;
      break;
  }

  // Adjust living expenses based on lifestyle
  let livingExpenses = baseCosts.living;
  switch (lifestyle) {
    case 'budget':
      livingExpenses *= 0.8;
      break;
    case 'luxury':
      livingExpenses *= 1.5;
      break;
  }

  // Calculate other expenses
  const travel = 2000; // Base travel cost
  const miscellaneous = livingExpenses * 0.2; // 20% of living expenses

  return {
    tuition,
    accommodation,
    livingExpenses,
    travel,
    miscellaneous,
    total: tuition + accommodation + livingExpenses + travel + miscellaneous
  };
};

const generateAIInsights = async (estimates, options) => {
  const { country, courseType, lifestyle } = options;
  
  const prompt = `Generate 4 financial insights for studying ${courseType} in ${country} with a ${lifestyle} lifestyle.
  Annual costs: Tuition $${Math.round(estimates.tuition)}, Accommodation $${Math.round(estimates.accommodation)}, Living $${Math.round(estimates.livingExpenses)}.
  
  Return exactly 4 lines, one insight per line, about:
  1. Cost-saving opportunities
  2. Financial planning recommendations
  3. Scholarship options
  4. Cost comparison with other countries
  
  Return ONLY the 4 insights, no additional text or formatting.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log(response.text());
    // Split response into lines and clean up
    const insights = response.text()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, 4); // Ensure we only get 4 insights

    // If we don't get exactly 4 insights, use fallback
    if (insights.length !== 4) {
      return [
        `Consider applying for ${courseType} scholarships in ${country} to reduce tuition costs`,
        `Research part-time work opportunities that align with ${courseType} studies`,
        `Look into shared accommodation options to reduce living expenses`,
        `Compare program costs with similar ${courseType} programs in neighboring countries`
      ];
    }

    return insights;
  } catch (error) {
    console.error('AI insights generation error:', error);
    return [
      `Consider applying for ${courseType} scholarships in ${country} to reduce tuition costs`,
      `Research part-time work opportunities that align with ${courseType} studies`,
      `Look into shared accommodation options to reduce living expenses`,
      `Compare program costs with similar ${courseType} programs in neighboring countries`
    ];
  }
};

module.exports = {
  generateBudgetEstimate
}; 