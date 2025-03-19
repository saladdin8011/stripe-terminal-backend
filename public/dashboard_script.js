<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stripe Terminal Dashboard</title>
    <link rel="stylesheet" href=dashboard_styles.css"> <!-- ✅ Keep CSS -->
    <script defer src="dashboard_script.js"></script>
</head>
<body>
    <h1>Stripe Terminal Dashboard</h1>
    
    <h2>Process Payment</h2>
    <label for="amount">Amount (£):</label>
    <input type="number" id="amount" placeholder="Enter amount">
    <label for="reader_id">Reader ID:</label>
    <input type="text" id="reader_id" placeholder="Enter Reader ID">
    <button id="startPayment">Start Payment</button>
    <p id="payment_status"></p>
    
    <h2>Cancel Transaction on POS</h2>
    <label for="reader_id">Reader ID:</label>
    <input type="text" id="reader_id" placeholder="Enter Reader ID">
    <button id="cancelPayment">Cancel Transaction on POS</button>
    <p id="cancel_status"></p>
    
    <h2>Refund Payment</h2>
    <label for="refund_amount">Refund Amount (£):</label>
    <input type="number" id="refund_amount" placeholder="Enter Refund Amount (optional)">
    <button id="refundPayment">Refund Payment</button>
    <p id="refund_status"></p>
</body>
</html>