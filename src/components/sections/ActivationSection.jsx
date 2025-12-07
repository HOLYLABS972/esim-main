'use client';

import { useI18n } from '../../contexts/I18nContext';
import Image from 'next/image';
import { appStoreLinks } from '../../utils/appStoreLinks';

export default function ActivationSection() {
  const { t, isLoading: translationsLoading } = useI18n();
  
  // Use hardcoded app store links
  const appStoreLinksData = {
    iosUrl: appStoreLinks.ios,
    androidUrl: appStoreLinks.android
  };
  const loading = false;


  if (translationsLoading) {
    return (
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="animate-pulse space-y-12">
            <div className="text-center">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-eerie-black relative isolate overflow-hidden" id="how-it-works">
      {/* Continuous Gradient Background - Top */}
      <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div 
          style={{ 
            clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            background: 'linear-gradient(to top right, #F2F4F7, #7A5F4A)',
          }} 
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] opacity-40 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
        ></div>
      </div>

      {/* Continuous Gradient Background - Middle */}
      <div aria-hidden="true" className="absolute inset-x-0 top-[20%] -z-10 transform-gpu overflow-hidden blur-3xl">
        <div 
          style={{ 
            clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            background: 'linear-gradient(to bottom left, #7A5F4A, #F2F4F7)',
          }} 
          className="relative right-[calc(50%-15rem)] aspect-[1155/678] w-[50rem] -translate-x-1/2 rotate-[-15deg] opacity-35 sm:right-[calc(50%-40rem)] sm:w-[80rem]"
        ></div>
      </div>

      {/* Continuous Gradient Background - Lower Middle */}
      <div aria-hidden="true" className="absolute inset-x-0 top-[60%] -z-10 transform-gpu overflow-hidden blur-3xl">
        <div 
          style={{ 
            clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            background: 'linear-gradient(to top left, #F2F4F7, #7A5F4A)',
          }} 
          className="relative right-[calc(50%-10rem)] aspect-[1155/678] w-[55rem] -translate-x-1/2 rotate-[15deg] opacity-40 sm:right-[calc(50%-35rem)] sm:w-[85rem]"
        ></div>
      </div>

    

      

      <div className="relative isolate">
        {/* First Section - Activation Process */}
        

       
        {/* Second Section - App Downloads */}
        <div className="container mx-auto px-4 relative z-10 pt-16 pb-16" id="AppLinksSection">
          {/* Section Header */}
          <div className="text-center mb-16">
            <p className="mx-auto max-w-4xl text-center text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {t('activation.appAvailable')}
            </p>
          </div>

          {/* App Download Section with Phone Image */}
          <div className="max-w-6xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 lg:p-12 shadow-2xl">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                {/* Phone Image - Left Side */}
                <div className="flex justify-center lg:justify-start">
                  <div className="relative max-w-sm">
                    <Image
                      src="/images/logo_icon/phones.png"
                      alt="Mobile App on iPhone and Android"
                      width={400}
                      height={300}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
                
                {/* App Store Links - Right Side */}
                <div className="text-center lg:text-left space-y-6">
                  <h3 className="text-3xl font-semibold text-white mb-4">
                    {t('activation.downloadOurApp')}
                  </h3>
                  <p className="text-white/90 text-lg leading-relaxed mb-8">
                    {t('activation.appDescription')}
                  </p>
                  
                  {/* App Store Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    {loading ? (
                      <div className="text-white">{t('activation.loadingAppLinks')}</div>
                    ) : (
                      <>
                        {appStoreLinksData.iosUrl && (
                          <a
                            href={appStoreLinksData.iosUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary inline-flex items-center justify-center px-6 py-3"
                          >
                            <Image 
                              src="/images/logo_icon/apple.svg" 
                              alt="iOS" 
                              width={20}
                              height={20}
                              className="w-5 h-5 mr-2"
                            />
                            {t('activation.downloadForIOS')}
                          </a>
                        )}
                        {appStoreLinksData.androidUrl && (
                          <a
                            href={appStoreLinksData.androidUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary inline-flex items-center justify-center px-6 py-3"
                          >
                            <Image 
                              src="/images/logo_icon/android.png" 
                              alt="Android" 
                              width={20}
                              height={20}
                              className="w-5 h-5 mr-2"
                            />
                            {t('activation.downloadForAndroid')}
                          </a>
                        )}
                        {!appStoreLinksData.iosUrl && !appStoreLinksData.androidUrl && (
                          <div className="text-white/80">{t('activation.appLinksSoon')}</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}