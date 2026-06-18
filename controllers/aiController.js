import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const generateInsights = async (req, res) => {
  try {
    const { context, data } = req.body;

    if (!process.env.GROQ_API_KEY) {
      // Fallback dummy AI responses if no API key is provided
      console.log('No GROQ_API_KEY found, using fallback simulated insights.');
      
      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      let mockInsights = [];
      if (context === 'Dashboard') {
        mockInsights = [
          "Overall production efficiency is up 12% compared to last week.",
          "Inventory levels for Cotton yarn are critically low and require immediate restocking.",
          "Dyeing process is taking 15% longer than average, check machine M-04.",
          "Pending invoices amount to $12,400. Follow up with top 3 clients."
        ];
      } else if (context === 'Consumption Analysis') {
        mockInsights = [
          "Chemical consumption for Reactive Dyes exceeded the planned budget by 5%.",
          "Water usage optimization in Washing stage has saved 500 liters this week.",
          "Consider using alternative softener to reduce cost by 8% per batch.",
          "High wastage detected in the stenter machine stage during the last 3 shifts."
        ];
      } else if (context === 'Planned vs Actual') {
        mockInsights = [
          "Actual production is lagging behind planned targets by 8% due to power outages.",
          "Batch B-102 completed 2 hours ahead of schedule.",
          "Raw material shortages caused a 4-hour delay in the spinning process.",
          "Resource allocation is optimal, maintaining a 95% adherence to the production plan."
        ];
      } else if (context === 'Inventory Dashboard') {
        mockInsights = [
          "High stock levels of Polyester thread, consider reducing next purchase order.",
          "Warehouse A is nearing 90% capacity, redistribute to Warehouse B.",
          "Turnover rate for finishing chemicals is faster than expected.",
          "3 items are approaching their expiration dates within the next 30 days."
        ];
      } else {
        mockInsights = [
          "Performance is stable across all measured metrics.",
          "Resource utilization is currently at 85% capacity.",
          "No critical alerts detected in the current data snapshot.",
          "Consider reviewing upcoming maintenance schedules."
        ];
      }
      
      return res.status(200).json({ insights: mockInsights });
    }

    // Actual AI generation
    const prompt = `
      You are an AI assistant for a Textile ERP system. 
      Analyze the following data for the '${context}' module and provide 4 key insights.
      Keep each insight concise, actionable, and strictly one sentence. 
      Return the insights as a JSON array of strings. Do not include any other text or markdown formatting.
      
      Data Context:
      ${JSON.stringify(data).substring(0, 2000)} // Truncating to avoid huge payloads
    `;

    const response = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
    });

    const aiText = response.choices[0]?.message?.content || "";
    
    // Attempt to parse JSON response
    let insights = [];
    try {
        // Strip out any markdown formatting if present
        const jsonStr = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        insights = JSON.parse(jsonStr);
        
        if (!Array.isArray(insights)) {
            insights = [insights.toString()];
        }
    } catch (e) {
        console.error("Failed to parse AI response as JSON:", aiText);
        // Fallback: split by newlines and take first 4
        insights = aiText.split('\n').filter(line => line.trim().length > 0).slice(0, 4);
    }

    res.status(200).json({ insights });
  } catch (error) {
    console.error("Error generating AI insights:", error);
    res.status(500).json({ message: "Failed to generate AI insights", error: error.message });
  }
};
