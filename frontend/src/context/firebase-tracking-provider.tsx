import { createContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Analytics } from 'firebase/analytics';
import { initFirebaseAnalytics, logEvent } from '@/lib/frontend/firebase-client-analytics';

export const FirebaseContext = createContext<Analytics | null>(null);

export const FirebaseTrackingProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    initFirebaseAnalytics().then(setAnalytics);
  }, []);

  useEffect(() => {
    if (!analytics) return;
    logEvent('page_view', {
      page_location: pathname,
      page_title: document?.title,
    });
  }, [pathname, analytics]);

  return (
    <FirebaseContext.Provider value={analytics}>
      {children}
    </FirebaseContext.Provider>
  );
};