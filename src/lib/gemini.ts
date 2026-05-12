import { GoogleGenAI } from "@google/genai";

// AI Studio provides GEMINI_API_KEY automatically in the environment.
// We prioritize the environment variable if it's set and not the default placeholder.
const envApiKey = process.env.GEMINI_API_KEY;
const userApiKey = "AIzaSyCe_rgHVWyzKEqvuPx1aqW_UoQ2fDxvZgY";

const apiKey = (envApiKey && envApiKey !== "MY_GEMINI_API_KEY" && envApiKey !== "") 
  ? envApiKey 
  : userApiKey;

const ai = new GoogleGenAI({ apiKey });

export async function estimateCattle(imageBase64: string, mimeType: string) {
  const prompt = `You are an expert of the Bangladesh Cattle Market (Gorur Haat). 
  Analyze the provided image of a cow or goat.
  
  ESTIMATION REQUIREMENTS:
  1. Estimate the live weight in Kilograms (kg) and Mounds (1 mound = 40kg).
  2. Estimate the current market price in Bangladeshi Taka (BDT) based on recent market trends in Bangladesh.
  3. Identify the breed (e.g., Local/Deshi, Sahiwal, Holstein-Friesian, Black Bengal, etc.).
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
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType
            }
          },
          { text: prompt }
        ]
      }
    });

    const text = response.text;

    if (!text) {
      throw new Error("এআই কোনো ফলাফল দিতে পারেনি। ছবিটির মান পরীক্ষা করুন।");
    }

    return text;
  } catch (error: any) {
    console.error("Gemini Error Details:", error);
    
    let errorMessage = "দুঃখিত, এআই প্রসেস করতে সমস্যা হয়েছে।";
    const errString = typeof error === 'string' ? error : error?.message || JSON.stringify(error);
    
    if (errString.includes("403") || errString.includes("denied access") || errString.includes("PERMISSION_DENIED")) {
      errorMessage = "আপনার API Key টিতে এই মডেলটি ব্যবহারের অনুমতি নেই (403 Forbidden)। দয়া করে AI Studio-র 'Secrets' প্যানেলে গিয়ে একটি সচল GEMINI_API_KEY যোগ করুন।";
    } else if (errString.includes("API key not valid") || errString.includes("API_KEY_INVALID")) {
      errorMessage = "আপনার এপিআই কি (API Key) সঠিক নয়। অনুগ্রহ করে সঠিক এবং সক্রিয় একটি API Key প্রদান করুন।";
    } else if (errString.includes("Quota exceeded")) {
      errorMessage = "দুঃখিত, ব্যবহারের কোটা শেষ হয়ে গেছে। কিছুক্ষণ পর আবার চেষ্টা করুন।";
    } else if (errString.includes("Safety")) {
      errorMessage = "নিরাপত্তা পলিসির কারণে এই ছবিটি এনালাইসিস করা সম্ভব হচ্ছে না।";
    } else {
      errorMessage = `ত্রুটি: ${errString.substring(0, 150)}`;
    }
    
    throw new Error(errorMessage);
  }
}
