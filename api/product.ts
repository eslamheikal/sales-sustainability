import { VercelRequest, VercelResponse } from "@vercel/node";
import { DatabaseService } from "./services/database.service";
import { ProductDataService } from "./services/product-data.service";

function getProductId(req: VercelRequest): string | undefined {
  if (typeof req.query.id === "string" && req.query.id.trim()) {
    return req.query.id.trim();
  }

  const params = (req as VercelRequest & { params?: { id?: string } }).params;
  if (typeof params?.id === "string" && params.id.trim()) {
    return params.id.trim();
  }

  const url = req.url ?? "";
  const match = url.match(/\/api\/product\/([^/?#]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const productId = getProductId(req);
    if (!productId) {
      return res.status(400).json({ error: "Product id is required" });
    }

    await DatabaseService.init();

    const product = await ProductDataService.getProductById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.status(200).json({ product });
  } catch (error: any) {
    console.error("Product API error:", error);
    return res.status(500).json({ error: "Something went wrong", details: error.message });
  }
}
