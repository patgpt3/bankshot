export const dynamic = 'force-static';

export default function Page() {
  return (
    <main style={{ padding: 24 }}>
      <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, alignItems: 'center', padding: '48px 24px' }}>
        <div>
          <h1 style={{ fontSize: 48, lineHeight: 1.1, marginBottom: 12 }}>Bora Access Pass</h1>
          <p style={{ opacity: 0.8, fontSize: 18 }}>
            Preorder the Bora Access Pass. Site coming soon; secure your early spot now.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <a href="/cart/pay-with-wallet" style={{ display: 'inline-block', background: '#111827', color: '#fff', padding: '12px 16px', borderRadius: 10, textDecoration: 'none' }}>Preorder Access Pass</a>
            <a href="/products" style={{ display: 'inline-block', border: '1px solid rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: 10, textDecoration: 'none', color: 'inherit' }}>Explore Products</a>
          </div>
        </div>
        <div>
          <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: 16, border: '1px solid rgba(0,0,0,0.08)', background: 'linear-gradient(135deg, #0b1020, #111827)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700 }}>BORA  PREORDER</div>
        </div>
      </section>
    </main>
  );
}
