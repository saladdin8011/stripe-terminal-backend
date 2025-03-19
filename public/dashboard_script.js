document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("startPayment").addEventListener("click", async function () {
        const readerId = document.getElementById("reader_id").value;
        const amount = document.getElementById("amount").value;
        const statusText = document.getElementById("status");

        if (!readerId || !amount) {
            statusText.innerText = "Please select a reader and enter an amount.";
            return;
        }

        statusText.innerText = "Processing payment...";

        try {
            const response = await fetch("/initiate_payment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": "your_secure_api_key_here"
                },
                body: JSON.stringify({ reader_id: readerId, amount: amount * 100 }) // Convert to pence
            });

            const result = await response.json();
            if (result.error) {
                statusText.innerText = "Error: " + result.error;
            } else {
                statusText.innerText = "Payment request sent to terminal!";
            }
        } catch (error) {
            statusText.innerText = "Network error. Please try again.";
        }
    });
});
