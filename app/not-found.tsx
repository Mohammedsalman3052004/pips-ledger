import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="page">
      <h1>Not found</h1>
      <p className="muted">That page or trade doesn’t exist.</p>
      <Link href="/" className="btn btn-secondary">
        Back to the sheet
      </Link>
    </div>
  );
}
