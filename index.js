import express from "express";
import fetch from "node-fetch";
import cors from "cors"; // 1. CORS add karna zaroori hai

const app = express();
app.use(express.json());
app.use(cors()); // Isse aapka frontend (ya mobile bridge) is API ko call kar payega

const CUELINKS_API_KEY = process.env.CUELINKS_API_KEY;

app.post("/cuelinks-search", async (req, res) => {
  try {
    const { query } = req.body;

    // 2. Query validation
    if (!query) {
      return res.status(400).json({ status: "error", message: "Query is required" });
    }

    // 3. API Key check
    if (!CUELINKS_API_KEY) {
      return res.status(500).json({ status: "error", message: "API Key missing in Environment Variables" });
    }

    const response = await fetch(
      `https://api.cuelinks.com/v2/product_feeds.json?keyword=${encodeURIComponent(query)}`,
      {
        method: "GET",
        headers: {
          // Cuelinks ka format aksar 'Token token="YOUR_KEY"' hota hai
          "Authorization": `Token token="${CUELINKS_API_KEY}"`,
          "Accept": "application/json"
        }
      }
    );

    const data = await response.json();

    // 4. Data structure check (Cuelinks response format ke hisaab se)
    const products = data.products || data.items || []; 

    if (products.length === 0) {
      return res.json({ 
        status: "no_products", 
        message: `No products found for "${query}"` 
      });
    }

    // Best price logic (Aapka logic sahi tha, bas safe check add kiya hai)
    const sorted = products.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    const best = sorted[0];

    res.json({
      status: "success",
      best_product: {
        name: best.name || best.title,
        price: best.price,
        link: best.url || best.affiliate_link,
        merchant: best.merchant_name
      },
      total_found: products.length
    });

  } catch (error) {
    console.error("Error fetching from Cuelinks:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});

// Health check route (Render ke liye achha reha hai)
app.get("/", (req, res) => res.send("Vaani Backend is Live!"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Boss, Vaani server is running on port ${PORT}`));
