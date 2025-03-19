document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("startPayment").addEventListener("click", initiatePayment);
    document.getElementById("refundPayment").addEventListener("click", processRefund);
    document.getElementById("cancelPayment").addEventListener("click", cancelTransaction);
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
        console.log("🔍 API Key Response from Backend:", "****" + (data.apiKey ? data.apiKey.slice(-4) : "NONE"));
        return data.apiKey || "";
    } catch (error) {
        console.error("❌ Error fetching API key:", error);
        return "";
    }
}

// ✅ Securely fetch Reader ID from backend
async function getReaderId() {
    try {
        const apiKey = await getApiKey(); // ✅ Fetch API key first

        console.log("🔍 Sending API Key in request:", "****" + apiKey.slice(-4));

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
        console.log("🔍 Reader ID Response from Backend:", "****" + (data.reader_id ? data.reader_id.slice(-4) : "NONE"));
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

    statusText.innerText = "⌛ Processing payment...";

    try {
        const apiKey = await getApiKey();
        const readerId = await getReaderId();

        if (!readerId) {
            statusText.innerText = "❌ Reader ID not found. Please try again.";
            return;
        }

        const response = await fetch("/create_payment_intent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey
            },
            body: JSON.stringify({ reader_id: readerId, amount: amount * 100, currency: "GBP" })
        });

        const result = await response.json();
        if (result.error) {
            statusText.innerText = "❌ Error: " + result.error;
        } else {
            statusText.innerText = "✅ Payment request sent to terminal!";
            document.getElementById("payment_intent_id").value = result.client_secret;
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
        return;
    }

    statusText.innerText = "⌛ Processing refund...";

    try {
        const apiKey = await getApiKey();

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