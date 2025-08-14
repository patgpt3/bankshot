export default function SuccessPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Thank you!</h1>
      <p>Your order has been placed. A receipt will be emailed to you.</p>
      <p style={{ marginTop: 12 }}>
        <a href="/products" style={{ color: "#2563eb" }}>Continue shopping</a>
      </p>
    </main>
  );
}


