"use client";

import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { SessionProvider } from "next-auth/react";
import "@rainbow-me/rainbowkit/styles.css";
import { config } from "@/lib/wagmi";
import { useState } from "react";

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider session={pageProps.session}>
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: "#ec4899",
              accentColorForeground: "white",
              borderRadius: "large",
              fontStack: "system",
            })}
          >
            <Component {...pageProps} />
          </RainbowKitProvider>
        </SessionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
