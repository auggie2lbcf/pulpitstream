// This file defines the main page component for the coming soon page.
// It is a simple functional component using TypeScript and Tailwind CSS for styling.

import React from 'react';

// Define the Home component, which serves as the main page.
export default function Hero() {
  return (
    <>
      <div className="flex flex-col items-center justify-center text-center bg-amber-50 p-8 rounded-none shadow-md border border-amber-800 max-w-lg w-full">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-amber-950">
          Awaiting the Appointed Time
        </h1>
        <p className="text-lg md:text-xl mb-8 leading-relaxed text-amber-900">
          Behold, the work is in progress, diligently undertaken.
          This digital edifice, a testament to the endeavor, is not yet fully wrought.
          We beseech your patience as we labor towards its completion,
          that it may serve its intended purpose according to the Divine plan.
        </p>
        <p className="text-md md:text-lg text-amber-800 italic">
          Return hither at a later hour to witness its unveiling.
        </p>
      </div>
      <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
        <p>Pulpit Stream</p>
      </footer>
    </>
  );
};
