"use client"

import { SessionProvider } from "next-auth/react"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit"
import { config } from "@/lib/wagmi"
import "@rainbow-me/rainbowkit/styles.css"
import { useState } from "react"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <html lang="en">
      <head>
        <title>Mantle Hacks</title>
        <meta name="description" content="Mantle Hacks Application" />
      </head>
      <body>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <SessionProvider>
              <RainbowKitProvider
                theme={darkTheme({
                  accentColor: "#ec4899",
                  accentColorForeground: "white",
                  borderRadius: "large",
                  fontStack: "system",
                })}
              >
                {children}
              </RainbowKitProvider>
            </SessionProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  )
}
