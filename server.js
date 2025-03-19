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

// ✅ Serve the Payment Dashboard
app.get("/dashboard", (req, res) => {
    const filePath = path.join(__dirname, "public", "dashboard.html");
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send("dashboard.html not found");
    }
});

// ✅ Authentication Middleware with API Key Debugging
const authenticate = (req, res, next) => {
    const apiKey = req.headers["x-api-key"];
    const expectedApiKey = process.env.API_KEY;
    
    console.log("🔍 Received API Key:", apiKey || "None"); // Debugging log
    console.log("🔍 Expected API Key:", expectedApiKey || "Not Set"); // Expected key

    if (!expectedApiKey) {
        return res.status(500).json({ error: "Server misconfiguration: API_KEY is not set." });
    }
    
    if (!apiKey || apiKey !== expectedApiKey) {
        return res.status(403).json({ error: "Unauthorized", received: apiKey });
    }
    next();
};

// ✅ Check Server Status
app.get("/", (req, res) => {
    res.json({
        message: "Server is running",
        routes: [
            { method: "POST", path: "/create_connection_token" },
            { method: "POST", path: "/create_payment_intent" },
            { method: "POST", path: "/collect_payment" },
            { method: "POST", path: "/initiate_payment" },
            { method: "POST", path: "/refund_payment" },
            { method: "POST", path: "/webhook" }
        ]
    });
});

// ✅ Generate a Stripe Terminal Connection Token
app.post("/create_connection_token", authenticate, async (req, res) => {
    try {
        const token = await stripe.terminal.connectionTokens.create();
        res.json({ secret: token.secret });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Allow WisePOS E to Enter Amount Manually
app.post("/collect_payment", authenticate, async (req, res) => {
    try {
        let { reader_id } = req.body;
        if (!reader_id) {
            return res.status(400).json({ error: "Reader ID is required" });
        }
        const action = await stripe.terminal.readers.collectPaymentMethod(reader_id);
        res.json({ reader_action: action, message: "Amount entry enabled on WisePOS E. Enter the amount directly on the reader." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Initiate Payment from WisePOS E
app.post("/initiate_payment", authenticate, async (req, res) => {
    try {
        let { reader_id } = req.body;
        if (!reader_id) {
            return res.status(400).json({ error: "Reader ID is required to initiate payment" });
        }
        const action = await stripe.terminal.readers.collectPaymentMethod(reader_id);
        res.json({ reader_action: action, message: "WisePOS E is now ready to accept a payment. Enter the amount on the reader." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Create a Payment Intent with Automatic Capture
app.post("/create_payment_intent", authenticate, async (req, res) => {
    try {
        let { amount, currency, reader_id } = req.body;
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
        res.json({ client_secret: paymentIntent.client_secret, reader_action: action, message: "Payment request sent to the WisePOS E reader." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

console.log("🔍 Checking API_KEY in Environment Variables...");
if (process.env.API_KEY) {
    console.log("✅ API_KEY is set in Render.");
} else {
    console.error("❌ API_KEY is NOT set in Render! Check environment variables.");
}

// ✅ Start the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server running on port ${PORT}`));