// This file defines the main page component for the coming soon page.
// It is a simple functional component using TypeScript and Tailwind CSS for styling.

import React from 'react';

// Define the Home component, which serves as the main page.
const Home: React.FC = () => {
  return (
    // The main container for the page.
    // Using Tailwind classes for full viewport height, centering content,
    // setting a background color that resembles aged paper.
    // Using a muted text color.
    <div className="min-h-screen flex flex-col items-center justify-center bg-amber-100 text-amber-950 p-4 font-serif">

      {/* The main content area, centered and with padding */}
      {/* Using a slightly lighter background, subtle border, and shadow */}
      {/* Adding a subtle texture effect if possible with classes, or just focusing on colors/borders */}
      <main className="flex flex-col items-center justify-center text-center bg-amber-50 p-8 rounded-none shadow-md border border-amber-800 max-w-lg w-full">

        {/* Title of the page, styled with a larger, more 'solemn' serif font */}
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-amber-950">
          Awaiting the Appointed Time
        </h1>

        {/* Main message */}
        {/* Adjusting line height and text color for readability and tone */}
        <p className="text-lg md:text-xl mb-8 leading-relaxed text-amber-900">
          Behold, the work is in progress, diligently undertaken.
          This digital edifice, a testament to the endeavor, is not yet fully wrought.
          We beseech your patience as we labor towards its completion,
          that it may serve its intended purpose according to the Divine plan.
        </p>

        {/* Secondary message or instruction */}
        {/* Using a slightly lighter text color and italic style */}
        <p className="text-md md:text-lg text-amber-800 italic">
          Return hither at a later hour to witness its unveiling.
        </p>

      </main>

      {/* Optional: A simple footer */}
      {/* Using a smaller text size and muted color */}
      <footer className="mt-8 text-amber-900 text-sm">
        &copy; {new Date().getFullYear()} Pulip Stream. All Rights Reserved, By Grace Alone.
      </footer>
    </div>
  );
};

// Export the component as the default export for the page.
export default Home;
