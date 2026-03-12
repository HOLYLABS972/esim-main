import { NextResponse } from 'next/server';

const localeRewriteMap = {
  en: '',
  'en-US': '',
  'en-CA': '',
  ar: 'ar',
  'ar-SA': 'ar',
  de: 'de',
  'de-DE': 'de',
  es: 'es',
  'es-ES': 'es',
  fr: 'fr',
  'fr-FR': 'fr',
  'fr-CA': 'fr',
  he: 'he',
  pt: 'pt',
  'pt-BR': 'pt',
  ru: 'ru',
  tr: 'tr',
  ur: 'ur',
  zh: 'zh',
  'zh-Hans': 'zh',
  hi: 'hi',
  ja: 'ja',
  ko: 'ko',
  id: '',
  uk: '',
  vi: '',
};

function getRewrittenPath(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const [firstSegment, ...rest] = segments;
  if (!(firstSegment in localeRewriteMap)) return null;

  const mappedPrefix = localeRewriteMap[firstSegment];
  const restPath = rest.length ? `/${rest.join('/')}` : '';

  const rewrittenPath = mappedPrefix ? `/${mappedPrefix}${restPath}` : (restPath || '/');
  return rewrittenPath === pathname ? null : rewrittenPath;
}

export function middleware(request) {
  const pathname = request.nextUrl.pathname;
  const rewrittenPath = getRewrittenPath(pathname);

  let res;
  if (rewrittenPath) {
    const url = request.nextUrl.clone();
    url.pathname = rewrittenPath;
    res = NextResponse.rewrite(url);
  } else {
    res = NextResponse.next();
  }

  // So root layout can hide navbar/footer for /topup on the server (no client flash)
  res.headers.set('x-pathname', pathname);
  return res;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|images|locales).*)',
  ],
};
