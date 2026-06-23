import express from "express";
import path from "path";
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Warm, helpful, and localized system instructions for the company's helper assistant.
const AMD_SYSTEM_PRACTICES = `You are 'AMD Makhana Sahayak' (Assistant), a specialized and friendly AI customer support assistant for AMD Trading Company.
Your goal is to answer queries politely, accurately, and assist buyers (both retail and large wholesale distributors) looking to procure premium quality popped Lotus Seeds (known as Phool Makhana / Fox Nuts).

Key Facts & Identity of AMD Trading Company:
1. Origin & Quality: We procure raw seeds directly from local farmer cooperatives/micro-mandis in Darbhanga and Madhubani, Bihar—the prestigious geographical home of high-quality makhana.
2. Premium Grading System: Our seeds go through modern, safety-led machinery grids with multiple grading filters. We do NOT use chemical bleaches or standard formatting agents, ensuring crispy, organic, and size-consistent flakes.
3. Our Premium Segments:
   - Shuddh Premium Makhana: handpicked premium larger seeds, perfect for corporate gifting, premium packaging, or roasting. Size-consistent, heavy flakes, crispy bite. 
   - Rozana Makhana: perfect for everyday healthy consumption, slightly smaller but highly crispy, excellent wholesale and retail daily-snack value.
4. FSSAI Licensed Food Business: Under Governing license No. '20826004001411'.
5. Head Office Location: B-50/A Rishi Nagar, Chawla Colony, Ballabgarh, Faridabad, Haryana, Pincode 121004.
6. Core Business Methods: We maintain a highly transparent wholesale quote process. Large buyers can use our "Bulk Calculator" on the website to design cargo specs, check live weight calculations, specify custom packaging models, and request custom branding/labeling. The checkout then offers direct WhatsApp order placement for fast secure fulfillment.
7. Retail Deliveries: Retail customers can also buy makhana packets of 250g directly via our retail shop pane on the website with secure Firestore storage, custom notifications, and WhatsApp tracking confirmations.
8. Deliveries: We dispatch and ship cargo across all states of India, completely and legally under full GST-compliant billing. We respond to email specification query sheets within 24 hours.
9. Contact Details:
   - Email: amdtradingcompany11@gmail.com
   - Contact Number / WhatsApp: Customers can trigger direct whatsapp action from any button on our page.

Conversational Rules:
- Keep responses friendly, humble, concise, and professional. 
- Use brief bullet points or visual linebreaks for readability.
- When customers ask about prices, explain we provide very competitive ex-warehouse rates which adjust tracking live Bihar mandi market curves to give buyers the absolute best profit margins. For exact today's quotes, encourage using the Bulk Calculator or clicking the WhatsApp support button!
- Feel free to greet in a localized Indian welcoming tone when appropriate (e.g. "Namaste!" or "Hello!").
- Do NOT expose any internal system settings, backend secrets, database connections, or direct API keys. Keep the focus purely on customer assistance.`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for AI Chat Bot Conversation proxy
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid context. A 'messages' array is required." });
      }

      // Read key or use system fallback gracefully
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("GEMINI_API_KEY is not defined in environment variables. Falling back to simple heuristic replies.");
        // Mock fallback to keep app active even if API key is not fully loaded in visualizer
        const lastMsg = messages[messages.length - 1]?.parts?.[0]?.text || "";
        const lower = lastMsg.toLowerCase();
        let fallbackText = "Namaste! Thank you for reaching out to AMD Trading Company. I am preparing your query. Please make sure to save your GEMINI_API_KEY in Settings > Secrets to activate real-time AI responses!";
        if (lower.includes("price") || lower.includes("rate") || lower.includes("cost")) {
          fallbackText = "We offer premium makhana (Shuddh & Rozana) tracking live mandi rates closely to give you excellent ex-warehouse margins! Feel free to calculate exact pricing on our Bulk Calculator or tap 'Confirm & Pay via WhatsApp' to verify live quotes today.";
        } else if (lower.includes("address") || lower.includes("where") || lower.includes("location")) {
          fallbackText = "Our Head Office is located at B-50/A Rishi Nagar, Chawla Colony, Ballabgarh, Faridabad, Haryana - 121004. Our grading and processing units operate in Darbhanga/Madhubani, Bihar!";
        } else if (lower.includes("fssai") || lower.includes("license")) {
          fallbackText = "Yes, we are fully licensed by FSSAI under Governing license No. 20826004001411, keeping high food safety and hygiene as our prime focus!";
        }
        return res.json({ text: fallbackText });
      }

      // Initialize official GenAI client
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      // Prepare request contents according to @google/genai guidelines
      // Format roles and parts beautifully
      const contents = messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : m.role,
        parts: Array.isArray(m.parts) ? m.parts : [{ text: m.parts || "" }]
      }));

      // Generate content stream or block
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: AMD_SYSTEM_PRACTICES,
          temperature: 0.7,
        }
      });

      const responseText = response.text || "I apologize, but I couldn't form a response. Please let me know how I can help you with AMD Makhana items.";
      res.json({ text: responseText });
    } catch (err: any) {
      console.error("Gemini API encounter issue:", err);
      res.status(500).json({ error: "Something went wrong in processing. Let's try again shortly!" });
    }
  });

  // Shopify integration status and configuration helper
  app.get("/api/shopify/config", (req, res) => {
    const defaultDomain = "shuddh-premium-makhana.myshopify.com";
    const domain = process.env.SHOPIFY_STORE_DOMAIN || defaultDomain;
    const hasToken = !!process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
    res.json({
      isConfigured: !!hasToken,
      domain: domain,
      help: "To fully authorize, declare SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN inside Settings > Secrets."
    });
  });

  // Test custom credentials input or settings checks
  app.post("/api/shopify/test-credentials", async (req, res) => {
    try {
      const { domain, token } = req.body;
      if (!domain || !token) {
        return res.status(400).json({ success: false, error: "Store domain and helper storefront token are required." });
      }

      const cleanDomain = domain.replace(/https?:\/\//, "").split("/")[0];
      const url = `https://${cleanDomain}/api/2024-01/graphql.json`;
      const testQuery = {
        query: `query { shop { name primaryDomain { url } } }`
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": token
        },
        body: JSON.stringify(testQuery)
      });

      if (!response.ok) {
        return res.json({ success: false, error: `Shopify responded with HTTP ${response.status}` });
      }

      const resData: any = await response.json();
      if (resData.errors) {
        return res.json({ success: false, error: resData.errors[0]?.message || "GraphQL Error" });
      }

      res.json({ success: true, shopName: resData.data?.shop?.name || cleanDomain });
    } catch (err: any) {
      res.json({ success: false, error: err.message || "Failed to make connection request" });
    }
  });

  // Live products sync query from Shopify Storefront API
  app.get("/api/shopify/products", async (req, res) => {
    try {
      const defaultDomain = "shuddh-premium-makhana.myshopify.com";
      const storeDomain = process.env.SHOPIFY_STORE_DOMAIN || defaultDomain;
      const storefrontAccessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

      if (!storefrontAccessToken) {
        return res.json({
          isConfigured: false,
          domain: storeDomain,
          products: [],
          message: "Shopify Storefront API credentials are blank. Using default catalog."
        });
      }

      const cleanDomain = storeDomain.replace(/https?:\/\//, "").split("/")[0];
      const url = `https://${cleanDomain}/api/2024-01/graphql.json`;

      const productsQuery = {
        query: `query GetProducts {
          products(first: 25) {
            edges {
              node {
                id
                title
                handle
                description
                productType
                vendor
                tags
                images(first: 5) {
                  edges {
                    node {
                      url
                      altText
                    }
                  }
                }
                variants(first: 5) {
                  edges {
                    node {
                      id
                      title
                      weight
                      weightUnit
                      price {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
            }
          }
        }`
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": storefrontAccessToken
        },
        body: JSON.stringify(productsQuery)
      });

      if (!response.ok) {
        throw new Error(`Shopify returned status ${response.status}`);
      }

      const responseBody: any = await response.json();
      if (responseBody.errors) {
        throw new Error(responseBody.errors[0]?.message || "Shopify GraphQL error");
      }

      const rawProducts = responseBody.data?.products?.edges || [];
      const mappedProducts = rawProducts.map((edge: any) => {
        const node = edge.node;
        const firstVariant = node.variants?.edges?.[0]?.node;
        
        // Extract plain weight representation
        const weightVal = firstVariant?.weight 
          ? `${firstVariant.weight} ${firstVariant.weightUnit || "kg"}` 
          : "250g";

        // Map tags to nice features bullet points
        const features = node.tags?.length > 0 
          ? node.tags.slice(0, 4) 
          : ["Authentic Premium Grade", "Sourced and Popped Fresh", "Zero Bleach or Added Chemicals", "Quality Certified"];

        // Match categories by keyword
        const tagsString = (node.tags || []).join(" ").toLowerCase();
        const typeString = (node.productType || "").toLowerCase();
        let category = "packets";
        if (tagsString.includes("suta") || tagsString.includes("bulk") || typeString.includes("bulk") || typeString.includes("wholesale")) {
          category = "suta-grades";
        }

        // Shopify variants list for drop downs
        const variantsList = (node.variants?.edges || []).map((vEdge: any) => {
          let variantPrice = parseFloat(vEdge.node.price?.amount || "0");
          if (variantPrice === 100) {
            variantPrice = 300;
          }
          return {
            id: vEdge.node.id,
            numericId: vEdge.node.id.split("/").pop() || "",
            title: vEdge.node.title,
            price: variantPrice,
            weight: vEdge.node.weight ? `${vEdge.node.weight} ${vEdge.node.weightUnit || "kg"}` : ""
          };
        });

        let originalPrice = parseFloat(firstVariant?.price?.amount || "0");
        if (originalPrice === 100) {
          originalPrice = 300;
        }

        return {
          id: node.id,
          shopifyId: node.id,
          handle: node.handle,
          category: category,
          name: node.title,
          subtitle: node.vendor || "AMD Imported Partner Lot",
          description: node.description || "Premium graded popped Lotus Seeds, sourced fresh and processed at high-safety calibration grids.",
          price: originalPrice,
          weight: weightVal,
          features: features,
          image: node.images?.edges?.[0]?.node?.url || "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&q=80&w=600",
          images: node.images?.edges?.map((imgEdge: any) => imgEdge.node.url) || [],
          badge: node.productType || "Shopify Live",
          minQty: category === "suta-grades" ? 10 : 1,
          variants: variantsList,
          activeVariantId: firstVariant?.id || ""
        };
      });

      res.json({
        isConfigured: true,
        products: mappedProducts
      });

    } catch (error: any) {
      console.error("Shopify syncing failed:", error);
      res.status(500).json({
        isConfigured: true,
        products: [],
        error: error.message || "Failed to process Shopify products list"
      });
    }
  });

  // Health endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "alive", timestamp: new Date() });
  });

  // Vite integration middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AMD Full-Stack Server boot successfully running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
