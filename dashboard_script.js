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

// ✅ Securely fetch Reader ID
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
        console.log("🔍 Reader ID Retrieved:", data.reader_id ? "****" + data.reader_id.slice(-4) : "None");
        return data.reader_id || "";
    } catch (error) {
        console.error("❌ Error fetching Reader ID:", error);
        return "";
    }
}

// ✅ Ensure All Functions Are Properly Closed
