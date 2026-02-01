export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Clawtrics - OpenClaw Metrics</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ 
        margin: 0, 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#0a0a0a',
        color: '#fafafa',
        minHeight: '100vh',
      }}>
        {children}
      </body>
    </html>
  );
}
