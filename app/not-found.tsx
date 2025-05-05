import Link from 'next/link';

export const runtime = 'edge'; // Add this line

export default function NotFound() {
  return (
    <div>
      <h2>Not Found</h2>
      <p>Could not find requested resource</p>
      <p>
        View <Link href="/protected">protected</Link>
      </p>
      <p>
        View <Link href="/">Home</Link>
      </p>
    </div>
  );
}