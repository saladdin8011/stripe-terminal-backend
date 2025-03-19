document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("startPayment").addEventListener("click", initiatePayment);
    document.getElementById("refundPayment").addEventListener("click", processRefund);
    document.getElementById("cancelPayment").addEventListener("click", cancelTransaction); // ✅ New button event listener
});

// ✅ Cancel an Ongoing Transaction
async function cancelTransaction() {
    const paymentIntentId = document.getElementById("payment_intent_id").value;
    const readerId = document.getElementById("reader_id").value;
    const statusText = document.getElementById("cancel_status");

    if (!paymentIntentId || !readerId) {
        statusText.innerText = "❌ Payment Intent ID and Reader ID are required.";
        console.error("❌ Missing Payment Intent ID or Reader ID");
        return;
    }

    statusText.innerText = "⌛ Cancelling transaction...";

    try {
        const apiKey = await getApiKey();
        console.log("🔍 Sending Cancel Request:", { payment_intent_id: paymentIntentId, reader_id: readerId });

        const response = await fetch("/cancel_payment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey
            },
            body: JSON.stringify({
                payment_intent_id: paymentIntentId,
                reader_id: readerId
            })
        });

        const result = await response.json();
        if (result.error) {
            console.error("❌ Cancel Error:", result.error);
            statusText.innerText = "❌ Error: " + result.error;
        } else {
            statusText.innerText = `✅ Transaction Canceled Successfully`;
        }
    } catch (error) {
        console.error("❌ Network error:", error);
        statusText.innerText = "❌ Network error. Please try again.";
    }
}
