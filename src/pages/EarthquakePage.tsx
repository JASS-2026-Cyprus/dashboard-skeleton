export default function EarthquakePage() {
  return (
    <iframe
      src="/earthquake.html"
      style={{
        width: '100%',
        height: 'calc(100vh - 2rem)',
        border: 'none',
        borderRadius: '12px',
      }}
      title="Earthquake Monitoring"
    />
  );
}
