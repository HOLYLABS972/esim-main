// Hardcoded app store links for RoamJet
export const appStoreLinks = {
  ios: 'https://apps.apple.com/us/app/roamjet/id6751737433',
  android: 'https://play.google.com/store/apps/details?id=com.theholylabs.esim'
};

// Helper function to get app store link based on platform
export const getAppStoreLink = (platform) => {
  switch (platform.toLowerCase()) {
    case 'ios':
    case 'iphone':
    case 'ipad':
      return appStoreLinks.ios;
    case 'android':
      return appStoreLinks.android;
    default:
      return null;
  }
};

// Helper function to detect platform and return appropriate link
export const getPlatformAppStoreLink = () => {
  if (typeof window === 'undefined') return null;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return appStoreLinks.ios;
  } else if (/android/.test(userAgent)) {
    return appStoreLinks.android;
  }
  
  return null;
};
