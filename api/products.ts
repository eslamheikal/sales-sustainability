import { VercelRequest, VercelResponse } from "@vercel/node";
import { DatabaseService } from "./services/database.service";
import { Product } from "./models/product.model";
import { ProductListResponse, ProductCreateResponse } from "./models/api-response.model";
import { ProductDataService } from "./services/product-data.service";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await DatabaseService.init();

    switch (req.method) {
      case "GET": {
        const products = await ProductDataService.getAllProducts();
        const response: ProductListResponse = { products };
        res.status(200).json(response);
        break;
      }

      case "POST": {
        const productData: Omit<Product, 'id' | 'created_at' | 'updated_at'> = req.body;

        if (!productData.name) {
          return res.status(400).json({ error: "Product name is required" });
        }

        const productId = await ProductDataService.addProduct(productData);

        const createResponse: ProductCreateResponse = {
          message: "Product added successfully",
          productId
        };
        res.status(201).json(createResponse);
        break;
      }

      case "PUT":
        res.status(501).json({ error: "Product update not implemented yet" });
        break;

      case "DELETE":
        res.status(501).json({ error: "Product deletion not implemented yet" });
        break;

      default:
        res.status(405).json({ error: "Method not allowed" });
    }
  }
  catch (error: any) {
    console.error("Products API error:", error);
    res.status(500).json({ error: "Something went wrong", details: error.message });
  }
}
