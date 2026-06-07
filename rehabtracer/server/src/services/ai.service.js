import axios from "axios";

// ================= GENERATE AI REHAB SUGGESTIONS =================
export const generateRehabSuggestions = async (
  patientData
) => {
  try {
    const prompt = `
      Generate a personalized rehabilitation recovery plan.

      Patient Details:
      - Name: ${patientData.name}
      - Age: ${patientData.age}
      - Injury Type: ${patientData.injuryType}
      - Medical Condition: ${patientData.condition}
      - Recovery Goal: ${patientData.recoveryGoal}
      - Pain Level: ${patientData.painLevel}

      Provide:
      1. Recommended exercises
      2. Recovery timeline
      3. Daily routine
      4. Safety precautions
      5. Progress tracking suggestions
    `;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",

        messages: [
          {
            role: "system",
            content:
              "You are an AI rehabilitation assistant specialized in physiotherapy and patient recovery.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],

        temperature: 0.7,

        max_tokens: 1000,
      },

      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,

          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(
      "AI Suggestion Error:",
      error.response?.data || error.message
    );

    throw new Error(
      "Failed to generate AI rehab suggestions"
    );
  }
};

// ================= ANALYZE PATIENT PROGRESS =================
export const analyzePatientProgress = async (
  progressData
) => {
  try {
    const prompt = `
      Analyze this patient rehabilitation progress data.

      Progress Data:
      ${JSON.stringify(progressData)}

      Provide:
      1. Progress analysis
      2. Improvement percentage
      3. Recovery prediction
      4. Suggested adjustments
      5. Risk factors
    `;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",

        messages: [
          {
            role: "system",
            content:
              "You are an expert rehabilitation progress analyst.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],

        temperature: 0.5,

        max_tokens: 800,
      },

      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,

          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(
      "AI Progress Analysis Error:",
      error.response?.data || error.message
    );

    throw new Error(
      "Failed to analyze patient progress"
    );
  }
};

// ================= GENERATE EXERCISE RECOMMENDATIONS =================
export const generateExerciseRecommendations =
  async (condition) => {
    try {
      const prompt = `
      Suggest rehabilitation exercises for:
      ${condition}

      Include:
      - Exercise name
      - Difficulty level
      - Duration
      - Instructions
      - Safety tips
    `;

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",

          messages: [
            {
              role: "system",
              content:
                "You are an expert physiotherapy AI assistant.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],

          temperature: 0.6,

          max_tokens: 700,
        },

        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,

            "Content-Type": "application/json",
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error(
        "AI Exercise Recommendation Error:",
        error.response?.data || error.message
      );

      throw new Error(
        "Failed to generate exercise recommendations"
      );
    }
  };

// ================= AI CHATBOT RESPONSE =================
export const generateChatbotResponse = async (
  message
) => {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",

        messages: [
          {
            role: "system",
            content:
              "You are RehabTracer AI Assistant helping rehabilitation patients with safe and professional advice.",
          },
          {
            role: "user",
            content: message,
          },
        ],

        temperature: 0.7,

        max_tokens: 500,
      },

      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,

          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(
      "AI Chatbot Error:",
      error.response?.data || error.message
    );

    throw new Error(
      "Failed to generate chatbot response"
    );
  }
};