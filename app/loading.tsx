export default function Loading() {
  return (
    <div className="loading" role="status" aria-live="polite">
      <div className="topload" aria-hidden />
      <div className="spinner" aria-hidden />
      <span>Loading…</span>
    </div>
  );
}
