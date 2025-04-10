'use client';

import { useEffect, useState } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
}

/**
 * ClientOnly renders children only on the client side.
 * This helps prevent hydration errors when server rendering
 * components that use browser-only APIs.
 */
export default function ClientOnly({ children }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Render nothing on the server side or during hydration
  }

  return <>{children}</>;
} 