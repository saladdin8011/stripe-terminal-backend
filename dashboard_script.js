document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM fully loaded. Attaching event listeners...");

    // Ensure all elements exist before attaching event listeners
    const startPaymentBtn = document.getElementById("startPayment");
    const cancelPaymentBtn = document.getElementById("cancelPayment");

    if (startPaymentBtn) {
        startPaymentBtn.addEventListener("click", initiatePayment);
    } else {
        console.error("❌ startPayment button not found in the DOM.");
    }

    if (cancelPaymentBtn) {
        cancelPaymentBtn.addEventListener("click", cancelTransaction);
    } else {
        console.error("❌ cancelPayment button not found in the DOM.");
    }
});

// ✅ Securely fetch API Key from backend
async function getApiKey() {
    try {
        const response = await fetch("/get-api-key");
        if (!response.ok) {
            console.error(`❌ API Key Request Failed: ${response.status} ${response.statusText}`);
            return "";
        }
        const data = await response.json();
        console.log("🔍 API Key Retrieved from Backend:", data.apiKey ? "****" + data.apiKey.slice(-4) : "None"); // Mask API key
        return data.apiKey || "";
    } catch (error) {
        console.error("❌ Error fetching API key:", error);
        return "";
    }
}

// ✅ Check Payment Status and Confirm Success with Stripe
async function checkPaymentStatus(paymentIntentId, statusText) {
    if (!paymentIntentId) {
        console.error("❌ Missing Payment Intent ID in checkPaymentStatus");
        statusText.innerText = "❌ No payment ID found. Cannot check status.";
        return;
    }
    
    // ✅ Ensure only the payment intent ID is sent (without the secret key)
    const cleanPaymentIntentId = paymentIntentId.split("_")[0];
    
    statusText.innerText = "⌛ Checking payment status...";

    try {
        const apiKey = await getApiKey();
        console.log("🔍 Sending API Key in checkPaymentStatus:", "****" + apiKey.slice(-4));

        const response = await fetch(`/check_payment_status?payment_intent_id=${cleanPaymentIntentId}`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "x-api-key": apiKey
            }
        });

        if (!response.ok) {
            console.error("❌ Server responded with:", response.statusText);
            statusText.innerText = "⚠️ Unable to verify payment status. Please check Stripe.";
            return;
        }

        const result = await response.json();
        console.log("🔍 Payment Status Response from Stripe:", result);

        if (result.status === "succeeded") {
            statusText.innerText = "✅ Payment successful!";
            return;
        } else if (result.status === "processing") {
            statusText.innerText = "⌛ Payment is still processing. Please wait...";
            setTimeout(() => checkPaymentStatus(cleanPaymentIntentId, statusText), 5000); // Retry after 5 seconds
            return;
        } else if (result.status === "requires_payment_method") {
            statusText.innerText = "❌ Payment failed. Please try again.";
            return;
        }

        statusText.innerText = "⚠️ Payment status unknown. Please check Stripe.";
    } catch (error) {
        console.error("❌ Error checking payment status:", error);
        statusText.innerText = "⚠️ Error retrieving payment status.";
    }
}
