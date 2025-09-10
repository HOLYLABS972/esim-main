'use client';

const apps = [
  {
    id: 1,
    name: "iOS App",
    platform: "iPhone & iPad",
    icon: "/images/logo_icon/apple.svg",
    description: "Download our app for seamless eSIM management on your iOS devices.",
    features: ["Easy QR scanning", "Plan management", "Usage tracking", "24/7 support"],
    link: "#", // Replace with actual App Store link
    buttonText: "Download on App Store",
    badge: "/images/logo_icon/apple.svg" // Add badge image
  },
  {
    id: 2,
    name: "Android App",
    platform: "Android Devices",
    icon: "/images/logo_icon/android.png",
    description: "Get our app for convenient eSIM control on your Android device.",
    features: ["Quick activation", "Data monitoring", "Multiple profiles", "Offline access"],
    link: "#", // Replace with actual Play Store link
    buttonText: "Get it on Google Play",
    badge: "/images/logo_icon/android.png" // Add badge image
  }
];

export default function ActivationSection() {
  const scrollToPlans = () => {
    document.getElementById('esim-plans')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-eerie-black relative isolate overflow-hidden" id="how-it-works">
      {/* Continuous Gradient Background - Top */}
      <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div 
          style={{ 
            clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            background: 'linear-gradient(to top right, #E9F6FF, #1A5798)',
          }} 
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] opacity-40 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
        ></div>
      </div>

      {/* Continuous Gradient Background - Middle */}
      <div aria-hidden="true" className="absolute inset-x-0 top-[20%] -z-10 transform-gpu overflow-hidden blur-3xl">
        <div 
          style={{ 
            clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            background: 'linear-gradient(to bottom left, #1A5798, #E9F6FF)',
          }} 
          className="relative right-[calc(50%-15rem)] aspect-[1155/678] w-[50rem] -translate-x-1/2 rotate-[-15deg] opacity-35 sm:right-[calc(50%-40rem)] sm:w-[80rem]"
        ></div>
      </div>

      {/* Continuous Gradient Background - Lower Middle */}
      <div aria-hidden="true" className="absolute inset-x-0 top-[60%] -z-10 transform-gpu overflow-hidden blur-3xl">
        <div 
          style={{ 
            clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            background: 'linear-gradient(to top left, #E9F6FF, #1A5798)',
          }} 
          className="relative right-[calc(50%-10rem)] aspect-[1155/678] w-[55rem] -translate-x-1/2 rotate-[15deg] opacity-40 sm:right-[calc(50%-35rem)] sm:w-[85rem]"
        ></div>
      </div>

    

      

      <div className="relative isolate">
        {/* First Section - Activation Process */}
        

       
        {/* Second Section - App Downloads */}
        <div className="container mx-auto px-4 relative z-10 pt-16 pb-16" id="AppLinksSection">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-center text-xl font-semibold text-alice-blue"> <span>{'{ '}</span>
            Downloads 
          <span>{' }'}</span>
         </h2>
        <p className="mx-auto mt-12 max-w-4xl text-center text-4xl font-semibold tracking-tight text-white sm:text-5xl ">
          Our App Available for both iOS and Android devices.
        </p>

          {/* App Download Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20 mt-12 max-w-7xl mx-auto">
            {apps.map((app, index) => (
              <div
                key={app.id}
                className="bg-eerie-black rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 text-start"
              >
                {/* App Icon */}
                <div className="flex justify-start mb-6">
                  <div className="w-16 h-16 flex items-center justify-center">
                    <img 
                      src={app.icon} 
                      alt={`${app.name} icon`} 
                      className="w-14 h-14 object-contain"
                    />  
                  </div>
                </div>

                {/* App Platform */}
                <h3 className="text-2xl font-semibold text-white mb-4">
                  {app.platform}
                </h3>

                {/* App Description */}
                <p className="text-white mb-8 leading-relaxed">
                  {app.description}
                </p>

                {/* Download Button */}
                <a
                  href={app.link}
                  className="btn-secondary inline-block"
                >
                  {app.buttonText}
                </a>
              </div>
            ))}
          </div>
        </div>
          
        </div>
      </div>
      <div className="mx-auto max-w-7xl  pb-12">
       <h2 className="text-center text-xl font-semibold text-alice-blue"> <span>{'{ '}</span>
            Activation Process 
          <span>{' }'}</span>
         </h2>
          <div className="relative isolate overflow-hidden bg-eerie-black px-6 pt-8  sm:rounded-3xl sm:px-16 md:pt-12 lg:flex lg:gap-x-20 lg:px-24 lg:pt-0">
            
            {/* Content Section */}
            
            <div className="mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-16 lg:text-left">
              <h3 className="mt-6 text-xl text-pretty text-white">
                Follow these simple steps to activate your eSIM and get connected instantly. 
              </h3>
              
              {/* Step-by-step Instructions */}
              <div className="mt-12 space-y-8">
                {/* Step 1 */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-cobalt-blue rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">1</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Purchase Your Plan</h3>
                    <p className="text-gray-300">Choose your destination and data plan. Complete your purchase and receive QR code instantly.</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-cobalt-blue rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">2</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Access Device Settings</h3>
                    <p className="text-gray-300">
                      <strong className="text-white">iOS:</strong> Go to Settings → Cellular → Add Cellular Plan<br />
                      <strong className="text-white">Android:</strong> Go to Settings → Network & Internet → Mobile Network → Add Carrier
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-cobalt-blue rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">3</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Scan QR Code</h3>
                    <p className="text-gray-300">Use your device camera or photo library to scan the QR code. Your phone will automatically detect and process the eSIM profile.</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-cobalt-blue rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">✓</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">You're Connected!</h3>
                    <p className="text-gray-300">Your eSIM is now active and ready to use. Switch between your plans in your device settings anytime.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Image Section - Right Column */}
            <div className="relative mt-16 h-80 lg:mb-0">
              <div className="flex justify-end lg:justify-end">
                <div className="max-w-md lg:max-w-lg xl:max-w-xl">
                  <img 
                    src="/images/frontend/example.png" 
                    alt="eSIM Mobile App Interface" 
                    className="w-full h-auto rounded-lg shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}