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

// ✅ Fetch Reader ID from Backend
async function getReaderId() {
    try {
        const apiKey = await getApiKey();
        const response = await fetch("/get-reader-id", {
            method: "GET",
            headers: {
                "Accept": "application/json",
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

// ✅ Define initiatePayment function before it's used
async function initiatePayment() {
    const amount = document.getElementById("amount").value;
    const statusText = document.getElementById("payment_status");
    const paymentIntentField = document.getElementById("payment_intent_id");

    if (!amount || amount <= 0) {
        statusText.innerText = "❌ Please enter a valid amount.";
        return;
    }

    statusText.innerText = "⌛ Payment pending... Waiting for Stripe confirmation.";

    try {
        const apiKey = await getApiKey();
        const readerId = await getReaderId();

        if (!readerId) {
            console.error("❌ Reader ID is missing!");
            statusText.innerText = "❌ No reader ID found. Please check the POS connection.";
            return;
        }

        console.log("🔍 Sending API Key in Payment Request:", "****" + apiKey.slice(-4));
        console.log("🔍 Reader ID Retrieved:", readerId ? "****" + readerId.slice(-4) : "None");

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
        console.log("✅ Payment Intent Created:", result);

        if (result.error) {
            statusText.innerText = "❌ Error: " + result.error;
        } else {
            statusText.innerText = "✅ Payment request sent to terminal! Waiting for Stripe confirmation...";
            
            // Ensure payment_intent_id exists in the DOM before assigning value
            if (!paymentIntentField) {
                console.warn("⚠️ payment_intent_id field not found in DOM. Creating it dynamically.");
                let newField = document.createElement("input"); // ✅ Use a new variable
                newField.type = "hidden";
                newField.id = "payment_intent_id";
                document.body.appendChild(newField);
                paymentIntentField = newField; // ✅ Assign the newly created element
            }
            
paymentIntentField.value = result.client_secret;
            await checkPaymentStatus(result.client_secret, statusText);
        }
    } catch (error) {
        console.error("❌ Network error:", error);
        statusText.innerText = "⚠️ Payment may have been successful. Please check Stripe.";
    }
}
// ✅ Cancel Transaction on POS
async function cancelTransaction() {
    const statusText = document.getElementById("cancel_status");
    if (!statusText) {
        console.error("❌ cancel_status element not found in the DOM.");
        return;
    }
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
