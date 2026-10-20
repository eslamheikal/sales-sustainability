import { VercelRequest, VercelResponse } from "@vercel/node";
import { ProductDataService } from "./services/product-data.service";
import { InitResponse } from "./models/api-response.model";
import { DatabaseService } from "./services/database.service";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await DatabaseService.initializeSchema();

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed. Use POST." });
    }

    // Backfill embeddings for any products missing vectors
    const updated = await ProductDataService.backfillMissingEmbeddings();
    
    console.log(`Backfilled embeddings for ${updated} products`);

    const response: InitResponse = { 
      message: "Database initialized successfully with sample data",
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json(response);
  } 
  catch (error: any) {
    console.error("Init API error:", error);
    res.status(500).json({ error: "Failed to initialize database", details: error.message });
  }
}
