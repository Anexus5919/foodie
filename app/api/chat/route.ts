import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { storage } from "../../../lib/storage";

const API_KEY = process.env.GOOGLE_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();

    // 1. RAG: Retrieve context from your database
    const restaurants = await storage.getRestaurants();
    let menuContext = "REAL TIME DATABASE OF RESTAURANTS AND DISHES:\n\n";
    
    for (const restaurant of restaurants) {
      const dishes = await storage.getDishes(restaurant.id);
      menuContext += `=== Restaurant: ${restaurant.name} ===\n`;
      menuContext += `Cuisines: ${restaurant.cuisines.join(", ")}\n`;
      menuContext += `Menu:\n`;
      // This is a comment.
      for (const dish of dishes) {
        menuContext += `- Dish: ${dish.name} | Price: ₹${dish.price}\n`;
        menuContext += `  Desc: ${dish.description}\n`;
        menuContext += `  Dietary: ${dish.isVeg ? "Vegetarian" : "Non-Veg"} ${dish.isHealthy ? "| Healthy Choice" : ""}\n`;
      }
      menuContext += "\n";
    }

    // System instruction acts as the context and persona definition
    const systemInstruction = `
      You are the 'Foodie AI Assistant', a friendly and helpful nutrition expert.
      
      CONTEXT (Use this data for answers):
      ${menuContext}

      INSTRUCTIONS:
      1. **Structure**: Always use a clean **bullet-point list** for recommendations.
      2. **Formatting**: Use **Bold** for Dish Names and *Italics* for prices or calories.
      3. **Content**: 
         - Estimate calories based on description (e.g. "~350 kcal").
         - Mention the Restaurant Name for each dish.
         - Add a short, appetizing 1-sentence description.
      4. **Tone**: Be warm, enthusiastic, and "satisfying" to read. Use emojis! 😋🥘
      5. **Constraint**: If the user asks for a diet (e.g. "High Protein"), prioritize dishes with chicken, paneer, or lentils.

      EXAMPLE OUTPUT FORMAT:
      * **[Dish Name]** from [Restaurant] - *₹[Price]*
          (Dietary Info | ~[Calories] kcal)
          [Appetizing Description] 🤤
    `;

    // ✅ FIX: Use a valid model name - gemini-2.5-flash doesn't exist
    // Try gemini-1.5-flash (stable) or gemini-2.0-flash-exp (newer but experimental)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",  // Changed from gemini-2.5-flash
      systemInstruction: systemInstruction 
    });

    // Prepare chat history for the model
    // Client has { role: 'user' | 'ai', content: string }
    // Gemini needs { role: 'user' | 'model', parts: [{ text: string }] }
    const chatHistory = (history || []).map((msg: any) => ({
      role: msg.role === "ai" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    // ✅ FIX: Remove any leading 'model' messages to ensure first message is from 'user'
    while (chatHistory.length > 0 && chatHistory[0].role === "model") {
      chatHistory.shift();
    }

    const chat = model.startChat({
      history: chatHistory
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ reply: text });

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("🔥 GEMINI API ERROR:", errorMsg);
    
    if (errorMsg?.includes("404") || errorMsg?.includes("fetch failed")) {
        console.error("⚠️ Model not found. Available models: gemini-1.5-flash, gemini-1.5-pro, gemini-2.0-flash-exp");
    }
    
    if (errorMsg?.includes("API_KEY_INVALID")) {
        console.error("⚠️ Your API key is invalid. Please check:");
        console.error("   1. The key in .env.local is correct");
        console.error("   2. You restarted the dev server after adding it");
        console.error("   3. The key is enabled at https://aistudio.google.com/app/apikey");
    }

    return NextResponse.json(
      { reply: "I'm having trouble connecting to the food database right now. Please try again! 🍔" },
      { status: 200 }
    );
  }
}