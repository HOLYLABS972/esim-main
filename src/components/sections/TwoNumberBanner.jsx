'use client';

export default function TwoNumberBanner() {
  return (
    <section className="bg-gradient-to-r from-tufts-blue to-cobalt-blue py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Text */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-block bg-white/20 rounded-full px-3 py-1 text-xs font-semibold text-white uppercase tracking-wider mb-4">
              New from RoamJet
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Need a Phone Number Abroad?
            </h2>
            <p className="text-white/90 text-base sm:text-lg mb-2">
              Get a virtual US, Canadian, or Israeli number with <strong>Roamjet&nbsp;–&nbsp;2Number</strong>. 
              Make VoIP calls, send SMS, and keep your personal number private.
            </p>
            <p className="text-white/70 text-sm">
              Pair it with a RoamJet eSIM for the ultimate travel combo — data + voice on one device.
            </p>
          </div>

          {/* CTA */}
          <div className="flex-shrink-0 flex flex-col items-center gap-3">
            <a
              href="https://apps.apple.com/us/app/roamjet-2number/id6756972555"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-tufts-blue font-semibold rounded-xl px-6 py-3 hover:bg-gray-100 transition-colors shadow-lg"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              App Store
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.theholylabs.easycall"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-tufts-blue font-semibold rounded-xl px-6 py-3 hover:bg-gray-100 transition-colors shadow-lg"
            >
              <svg className="w-6 h-6" viewBox="0 0 512 512" fill="currentColor">
                <path d="M48 59.49v393a17 17 0 0 0 27.29 13.5l347.42-196.5a17 17 0 0 0 0-30l-347.42-196.5A17 17 0 0 0 48 59.49z"/>
              </svg>
              Google Play
            </a>
            <span className="text-white/60 text-xs">Free · iOS & Android</span>
          </div>
        </div>
      </div>
    </section>
  );
}
