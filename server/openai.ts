import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type DiagnosticResponse = {
  diagnosis: string;
  confidence: number;
  suggestedTests: string[];
  treatmentOptions: string[];
  followUpQuestions: string[];
};

const DIAGNOSTIC_SYSTEM_PROMPT = `You are an advanced AI diagnostic and research assistant designed to support board-certified physicians. Your primary role is to assist in generating differential diagnoses based on:

1. The patient's prior health data
2. Relevant contextual information provided by the physician
3. Your extensive medical knowledge base

When responding:
- Provide a clear, concise primary diagnosis with supporting rationale
- Include relevant differential diagnoses
- Recommend appropriate tests and next steps
- Suggest evidence-based treatment options
- Include follow-up questions to gather more information if needed

Always prioritize clarity, accuracy, and relevance in your responses. Maintain a tone and detail level suitable for experienced medical professionals.

IMPORTANT: Format your entire response as valid JSON with this exact structure:
{
  "diagnosis": "A clear string containing both primary and differential diagnoses",
  "confidence": <number between 0 and 1>,
  "suggestedTests": ["test1", "test2", ...],
  "treatmentOptions": ["option1", "option2", ...],
  "followUpQuestions": ["question1", "question2", ...]
}

Do not use nested objects in the diagnosis field - it should be a single formatted string.`;

export async function getMedicalDiagnostic(
  patientContext: string,
  medicalHistory: any
): Promise<DiagnosticResponse> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: DIAGNOSTIC_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Patient Context: ${patientContext}\n\nMedical History: ${JSON.stringify(
            medicalHistory
          )}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    if (!response.choices[0].message.content) {
      throw new Error("No response from OpenAI");
    }

    try {
      const parsedResponse = JSON.parse(response.choices[0].message.content);

      // Ensure diagnosis is a string
      if (typeof parsedResponse.diagnosis === 'object') {
        parsedResponse.diagnosis = JSON.stringify(parsedResponse.diagnosis);
      }

      return parsedResponse as DiagnosticResponse;
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", response.choices[0].message.content);
      throw new Error("Invalid response format from OpenAI");
    }
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    throw new Error("Failed to get medical diagnostic: " + error.message);
  }
}

export async function analyzeMedicalImage(base64Image: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this medical image and provide detailed observations about any abnormalities, patterns, or concerns that should be noted.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    max_tokens: 500,
  });

  if (!response.choices[0].message.content) {
    throw new Error("No response from OpenAI");
  }

  return response.choices[0].message.content;
}