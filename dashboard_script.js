document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("startPayment").addEventListener("click", initiatePayment);
    document.getElementById("refundPayment").addEventListener("click", processRefund);
});

// ✅ Securely fetch API Key from backend
async function getApiKey() {
    try {
        const response = await fetch("/get-api-key");
        const data = await response.json();
        
        console.log("🔍 API Key Response from Backend:", data); // Log full response

        if (!data.apiKey) {
            console.error("❌ API key not received from backend.");
        }
        return data.apiKey || "";
    } catch (error) {
        console.error("❌ Error fetching API key:", error);
        return "";
    }
}

// ✅ Initiate Payment Request
async function initiatePayment() {
    const amount = document.getElementById("amount").value;
    const statusText = document.getElementById("payment_status");

    if (!amount) {
        statusText.innerText = "❌ Please enter an amount.";
        return;
    }

    statusText.innerText = "⌛ Processing payment...";

    try {
        const apiKey = await getApiKey();
        console.log("🔍 Sending API Key in request:", apiKey || "None");

        const response = await fetch("/create_payment_intent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey
            },
            body: JSON.stringify({ reader_id: "tmr_FT3XAL98tM0XmK", amount: amount * 100, currency: "GBP" })
        });

        const result = await response.json();
        if (result.error) {
            statusText.innerText = "❌ Error: " + result.error;
        } else {
            statusText.innerText = "✅ Payment request sent to terminal!";
            document.getElementById("payment_intent_id").value = result.client_secret; // Store Payment Intent ID for refund
        }
    } catch (error) {
        statusText.innerText = "❌ Network error. Please try again.";
    }
}

// ✅ Process Refund Request
async function processRefund() {
    const paymentIntentId = document.getElementById("payment_intent_id").value;
    const refundAmount = document.getElementById("refund_amount").value;
    const statusText = document.getElementById("refund_status");

    if (!paymentIntentId) {
        statusText.innerText = "❌ Please enter a Payment Intent ID.";
        console.error("❌ Missing Payment Intent ID");
        return;
    }

    statusText.innerText = "⌛ Processing refund...";

    try {
        const apiKey = await getApiKey();
        console.log("🔍 Sending API Key in refund request:", apiKey || "None");

        const refundRequestBody = {
            payment_intent_id: paymentIntentId,
            amount: refundAmount ? parseInt(refundAmount) * 100 : null,
            reason: "requested_by_customer" // Default refund reason
        };

        console.log("🔍 Sending Refund Request:", refundRequestBody);

        const response = await fetch("/refund_payment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey
            },
            body: JSON.stringify(refundRequestBody)
        });

        if (!response.ok) {
            console.error("❌ Refund Request Failed:", response.status, response.statusText);
            statusText.innerText = `❌ Refund Error: ${response.statusText}`;
            return;
        }

        const result = await response.json();
        if (result.error) {
            console.error("❌ Refund Error:", result.error);
            statusText.innerText = "❌ Error: " + result.error;
        } else {
            statusText.innerText = `✅ Refund ${result.status} for ${paymentIntentId}`;
        }
    } catch (error) {
        console.error("❌ Network error:", error);
        statusText.innerText = "❌ Network error. Please try again.";
    }
}
