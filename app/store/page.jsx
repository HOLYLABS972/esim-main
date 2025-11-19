'use client';

import AiraloPackagesSection from '../../src/components/sections/AiraloPackagesSection';

export default function StorePage() {
  return (
    <div className="min-h-screen">
      {/* Airalo Packages Section with Tabs (Global, Regional, Countries) */}
      <AiraloPackagesSection />
    </div>
  );
}
