require("dotenv").config();
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const middleware = require("./middleware");
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
middleware(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.raw({ type: "application/json" })); // Required for webhooks
app.use(express.static("public")); // Serve static files for CSS & JS

// ✅ Ensure public directory exists
if (!fs.existsSync("public")) {
    fs.mkdirSync("public");
}

// ✅ Authentication Middleware (Declared before usage)
const authenticate = (req, res, next) => {
    const apiKey = req.headers["x-api-key"];
    const expectedApiKey = process.env.API_KEY;

    console.log("🔍 Headers received in request:", req.headers);
    console.log("🔍 Received API Key:", apiKey || "None");
    console.log("🔍 Expected API Key:", expectedApiKey ? "****" + expectedApiKey.slice(-4) : "Not Set");

    if (!expectedApiKey) {
        console.error("❌ API_KEY is not set in the Render environment variables.");
        return res.status(500).json({ error: "Server misconfiguration: API_KEY is not set." });
    }

    if (!apiKey || apiKey !== expectedApiKey) {
        console.error("❌ Unauthorized access attempt detected.");
        return res.status(403).json({ error: "Unauthorized" });
    }

    next();
};

// ✅ Serve the Payment Dashboard
app.get("/dashboard", (req, res) => {
    const filePath = path.join(__dirname, "public", "dashboard.html");
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send("dashboard.html not found");
    }
});

// ✅ API Key Retrieval Endpoint
app.get("/get-api-key", (req, res) => {
    console.log("🔍 API Key Requested from Frontend");

    if (!process.env.API_KEY) {
        console.error("❌ API_KEY is NOT set in Render!");
        return res.status(500).json({ error: "API_KEY is not set" });
    }

    res.json({ apiKey: process.env.API_KEY });
});

// ✅ Process a Payment
app.post("/create_payment_intent", authenticate, async (req, res) => {
    try {
        let { amount, currency, reader_id } = req.body;
        console.log("🔍 Payment Request Received:", req.body);

        if (!amount) {
            return res.status(400).json({ error: "Amount is required" });
        }
        if (!currency) {
            currency = "GBP";
        }
        if (!reader_id) {
            return res.status(400).json({ error: "Reader ID is required to process the payment" });
        }
        
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            payment_method_types: ["card_present"],
            capture_method: "automatic",
        });

        const action = await stripe.terminal.readers.processPaymentIntent(reader_id, {
            payment_intent: paymentIntent.id,
        });

        console.log("✅ Payment Request Sent to Reader:", action);
        res.json({ client_secret: paymentIntent.client_secret, reader_action: action, message: "Payment request sent to the WisePOS E reader." });
    } catch (error) {
        console.error("❌ Payment Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ Refund a Payment
app.post("/refund_payment", authenticate, async (req, res) => {
    try {
        let { payment_intent_id, amount } = req.body;
        console.log("🔍 Refund Request Received:", req.body);
        
        if (!payment_intent_id) {
            console.error("❌ Missing Payment Intent ID");
            return res.status(400).json({ error: "Payment Intent ID is required for a refund" });
        }

        const refund = await stripe.refunds.create({
            payment_intent: payment_intent_id,
            amount: amount ? amount * 100 : undefined,
        });

        console.log("✅ Refund Successful:", refund);
        res.json({ refund_id: refund.id, status: refund.status, message: `Refund ${refund.status} for payment intent ${payment_intent_id}` });
    } catch (error) {
        console.error("❌ Refund Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ Cancel a Payment
app.post("/cancel_payment", authenticate, async (req, res) => {
  try {
      let { payment_intent_id, reader_id } = req.body;
      console.log("🔍 Cancel Request Received:", req.body);

      if (!payment_intent_id) {
          console.error("❌ Missing Payment Intent ID");
          return res.status(400).json({ error: "Payment Intent ID is required to cancel a transaction" });
      }
      if (!reader_id) {
          console.error("❌ Missing Reader ID");
          return res.status(400).json({ error: "Reader ID is required to cancel the transaction on the POS" });
      }

      // Cancel the payment intent
      const cancelIntent = await stripe.paymentIntents.cancel(payment_intent_id);
      console.log("✅ Payment Intent Canceled:", cancelIntent);

      // Cancel the action on the WisePOS E reader
      const cancelReaderAction = await stripe.terminal.readers.cancelAction(reader_id);
      console.log("✅ POS Reader Transaction Canceled:", cancelReaderAction);

      res.json({
          message: "Transaction canceled successfully on Stripe and POS",
          payment_intent_id,
          reader_id,
      });
  } catch (error) {
      console.error("❌ Cancel Error:", error);
      res.status(500).json({ error: error.message });
  }
});


// ✅ Start the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server running on Render, listening on port ${PORT}`));
