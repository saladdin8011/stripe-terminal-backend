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
        return data.apiKey || "";
    } catch (error) {
        console.error("❌ Error fetching API key:", error);
        return "";
    }
}

// ✅ Securely fetch Reader ID from backend
async function getReaderId() {
    try {
        const apiKey = await getApiKey();
        const response = await fetch("/get-reader-id", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey
            }
        });

        if (!response.ok) {
            console.error(`❌ Server responded with: ${response.status} ${response.statusText}`);
            return "";
        }

        const data = await response.json();
        return data.reader_id || "";
    } catch (error) {
        console.error("❌ Error fetching Reader ID:", error);
        return "";
    }
}

// ✅ Initiate Payment Request
async function initiatePayment() {
    const amount = document.getElementById("amount").value;
    const statusText = document.getElementById("payment_status");

    if (!amount || amount <= 0) {
        statusText.innerText = "❌ Please enter a valid amount.";
        return;
    }

    statusText.innerText = "⌛ Payment pending... Waiting for Stripe confirmation.";

    try {
        const apiKey = await getApiKey();
        const readerId = await getReaderId();

        if (!readerId) {
            statusText.innerText = "❌ Reader ID not found. Please try again.";
            return;
        }

        console.log("🔍 Sending API Key in request:", "****" + apiKey.slice(-4)); // Mask API key in logs

        const response = await fetch("/create_payment_intent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey
            },
            body: JSON.stringify({ reader_id: readerId, amount: amount * 100, currency: "GBP" })
        });

        // ✅ Check if the response is valid before handling it
        if (!response.ok) {
            console.error(`❌ Server responded with: ${response.status} ${response.statusText}`);
            statusText.innerText = `❌ Error: ${response.statusText}`;
            return;
        }

        const result = await response.json();
        console.log("✅ Stripe Response:", result); // Log the response

        if (result.error) {
            statusText.innerText = "❌ Error: " + result.error;
        } else {
            statusText.innerText = "✅ Payment request sent to terminal! Waiting for Stripe confirmation...";
            document.getElementById("payment_intent_id").value = result.client_secret;

            // ✅ Poll for payment confirmation
            await checkPaymentStatus(result.client_secret, statusText);
        }
    } catch (error) {
        console.error("❌ Network error:", error);
        statusText.innerText = "⚠️ Payment may have been successful. Please check Stripe.";
    }
}

async function checkPaymentStatus(paymentIntentId, statusText) {
    try {
        const apiKey = await getApiKey();
        let attempts = 0;

        while (attempts < 6) { // Check payment status up to 6 times (30 seconds total)
            console.log(`🔍 Checking payment status for ${paymentIntentId} (Attempt ${attempts + 1})`);

            const response = await fetch(`/check_payment_status?payment_intent_id=${paymentIntentId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey
                }
            });

            if (!response.ok) {
                console.error("❌ Error fetching payment status:", response.statusText);
                statusText.innerText = "⚠️ Unable to verify payment status. Please check Stripe.";
                return;
            }

            const result = await response.json();
            console.log("🔍 Payment Status Response:", result);

            if (result.status === "succeeded") {
                statusText.innerText = "✅ Payment successful!";
                return;
            } else if (result.status === "requires_payment_method") {
                statusText.innerText = "❌ Payment failed. Please try again.";
                return;
            }

            // ✅ Wait 5 seconds before checking again
            await new Promise(resolve => setTimeout(resolve, 5000));
            attempts++;
        }

        statusText.innerText = "⚠️ Payment status unknown. Please check Stripe.";
    } catch (error) {
        console.error("❌ Error checking payment status:", error);
        statusText.innerText = "⚠️ Error retrieving payment status.";
    }
}


// ✅ Cancel Transaction on POS
async function cancelTransaction() {
    const statusText = document.getElementById("cancel_status");
    statusText.innerText = "⌛ Cancelling transaction on POS...";

    try {
        const apiKey = await getApiKey();
        const readerId = await getReaderId();

        if (!readerId) {
            statusText.innerText = "❌ Reader ID not found. Cannot cancel transaction.";
            return;
        }

        console.log("🔍 Sending Cancel Request to POS:", "****" + readerId.slice(-4)); // Mask Reader ID in logs

        const response = await fetch("/cancel_payment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey
            },
            body: JSON.stringify({ reader_id: readerId })
        });

        const result = await response.json();
        if (result.error) {
            statusText.innerText = "❌ Error: " + result.error;
        } else {
            statusText.innerText = `✅ Transaction Canceled Successfully on POS`;
        }
    } catch (error) {
        statusText.innerText = "❌ Network error. Please try again.";
    }
}