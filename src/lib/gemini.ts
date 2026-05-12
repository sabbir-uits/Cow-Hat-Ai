import { GoogleGenAI } from "@google/genai";

// AI Studio automatically provides this via environment injection.
const apiKey = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export async function estimateCattle(imageBase64: string, mimeType: string) {
  const prompt = `You are an expert of the Bangladesh Cattle Market (Gorur Haat). 
  Analyze the provided image of a cow or goat.
  
  ESTIMATION REQUIREMENTS:
  1. Estimate the live weight in Kilograms (kg) and Mounds (1 mound = 40kg).
  2. Estimate the current market price in Bangladeshi Taka (BDT) based on 2024-2025 market trends in Bangladesh.
  3. Identify the breed (e.g., Local/Deshi, Sahiwal, Holstein-Friesian, etc.).
  4. Evaluate health and size.
  
  OUTPUT FORMAT:
  Return the response in structured Bengali using markdown. 
  Include specific sections like:
  ### প্রজাতির বিবরণ (Breed Details)
  ### ওজন অনুমান (Weight Estimate)
  ### বাজার মূল্য অনুমান (Market Price Estimate)
  ### অতিরিক্ত পর্যবেক্ষণ (Additional Observations)
  
  DISCLAIMER:
  Add a clear disclaimer at the end in Bengali: "এটি একটি এআই ভিত্তিক অনুমান। সঠিক তথ্যের জন্য পশুর সরাসরি ওজন পরীক্ষা করা এবং বাজার ঘুরে দেখা বাঞ্ছনীয়।"
  
  CRITICAL: If the image does not contain a cow or a goat, kindly inform the user in Bengali that the app only works for cows and goats.`;

  try {
    // Check if the key is effectively set in the environment
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      throw new Error("API Key সেট করা হয়নি। দয়া করে AI Studio-র 'Secrets' প্যানেলে গিয়ে 'GEMINI_API_KEY' সফলভাবে যোগ করুন।");
    }

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: prompt }
        ]
      }]
    });

    const result = await response.response;
    const text = result.text();

    if (!text) {
      throw new Error("এআই কোনো ফলাফল দিতে পারেনি। ছবিটির মান পরীক্ষা করে আবার চেষ্টা করুন।");
    }

    return text;
  } catch (error: any) {
    console.error("Gemini Error Details:", error);
    
    let errorMessage = "দুঃখিত, এআই প্রসেস করতে সমস্যা হয়েছে।";
    
    const errString = error?.message || "";
    if (errString.includes("API key not valid") || errString.includes("API_KEY_INVALID")) {
      errorMessage = "আপনার এপিআই কি (API Key) সঠিক নয়। দয়া করে সঠিক কি প্রদান করুন।";
    } else if (errString.includes("Quota exceeded")) {
      errorMessage = "দুঃখিত, ব্যবহারের কোটা শেষ হয়ে গেছে। কিছুক্ষণ পর আবার চেষ্টা করুন।";
    } else if (errString.includes("API Key সেট করা হয়নি")) {
      errorMessage = errString;
    }
    
    throw new Error(errorMessage);
  }
}
