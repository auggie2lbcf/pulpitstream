import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

export const runtime = 'edge';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-between bg-background px-4 py-8 sm:py-12 text-foreground">
      <div className="flex w-full max-w-2xl flex-col items-center justify-center text-center">
        <FileQuestion
          className="mb-6 h-20 w-20 text-primary sm:h-28 sm:w-28"
          strokeWidth={1.5}
        />

        <h1 className="mb-3 text-5xl font-extrabold tracking-tight text-primary sm:text-6xl md:text-7xl">
          Oops! Page Not Found
        </h1>
        <p className="mb-2 text-lg text-muted-foreground sm:text-xl">
          It seems like the page you're looking for isn't here.
        </p>
        <p className="mb-8 max-w-lg text-base text-muted-foreground/80 sm:text-lg">
          Don't worry, it happens! The page might have been moved, deleted, or perhaps there was a small typo in the URL you entered. Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-md transition-all duration-150 ease-in-out hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95"
          >
            <Home className="mr-2 h-5 w-5" />
            Go to Homepage
          </Link>
        </div>

        <div className="mt-12 text-sm text-muted-foreground">
          <p>If you believe this is an error, please feel free to <Link href="/contact" className="font-medium text-primary hover:underline">contact us</Link>.</p>
          <p className="mt-1">Error Code: 404</p>
        </div>
      </div>
    </div>
  );
}