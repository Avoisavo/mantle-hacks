export const metadata = {
  title: 'Mantle Hacks',
  description: 'Mantle Hacks Application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
