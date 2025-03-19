document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("startPayment").addEventListener("click", initiatePayment);
    document.getElementById("refundPayment").addEventListener("click", processRefund);
    document.getElementById("cancelPayment").addEventListener("click", cancelTransaction);
});

// ✅ Securely fetch API Key from backend
async function getApiKey() {
    try {
        const response = await fetch("/get-api-key");
        const data = await response.json();
        
        console.log("🔍 API Key Response from Backend:", data);

        if (!data.apiKey) {
            console.error("❌ API key not received from backend.");
        }
        return data.apiKey || "";
    } catch (error) {
        console.error("❌ Error fetching API key:", error);
        return "";
    }
}
async function getReaderId() {
    try {
        const response = await fetch("/get-reader-id");
        const data = await response.json();

        console.log("🔍 Reader ID Response from Backend:", "****" + data.reader_id.slice(-4)); // ✅ Masked in logs

        if (!data.reader_id) {
            console.error("❌ Reader ID not received from backend.");
        }
        return data.reader_id || "";
    } catch (error) {
        console.error("❌ Error fetching Reader ID:", error);
        return "";
    }
}

// ✅ Update Payment Function to Use the Secure Reader ID
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
        const readerId = await getReaderId(); // ✅ Fetch Secure Reader ID

        console.log("🔍 Sending API Key in request:", "****" + apiKey.slice(-4)); // ✅ Mask API Key in logs

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


// ✅ Initiate Payment Request
async function initiatePayment() {
    const amount = document.getElementById("amount").value;
    const readerId = document.getElementById("reader_id").value;
    const statusText = document.getElementById("payment_status");

    if (!amount || !readerId) {
        statusText.innerText = "❌ Please enter an amount and Reader ID.";
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

// ✅ Cancel Transaction on POS
async function cancelTransaction() {
    const readerId = document.getElementById("reader_id").value;
    const statusText = document.getElementById("cancel_status");

    if (!readerId) {
        statusText.innerText = "❌ Reader ID is required.";
        return;
    }

    statusText.innerText = "⌛ Cancelling transaction on POS...";

    try {
        const apiKey = await getApiKey();
        console.log("🔍 Sending Cancel Request to POS:", { reader_id: readerId });

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
