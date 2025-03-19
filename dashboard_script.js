document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("startPayment").addEventListener("click", initiatePayment);
    document.getElementById("refundPayment").addEventListener("click", processRefund);
});

async function getApiKey() {
    try {
        const response = await fetch("/get-api-key");
        const data = await response.json();
        if (!data.apiKey) {
            console.error("❌ API key not received from backend.");
        }
        return data.apiKey || "";
    } catch (error) {
        console.error("❌ Error fetching API key:", error);
        return "";
    }
}

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
            body: JSON.stringify({ reader_id: "tmr_xxxxxxxxxxxxxxx", amount: amount * 100, currency: "GBP" })
        });

        const result = await response.json();
        if (result.error) {
            statusText.innerText = "❌ Error: " + result.error;
        } else {
            statusText.innerText = "✅ Payment request sent to terminal!";
        }
    } catch (error) {
        statusText.innerText = "❌ Network error. Please try again.";
    }
}

async function processRefund() {
    const paymentIntentId = document.getElementById("payment_intent_id").value;
    const refundAmount = document.getElementById("refund_amount").value;
    const statusText = document.getElementById("refund_status");

    if (!paymentIntentId) {
        statusText.innerText = "❌ Please enter a Payment Intent ID.";
        return;
    }

    statusText.innerText = "⌛ Processing refund...";

    try {
        const apiKey = await getApiKey();
        console.log("🔍 Sending API Key in refund request:", apiKey || "None");

        const response = await fetch("/refund_payment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey
            },
            body: JSON.stringify({
                payment_intent_id: paymentIntentId,
                amount: refundAmount ? refundAmount * 100 : null
            })
        });

        const result = await response.json();
        if (result.error) {
            statusText.innerText = "❌ Error: " + result.error;
        } else {
            statusText.innerText = `✅ Refund ${result.status} for ${paymentIntentId}`;
        }
    } catch (error) {
        statusText.innerText = "❌ Network error. Please try again.";
    }
}