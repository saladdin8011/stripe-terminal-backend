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
        const apiKey = await getApiKey();

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
