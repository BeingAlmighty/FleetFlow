"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.workbox !== undefined
    ) {
      const registerSW = async () => {
        try {
          await navigator.serviceWorker.register("/sw.js");
          console.log("Service Worker registered");
        } catch (err) {
          console.error("Service Worker registration failed:", err);
        }
      };
      registerSW();
    } else if (typeof window !== "undefined" && "serviceWorker" in navigator) {
       navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
