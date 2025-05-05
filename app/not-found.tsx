import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const runtime = 'edge'; // Add this line

export default function NotFound() {
  return (
    <div>
      <h2>Not Found</h2>
      <p>Could not find requested resource</p>
      <Button variant="outline" className="mt-4">
        <Link href="/">Go back home</Link>
      </Button>
    </div>
  );
}