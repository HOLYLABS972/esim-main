// Simplified middleware - no redirects to avoid chunk loading issues
export function middleware(request) {
  // Just pass through for now to avoid redirect issues
  return;
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next|api|favicon.ico).*)',
  ],
};
