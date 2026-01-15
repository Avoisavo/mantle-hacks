'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { SessionProvider } from 'next-auth/react';
import { config } from '@/lib/wagmi';
import { useState } from 'react';
import '@rainbow-me/rainbowkit/styles.css';

export function Providers({ 
    children, 
}: { 
    children: React.ReactNode; 
}) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <SessionProvider>
                    <RainbowKitProvider
                        theme={darkTheme({
                            accentColor: '#ec4899',
                            accentColorForeground: 'white',
                            borderRadius: 'large',
                            fontStack: 'system',
                        })}
                    >
                        {children}
                    </RainbowKitProvider>
                </SessionProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
