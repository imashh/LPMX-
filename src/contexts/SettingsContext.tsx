import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { LOGO_URL as DEFAULT_LOGO_URL } from '../constants';

interface SettingsContextType {
  logoUrl: string;
}

const SettingsContext = createContext<SettingsContextType>({
  logoUrl: DEFAULT_LOGO_URL,
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO_URL);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'site_settings'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.logo_url) {
          setLogoUrl(data.logo_url);
        }
      }
    }, (error) => {
      console.error("Error fetching site settings:", error);
    });

    return () => unsubscribe();
  }, []);

  return (
    <SettingsContext.Provider value={{ logoUrl }}>
      {children}
    </SettingsContext.Provider>
  );
};
