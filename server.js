console.log("🚀 Starting server.js...");

if (process.env.NODE_ENV !== "production") {
  console.log("Loading environment variables from .env...");
  require("dotenv").config();
}

const express = require("express");
console.log("✅ Express module loaded");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
console.log("✅ Stripe module initialized");

const middleware = require("./middleware");
console.log("✅ Middleware module loaded");

const app = express();
middleware(app);

console.log("✅ Middleware applied successfully");

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server running on port ${PORT}`));
app.post("/create_connection_token", authenticate, async (req, res) => {
    try {
      const token = await stripe.terminal.connectionTokens.create();
      res.json({ secret: token.secret });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  