import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { LOGO_URL as DEFAULT_LOGO_URL } from '../constants';

const DEFAULT_WHATSAPP_TEMPLATE = `Hello LPMX, I want to order:

Product: {product_name}
Product ID: {product_id}
{size_info}
Price: NPR {price}

Link: {url}`;

interface SettingsContextType {
  logoUrl: string;
  whatsappTemplate: string;
}

const SettingsContext = createContext<SettingsContextType>({
  logoUrl: DEFAULT_LOGO_URL,
  whatsappTemplate: DEFAULT_WHATSAPP_TEMPLATE,
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO_URL);
  const [whatsappTemplate, setWhatsappTemplate] = useState(DEFAULT_WHATSAPP_TEMPLATE);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'site_settings'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.logo_url) {
          setLogoUrl(data.logo_url);
        }
        if (data.whatsapp_template) {
          setWhatsappTemplate(data.whatsapp_template);
        }
      }
    }, (error) => {
      console.error("Error fetching site settings:", error);
    });

    return () => unsubscribe();
  }, []);

  return (
    <SettingsContext.Provider value={{ logoUrl, whatsappTemplate }}>
      {children}
    </SettingsContext.Provider>
  );
};
