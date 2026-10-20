import { VercelRequest, VercelResponse } from "@vercel/node";
import { RAGService } from "./services/rag.service";
import { ChatRequest } from "./models/chat-message.model";

export default async function handler(req: VercelRequest, res: VercelResponse) {

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed. Use POST." });
    }

    const { prompt, history }: ChatRequest = req.body;

    let reply;
    
    if (history && Array.isArray(history) && history.length > 0) {
      reply = await RAGService.promptWithHistoryAndRAG(history);
    } 
    else {
      reply = await RAGService.promptWithRAG(prompt);
    }

    res.status(200).json(reply);

  } 
  catch (error: any) {
    console.error("Chat API error:", error);
    res.status(500).json({ error: "Something went wrong", details: error.message });
  }
}
