import { NextResponse } from 'next/server';

// Domain to language mapping
const domainLanguageMap = {
  'ru.romajet.net': 'ru',
  'esim.romajet.net': 'en',
  'www.romajet.net': 'en',
  'romajet.net': 'en',
  // Add more domains as needed
  'ar.romajet.net': 'ar',
  'he.romajet.net': 'he',
  'de.romajet.net': 'de',
  'fr.romajet.net': 'fr',
  'es.romajet.net': 'es',
};

const supportedLanguageCodes = ['en', 'es', 'fr', 'de', 'ar', 'he', 'ru'];

function detectLanguageFromDomain(hostname) {
  if (!hostname) return null;
  
  // Remove www. prefix if present for matching
  const cleanHostname = hostname.replace(/^www\./, '');
  
  // Check direct match first
  if (domainLanguageMap[hostname]) {
    return domainLanguageMap[hostname];
  }
  
  // Check cleaned hostname
  if (domainLanguageMap[cleanHostname]) {
    return domainLanguageMap[cleanHostname];
  }
  
  // Extract subdomain and check if it's a language code
  const subdomain = hostname.split('.')[0];
  if (supportedLanguageCodes.includes(subdomain)) {
    return subdomain;
  }
  
  return null;
}

// Simplified middleware - no redirects to avoid chunk loading issues
export function middleware(request) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // Detect language from domain first
  const domainLanguage = detectLanguageFromDomain(hostname);
  
  // Then check URL path for language override
  const pathLanguage = pathname.startsWith('/he') ? 'he' :
                      pathname.startsWith('/ar') ? 'ar' :
                      pathname.startsWith('/ru') ? 'ru' :
                      pathname.startsWith('/de') ? 'de' :
                      pathname.startsWith('/fr') ? 'fr' :
                      pathname.startsWith('/es') ? 'es' : null;
  
  // If domain has a language and we're on the root path, redirect to language-specific path
  if (domainLanguage && domainLanguage !== 'en' && !pathLanguage) {
    const url = request.nextUrl.clone();
    url.pathname = `/${domainLanguage}${pathname}`;
    return NextResponse.redirect(url);
  }
  
  // Add pathname to headers for language detection in server components
  const response = NextResponse.next();
  response.headers.set('x-pathname', pathname);
  
  // Priority: path language > domain language > default 'en'
  const language = pathLanguage || domainLanguage || 'en';
  
  response.headers.set('x-language', language);
  response.headers.set('x-domain', hostname);
  response.headers.set('x-domain-language', domainLanguage || 'none');
  
  return response;
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, static files)
    '/((?!_next|api|favicon.ico|manifest.json|robots.txt|sitemap.xml|.*\\.).*)',
  ],
};
