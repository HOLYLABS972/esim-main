'use client';


export default function HeroSection() {
  const scrollToAppLinks = () => {
    const appLinksSection = document.querySelector('[id="AppLinksSection"]');
    if (appLinksSection) {
      appLinksSection.scrollIntoView({ behavior: 'smooth' });
    }
  };
  const scrollToPlans = () => {
    document.getElementById('sections/PlansSection')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-white">
      <div className="relative isolate px-6 pt-14 lg:px-8">
        {/* Top Gradient Blob */}
        <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div 
            style={{ 
              clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              background: 'linear-gradient(to top right, #1A5798, #93BFEE)',
            }} 
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] opacity-40 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          ></div>
        </div>

        <div className="mx-auto max-w-5xl py-16 sm:py-32 lg:py-56">
          {/* Announcement Banner */}
          <div className="mb-6 sm:mb-8 flex justify-center">
            <div className="relative rounded-full px-3 py-1 text-xs sm:text-sm/6 text-gray-600 ring-1 ring-jordy-blue/30 hover:ring-tufts-blue/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-cobalt-blue">
              Now available in 200+ countries worldwide. 
            </div>
          </div>

          {/* Main Content */}  
          
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold text-balance text-gray-600 relative">
              {/* Mobile Layout */}
              <div className="block sm:hidden space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-eerie-black font-semibold">Stay connected</span>
                  <span className="inline-block transform -rotate-12 pointer-events-none">
                    <div className="w-10 h-10 bg-white border-2 border-cobalt-blue rounded-lg shadow-lg flex items-center justify-center">
                      <img src="/images/logo_icon/sx.png" alt="Globe" className="w-8 h-8"  />
                    </div>
                  </span> 
                </div>
                <div>no matter where you are</div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-eerie-black font-semibold">with</span>
                  <div className="w-10 h-10 bg-alice-blue border-2 border-alice-blue rounded-xl shadow-lg flex items-center justify-center rotate-6">
                    <img src="/images/logo_icon/ioslogo.png" alt="iOS Logo" className="w-8 h-8 rounded-lg" />
                  </div>
                  <span className="text-eerie-black font-semibold">Roam<span className="text-cobalt-blue font-semibold">Jet</span></span>
                </div>
                
              </div>
              
              {/* Desktop Layout */}
              <div className="hidden sm:flex flex-wrap items-center justify-center gap-3 lg:gap-4">
                <span>
                  <span className="text-eerie-black font-semibold">Stay connected </span> 
                  <span className="inline-block transform -rotate-12 pointer-events-none mr-2">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white border-3 lg:border-4 border-cobalt-blue rounded-xl shadow-lg shadow-cool-black flex items-center justify-center">
                      <img src="/images/logo_icon/sx.png" alt="Globe" className="w-10 h-10 lg:w-12 lg:h-12" />
                    </div>
                  </span> 
                  no matter 
                </span>
                <span>where you are <span className="text-eerie-black font-semibold">with</span></span>
                
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-alice-blue border-3 lg:border-4 border-alice-blue rounded-2xl shadow-lg shadow-cobalt-blue flex items-center justify-center rotate-6">
                  <img src="/images/logo_icon/ioslogo.png" alt="iOS Logo" className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl" />
                </div>
                  
                <span className="text-eerie-black font-semibold">Roam<span className="text-cobalt-blue font-semibold">Jet</span></span>
              </div>
            </h1>
              
            <p className="mt-6 sm:mt-8 text-base sm:text-lg lg:text-xl font-medium text-pretty text-gray-600 px-4 sm:px-0">
              Get instant mobile data in <span className="text-cobalt-blue font-bold">200+ countries.</span>  No physical SIM needed. 
              Activate anywhere, anytime with our reliable global eSIM network.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6 px-4 sm:px-0">
              <button
                onClick={scrollToAppLinks}
                className="btn-primary w-full sm:w-auto"
              >
                Download App
              </button>
              <a href="#how-it-works" className="text-sm sm:text-sm/6 font-semibold text-gray-600 hover:text-tufts-blue transition-colors">
                Learn more 
              </a>
            </div>
          </div>

          
        </div>

        {/* Bottom Gradient Blob */}
        <div aria-hidden="true" className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
          <div 
            style={{ 
              clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              background: 'linear-gradient(to top right, #1A5798, #93BFEE)',
              boxShadow: '0px 4px 16px rgba(70, 139, 230, 0.2)',
            }} 
            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
          ></div>
        </div>
      </div>
    </div>
  );
}