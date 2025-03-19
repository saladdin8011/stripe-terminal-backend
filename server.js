require("dotenv").config();
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const middleware = require("./middleware");

const app = express();
middleware(app);

// ✅ Authentication Middleware (MUST be defined before using it)
const authenticate = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  next();
};

// ✅ Ensure routes use `authenticate`
app.post("/create_connection_token", authenticate, async (req, res) => {
  try {
    const token = await stripe.terminal.connectionTokens.create();
    res.json({ secret: token.secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/create_payment_intent", authenticate, async (req, res) => {
    try {
      let { amount, currency, reader_id } = req.body;
  
      // ✅ Default to £1 (100 pence) if amount is missing
      if (!amount) {
        amount = 100;
      }
      if (!currency) {
        currency = "GBP";
      }
      
      // ✅ Ensure a reader_id is provided
      if (!reader_id) {
        return res.status(400).json({ error: "Reader ID is required to process the payment" });
      }
  
      // ✅ Create the Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        payment_method_types: ["card_present"],
        capture_method: "manual",
      });
  
      // ✅ Assign the Payment Intent to the WisePOS E Reader
      const action = await stripe.terminal.readers.processPaymentIntent(reader_id, {
        payment_intent: paymentIntent.id,
      });
  
      res.json({
        client_secret: paymentIntent.client_secret,
        reader_action: action,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  

// ✅ Start the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server running on port ${PORT}`));
