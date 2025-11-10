import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { sophosChat } from "./aiHandler.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// test
app.get("/", (req, res) => {
  res.send("Sophos AI backend running!");
});

// end chat
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const reply = await sophsosChat(message);
    res.json({ reply });
  } catch (error) {
    console.error("Error in /chat:", error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
