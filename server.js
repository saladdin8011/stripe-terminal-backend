// Load environment variables locally (ignored on Render)
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config(); 
  }
  
  const express = require("express");
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const middleware = require("./middleware");
  
  const app = express();
  middleware(app);
  
  // Debugging: Check if environment variables are loading
  console.log("Stripe Secret Key:", process.env.STRIPE_SECRET_KEY ? "Loaded" : "Missing");
  console.log("API Key:", process.env.API_KEY ? "Loaded" : "Missing");
  
  // Ensure the correct port is used
  const PORT = process.env.PORT || 10000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  