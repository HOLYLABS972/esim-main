export const metadata = {
  title: 'CodeCanyon eSIM Plans | RoamJet',
  description: 'Stay connected no matter where you are with RoamJet eSIM plans',
  robots: {
    index: false,
    follow: false,
  },
}

export default function CodeCanyonLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#468BE6" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/images/logo_icon/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/logo_icon/ioslogo.png" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}










