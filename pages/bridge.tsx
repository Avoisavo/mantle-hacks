import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Use dynamic import for bridge logic to avoid SSR issues with @mantleio/sdk
const BridgeContent = dynamic(() => import('../components/BridgeContent'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-emerald-500 text-xl font-mono animate-pulse">Initializing Bridge Engine...</div>
    </div>
  )
});

export default function BridgePage() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <BridgeContent />;
}
