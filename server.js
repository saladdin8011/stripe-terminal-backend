require("dotenv").config();
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const middleware = require("./middleware");
const bodyParser = require("body-parser");

const app = express();
middleware(app);

app.use(express.json()); // ✅ Ensure Express processes JSON requests
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.raw({ type: "application/json" })); // ✅ Required for webhooks

// ✅ Authentication Middleware
const authenticate = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  next();
};

// ✅ Route to Check Server Status
app.get("/", (req, res) => {
  res.json({
    message: "Server is running",
    routes: [
      { method: "POST", path: "/create_connection_token" },
      { method: "POST", path: "/create_payment_intent" },
      { method: "POST", path: "/collect_payment" },
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

    // ✅ Ensure a reader_id is provided
    if (!reader_id) {
      return res.status(400).json({ error: "Reader ID is required" });
    }

    // ✅ Trigger Amount Entry on WisePOS E
    const action = await stripe.terminal.readers.collectPaymentMethod(reader_id);

    res.json({
      reader_action: action,
      message: "Amount entry enabled on WisePOS E. Enter the amount directly on the reader."
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Create a Payment Intent with Automatic Capture
app.post("/create_payment_intent", authenticate, async (req, res) => {
  try {
    let { amount, currency, reader_id } = req.body;

    // ✅ Ensure amount is provided
    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    // ✅ Default to GBP if currency is missing
    if (!currency) {
      currency = "GBP";
    }

    // ✅ Ensure a reader_id is provided
    if (!reader_id) {
      return res.status(400).json({ error: "Reader ID is required to process the payment" });
    }

    // ✅ Create a Payment Intent with Automatic Capture
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ["card_present"],
      capture_method: "automatic", // 🔥 Ensures instant capture
    });

    // ✅ Attach the Payment Intent to the WisePOS E Reader
    const action = await stripe.terminal.readers.processPaymentIntent(reader_id, {
      payment_intent: paymentIntent.id,
    });

    res.json({
      client_secret: paymentIntent.client_secret,
      reader_action: action,
      message: "Payment request sent to the WisePOS E reader."
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Refund a Payment
app.post("/refund_payment", authenticate, async (req, res) => {
  try {
    let { payment_intent_id, amount } = req.body;

    // ✅ Ensure payment intent ID is provided
    if (!payment_intent_id) {
      return res.status(400).json({ error: "Payment Intent ID is required for a refund" });
    }

    // ✅ Create a Refund (Partial if amount is specified)
    const refund = await stripe.refunds.create({
      payment_intent: payment_intent_id,
      amount: amount || undefined, // If no amount is provided, refunds full amount
    });

    res.json({
      refund_id: refund.id,
      status: refund.status,
      message: `Refund ${refund.status} for payment intent ${payment_intent_id}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Handle Failed Payments (Stripe Webhook)
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET // Set this in your environment variables
    );
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // ✅ Handle Payment Failure
  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    console.log(`❌ Payment Failed: ${paymentIntent.id} - Reason: ${paymentIntent.last_payment_error?.message}`);

    // ✅ Send a response to acknowledge receipt of the event
    return res.status(200).json({ message: `Handled payment failure for ${paymentIntent.id}` });
  }

  // ✅ Respond to all other events
  res.status(200).json({ received: true });
});

// ✅ Start the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server running on port ${PORT}`));
