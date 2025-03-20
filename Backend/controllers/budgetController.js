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

    // Get costs from AI
    const costs = await generateCostsWithAI({
      country,
      courseType,
      accommodationType,
      lifestyle
    });

    // Calculate total estimates
    const estimates = calculateEstimates(costs, courseDuration);

    // Generate AI insights
    const insights = await generateAIInsights({
      country,
      courseType,
      lifestyle,
      estimates
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

const generateCostsWithAI = async (params) => {
  const { country, courseType, accommodationType, lifestyle } = params;

  const prompt = `Generate realistic annual education costs for an international student in ${country} pursuing a ${courseType} degree with ${accommodationType} accommodation and ${lifestyle} lifestyle.
  Return ONLY a JSON object in this exact format (no additional text):
  {
    "tuition": 25000,
    "accommodation": 12000,
    "living": 15000,
    "travel": 2000,
    "miscellaneous": 3000
  }
  Notes:
  - Use appropriate currency values for ${country}
  - Tuition should reflect typical ${courseType} program costs
  - Accommodation costs should reflect ${accommodationType} prices
  - Living expenses should reflect ${lifestyle} lifestyle
  - Include realistic travel and miscellaneous costs
  - All values should be annual costs in USD`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log(response.text());    
    // Clean up the response text
    let jsonStr = response.text().trim();
    if (jsonStr.includes('```')) {
      jsonStr = jsonStr.match(/```(?:json)?([\s\S]*?)```/)[1].trim();
    }
    jsonStr = jsonStr.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
    
    // Parse and validate the costs
    const costs = JSON.parse(jsonStr);
    
    // Validate the values
    const requiredFields = ['tuition', 'accommodation', 'living', 'travel', 'miscellaneous'];
    for (const field of requiredFields) {
      if (!costs[field] || typeof costs[field] !== 'number' || costs[field] <= 0) {
        throw new Error(`Invalid ${field} value received from AI`);
      }
    }

    return costs;
  } catch (error) {
    console.error('Error generating costs with AI:', error);
    throw new Error('Failed to generate cost estimates');
  }
};

const calculateEstimates = (costs, courseDuration) => {
  const { tuition, accommodation, living, travel, miscellaneous } = costs;
  
  // Calculate total annual costs
  const total = tuition + accommodation + living + travel + miscellaneous;
  
  // Return estimates object
  return {
    tuition: tuition * courseDuration,
    accommodation: accommodation * courseDuration,
    livingExpenses: living * courseDuration,
    travel: travel * courseDuration,
    miscellaneous: miscellaneous * courseDuration,
    total: total * courseDuration
  };
};

const generateAIInsights = async (params) => {
  const { country, courseType, lifestyle, estimates } = params;
  
  const prompt = `Generate 4 practical financial insights for an international student pursuing ${courseType} in ${country} with a ${lifestyle} lifestyle.
  Annual costs: Tuition $${Math.round(estimates.tuition/estimates.courseDuration)}, Living $${Math.round(estimates.livingExpenses/estimates.courseDuration)}.
  
  Return exactly 4 lines, one insight per line, focusing on:
  1. Cost-saving opportunities specific to ${country}
  2. Part-time work and income possibilities
  3. Scholarship or funding options
  4. Comparison with other popular study destinations
  
  Return ONLY the 4 insights, no additional text.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Split response into lines and clean up
    const insights = response.text()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, 4);

    if (insights.length !== 4) {
      throw new Error('Invalid number of insights generated');
    }

    return insights;
  } catch (error) {
    console.error('Error generating insights:', error);
    throw new Error('Failed to generate insights');
  }
};

module.exports = {
  generateBudgetEstimate
}; 