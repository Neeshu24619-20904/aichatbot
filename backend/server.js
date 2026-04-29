import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import personas from "./personas.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// 🔥 Chat Endpoint
app.post("/chat", async (req, res) => {
  try {
    const { persona, messages } = req.body;

    if (!personas[persona]) {
      return res.status(400).json({
        error: "Invalid persona selected",
      });
    }

    // 🧠 Convert messages to Gemini format
    const history = messages.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Inject system prompt at start
    const systemPrompt = personas[persona];

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", // fast + cheap
      contents: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        ...history,
      ],
    });

    const reply = response.text;

    res.json({ reply });
  } catch (error) {
    console.error("Gemini Error:", error.message);

    res.status(500).json({
      error: "Something went wrong. Please try again.",
    });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("Gemini backend running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});