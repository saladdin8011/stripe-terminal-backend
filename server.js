if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
  }
  
  const express = require("express");
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const middleware = require("./middleware");
  
  const app = express();
  middleware(app);
  
  // Debugging: Log environment variables
  console.log("PORT:", process.env.PORT || "Not Set");
  console.log("Stripe Secret Key:", process.env.STRIPE_SECRET_KEY ? "Loaded" : "Missing");
  console.log("API Key:", process.env.API_KEY ? "Loaded" : "Missing");
  
  const PORT = process.env.PORT || 10000; // ✅ Must use process.env.PORT for Render
  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
  