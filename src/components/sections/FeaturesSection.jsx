'use client';

export default function FeaturesSection() {
  return (
    <div className="bg-white py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
        <h2 className="text-center text-lg sm:text-xl font-semibold text-tufts-blue"> <span>{'{ '}</span>
          Connect globally 
          <span>{' }'}</span>
         </h2>
         <p className="mx-auto mt-6 sm:mt-12 max-w-4xl text-center text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-semibold tracking-tight text-eerie-black">
          Everything you need for global connectivity
        </p>
        
        <div className="mt-8 sm:mt-10 lg:mt-16 grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
          {/* Global Coverage - Large left card */}
          <div className="relative lg:row-span-2">
            <div className="absolute inset-px rounded-lg bg-white lg:rounded-l-[2rem]"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(0.75rem+1px)] lg:rounded-l-[calc(2rem+1px)]">
              <div className="px-6 pt-6 pb-3 sm:px-8 sm:pt-8 lg:px-10 lg:pt-10 sm:pb-0">
                <p className="mt-2 text-base sm:text-lg font-medium tracking-tight text-eerie-black text-center lg:text-left">
                  Global Coverage
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-eerie-black text-center lg:text-left">
                  Stay connected in 200+ countries with our extensive eSIM network coverage worldwide.
                </p>
              </div>
              <div className="relative min-h-[20rem] sm:min-h-[24rem] lg:min-h-[30rem] w-full grow max-lg:mx-auto max-lg:max-w-sm">
                <div className="absolute inset-x-4 sm:inset-x-6 lg:inset-x-10 top-6 sm:top-8 lg:top-10 bottom-0 overflow-hidden rounded-t-[12cqw]"
                     style={{
                       background: 'linear-gradient(to right, var(--cobalt-blue), var(--jordy-blue))',
                       padding: '2cqw 2cqw 0 2cqw'
                     }}>
                  <div className="w-full h-full bg-white rounded-t-[10cqw] flex items-center justify-center relative overflow-hidden">
                    <div className="text-center z-10">
                      <div className="text-4xl mb-4 mx-auto">
                        <img 
                          src="/images/frontend/home/361053945_fb50482a-76fc-47ca-82b4-9fd33e920ad6.svg" 
                          alt="World Globe" 
                          className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 mx-auto"
                        />
                      </div>
                      <div className="text-eerie-black text-base sm:text-lg font-semibold">200+ Countries</div>
                      <div className="text-eerie-black text-sm opacity-90">Worldwide Coverage</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow-sm ring-1 ring-black/5 lg:rounded-l-[2rem]"></div>
          </div>

          {/* Instant Activation - Top right */}
          <div className="relative max-lg:row-start-1">
            <div className="absolute inset-px rounded-lg bg-white max-lg:rounded-t-[2rem]"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(0.75rem+1px)] max-lg:rounded-t-[calc(2rem+1px)]">
              <div className="px-6 pt-6 sm:px-8 sm:pt-8 lg:px-10 lg:pt-10">
                <p className="mt-2 text-base sm:text-lg font-medium tracking-tight text-gray-950 text-center lg:text-left">
                  Instant Activation
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-gray-600 text-center lg:text-left">
                  Get connected immediately with our QR code activation. No waiting, no delays.
                </p>
              </div>
              <div className="flex flex-1 items-center justify-center px-6 pt-6 pb-8 sm:px-8 lg:px-10 lg:pt-10 lg:pb-2">
                <div className="w-full max-w-xs lg:max-w-none">
                  <div className="bg-white rounded-xl p-4 sm:p-6 text-center">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 mx-auto mb-3 sm:mb-4 bg-white rounded-lg flex items-center justify-center">
                       <img 
                         src="/images/frontend/home/1200px-QR_Code_Example.svg.png" 
                         alt="QR Code Example" 
                         className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32"
                       />
                      </div>
                    <div className="text-cool-black text-xs sm:text-sm font-medium">✓ Ready in seconds</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow-sm ring-1 ring-black/5 max-lg:rounded-t-[2rem]"></div>
          </div>

          {/* Secure Payment - Bottom middle */}
          <div className="relative max-lg:row-start-3 lg:col-start-2 lg:row-start-2">
            <div className="absolute inset-px rounded-lg bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(0.75rem+1px)]">
              <div className="px-6 pt-6 sm:px-8 sm:pt-8 lg:px-10 lg:pt-10">
                <p className="mt-2 text-base sm:text-lg font-medium tracking-tight text-gray-950 text-center lg:text-left">
                  Secure Payment
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-gray-600 text-center lg:text-left">
                  256-bit SSL encryption and multiple payment options for your security.
                </p>
              </div>
              <div className="flex flex-1 items-center py-6 lg:pb-2 justify-center">
                {/* Payment Icons - Mobile Responsive */}
                <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap justify-center gap-2">
                  <img 
                    src="/images/frontend/home/visa.png" 
                    alt="Visa" 
                    className="h-8 sm:h-10 lg:h-12 w-auto"
                  />
                  <img 
                    src="/images/frontend/home/card.png" 
                    alt="Mastercard" 
                    className="h-8 sm:h-10 lg:h-12 w-auto"
                  />
                  <img 
                    src="/images/frontend/home/paypal.png" 
                    alt="PayPal" 
                    className="h-8 sm:h-10 lg:h-12 w-auto"
                  />
                  <img 
                    src="/images/frontend/home/apple-pay.png" 
                    alt="Apple Pay" 
                    className="h-8 sm:h-10 lg:h-12 w-auto"
                  />
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow-sm ring-1 ring-black/5"></div>
          </div>

          {/* Device Compatibility - Large right card */}
          <div className="relative lg:row-span-2">
            <div className="absolute inset-px rounded-lg bg-white max-lg:rounded-b-[2rem] lg:rounded-r-[2rem]"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(0.75rem+1px)] max-lg:rounded-b-[calc(2rem+1px)] lg:rounded-r-[calc(2rem+1px)]">
              <div className="px-6 pt-6 pb-3 sm:px-8 sm:pt-8 lg:px-10 lg:pt-10 sm:pb-0">
                <p className="mt-2 text-base sm:text-lg font-medium tracking-tight text-gray-950 text-center lg:text-left">
                  Device Compatibility
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-gray-600 text-center lg:text-left">
                  Works with all modern smartphones and tablets that support eSIM technology.
                </p>
              </div>
              <div className="relative min-h-[20rem] sm:min-h-[24rem] lg:min-h-[30rem] w-full grow">
                <div className="absolute top-6 sm:top-8 lg:top-10 right-0 bottom-0 left-4 sm:left-6 lg:left-10 overflow-hidden rounded-tl-xl bg-gray-900 shadow-2xl ring-1 ring-white/10">
                  <div className="flex bg-gray-800 ring-1 ring-white/5">
                    <div className="-mb-px flex text-xs sm:text-sm/6 font-medium text-gray-400">
                      <div className="border-r border-b border-r-white/10 border-b-white/20 bg-white/5 px-2 sm:px-4 py-1 sm:py-2 text-white">
                        Devices.jsx
                      </div>
                      <div className="border-r border-alice-blue/10 px-2 sm:px-4 py-1 sm:py-2">Settings.jsx</div>
                    </div>
                  </div>
                  <div className="px-3 sm:px-6 pt-3 sm:pt-6 pb-8 sm:pb-14 space-y-2 sm:space-y-4">
                    <div className="text-jordy-blue text-xs sm:text-xs lg:text-sm font-mono">
                      <div className="text-jordy-blue">// Device Requirements</div>
                      <div className="mt-1 sm:mt-2">
                        <span className="text-tufts-blue">const</span> devices = &#123;
                      </div>
                      <div className="ml-2 sm:ml-4 space-y-1">  
                       <div><span className="text-alice-blue">"eSIM Compatible"</span>: <span className="text-alice-blue">"True"</span>,</div>
                        <div><span className="text-alice-blue">"Operating System"</span>: <span className="text-alice-blue">"Android 12+, iOS 15+"</span>,</div>
                      </div>
                      <div>&#125;;</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow-sm ring-1 ring-black/5 max-lg:rounded-b-[2rem] lg:rounded-r-[2rem]"></div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
