/**
 * Platform detection utility
 * Detects user's platform and returns appropriate redirect information
 */

export const detectPlatform = () => {
  if (typeof window === 'undefined') {
    return { platform: 'unknown', isMobile: false };
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  
  // Detect Android
  if (userAgent.includes('android')) {
    return {
      platform: 'android',
      isMobile: true,
      downloadUrl: 'https://play.google.com/store/apps/details?id=your.app.package',
      downloadText: 'Download for Android'
    };
  }
  
  // Detect iOS (iPhone, iPad, iPod)
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return {
      platform: 'ios',
      isMobile: true,
      downloadUrl: 'https://apps.apple.com/app/your-app-name/id123456789',
      downloadText: 'Download for iOS'
    };
  }
  
  // Detect Windows
  if (userAgent.includes('windows')) {
    return {
      platform: 'windows',
      isMobile: false,
      downloadUrl: null,
      downloadText: 'Desktop User - Can buy eSIM directly'
    };
  }
  
  // Detect macOS
  if (userAgent.includes('mac')) {
    return {
      platform: 'macos',
      isMobile: false,
      downloadUrl: null,
      downloadText: 'Desktop User - Can buy eSIM directly'
    };
  }
  
  // Detect Linux
  if (userAgent.includes('linux')) {
    return {
      platform: 'linux',
      isMobile: false,
      downloadUrl: null,
      downloadText: 'Desktop User - Can buy eSIM directly'
    };
  }
  
  // Default fallback
  return {
    platform: 'unknown',
    isMobile: false,
    downloadUrl: null,
    downloadText: 'Download App'
  };
};

/**
 * Check if user should be redirected to download app
 * Returns true for mobile users, false for desktop users
 */
export const shouldRedirectToDownload = () => {
  const { isMobile } = detectPlatform();
  return isMobile;
};

/**
 * Get platform-specific redirect information
 */
export const getPlatformRedirectInfo = () => {
  return detectPlatform();
};
