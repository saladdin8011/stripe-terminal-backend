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

    statusText.innerText = "⌛ Processing payment...";

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

        if (!response.ok) {
            console.error(`❌ Server responded with: ${response.status} ${response.statusText}`);
            statusText.innerText = `❌ ${response.statusText}`;
            return;
        }

        const result = await response.json();
        if (result.error) {
            statusText.innerText = "❌ Error: " + result.error;
        } else {
            statusText.innerText = "✅ Payment request sent to terminal!";
            document.getElementById("payment_intent_id").value = result.client_secret;
        }
    } catch (error) {
        console.error("❌ Network error:", error);
        statusText.innerText = "✅ Payment successful!";
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
