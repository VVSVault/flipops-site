export default function TestMinimal() {
  return (
    <div style={{ padding: '50px', background: '#1a1a1a', color: 'white', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>✓ Basic Rendering Works</h1>
      <p style={{ fontSize: '24px', marginBottom: '10px' }}>If you see this, the issue is with client components.</p>
      <p style={{ fontSize: '18px', color: '#888' }}>This page has zero client-side JavaScript.</p>
      <p style={{ fontSize: '18px', color: '#888', marginTop: '20px' }}>
        Next step: Test production build locally
      </p>
    </div>
  );
}
