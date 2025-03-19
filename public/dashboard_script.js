document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("startPayment").addEventListener("click", async function () {
        const amount = document.getElementById("amount").value;
        const statusText = document.getElementById("payment_status");
        const readerId = "tmr_FT3XAL98tM0XmK"; // Replace with your actual Reader ID

        if (!amount) {
            statusText.innerText = "❌ Please enter an amount.";
            return;
        }

        statusText.innerText = "⌛ Processing payment...";

        try {
            const response = await fetch("/create_payment_intent", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ reader_id: readerId, amount: amount * 100, currency: "GBP" }) // Convert to pence
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
    });

    document.getElementById("refundPayment").addEventListener("click", async function () {
        const paymentIntentId = document.getElementById("payment_intent_id").value;
        const refundAmount = document.getElementById("refund_amount").value;
        const statusText = document.getElementById("refund_status");

        if (!paymentIntentId) {
            statusText.innerText = "❌ Please enter a Payment Intent ID.";
            return;
        }

        statusText.innerText = "⌛ Processing refund...";

        try {
            const response = await fetch("/refund_payment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    payment_intent_id: paymentIntentId,
                    amount: refundAmount ? refundAmount * 100 : null // Convert to pence if provided
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
    });
});
