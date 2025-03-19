// ✅ Ensure initiatePayment is defined before event listeners
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

// ✅ Define initiatePayment before it is called
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
        console.log("🔍 Reader ID in Payment Request:", readerId);

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
            
            // ✅ Ensure payment intent field exists before setting value
            if (paymentIntentField) {
                paymentIntentField.value = result.client_secret;
            } else {
                console.warn("⚠️ payment_intent_id field not found in DOM. Creating it dynamically.");
                const hiddenInput = document.createElement("input");
                hiddenInput.type = "hidden";
                hiddenInput.id = "payment_intent_id";
                hiddenInput.value = result.client_secret;
                document.body.appendChild(hiddenInput);
            }

            await checkPaymentStatus(result.client_secret, statusText);
        }
    } catch (error) {
        console.error("❌ Network error:", error);
        statusText.innerText = "⚠️ Payment may have been successful. Please check Stripe.";
    }
}
