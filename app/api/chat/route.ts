import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { storage } from "../../../lib/storage";

// Using your hardcoded key as requested
const API_KEY = (process.env.GOOGLE_API_KEY || ""); 

const genAI = new GoogleGenerativeAI(API_KEY);

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    // 1. RAG: Retrieve context from your database
    const restaurants = await storage.getRestaurants();
    let menuContext = "REAL TIME DATABASE OF RESTAURANTS AND DISHES:\n\n";

    for (const restaurant of restaurants) {
      const dishes = await storage.getDishes(restaurant.id);
      menuContext += `=== Restaurant: ${restaurant.name} ===\n`;
      menuContext += `Cuisines: ${restaurant.cuisines.join(", ")}\n`;
      menuContext += `Menu:\n`;
      
      for (const dish of dishes) {
        menuContext += `- Dish: ${dish.name} | Price: ₹${dish.price}\n`;
        menuContext += `  Desc: ${dish.description}\n`;
        menuContext += `  Dietary: ${dish.isVeg ? "Vegetarian" : "Non-Veg"} ${dish.isHealthy ? "| Healthy Choice" : ""}\n`;
      }
      menuContext += "\n";
    }

    // Use the current stable model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are the 'Foodie AI Assistant', a friendly and helpful nutrition expert.
      
      CONTEXT (Use this data for answers):
      ${menuContext}

      USER QUESTION: "${message}"

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

      Answer now in this format:
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ reply: text });

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("🔥 GEMINI API ERROR:", errorMsg);
    
    if (errorMsg?.includes("404")) {
        console.error("⚠️ Model version error. Try switching 'gemini-2.5-flash' to 'gemini-2.0-flash'.");
    }

    return NextResponse.json(
      { reply: "I'm having trouble connecting to the food database right now. Please try again! 🍔" },
      { status: 200 }
    );
  }
}