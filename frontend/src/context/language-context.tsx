"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "te" | "kn";

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    "buyer_settings": "Buyer Settings",
    "dashboard": "Dashboard",
    "my_orders": "My Orders",
    "my_profile": "My Profile",
    "shipping_addresses": "Shipping Addresses",
    "my_wishlist": "My Wishlist",
    "security_settings": "Security & Settings",
    "welcome_back": "Welcome back",
    "recent_orders": "Recent Orders",
    "total_orders": "Total Orders",
    "total_spent": "Total Spent",
    "wishlist_items": "Wishlist Items",
    "save_changes": "Save Changes",
    "view_details": "View Details",
    "status": "Status",
    "date": "Date",
    "price": "Price",
    "action": "Action",
    "address": "Address",
    "add_new_address": "Add New Address",
    "language": "Language",
    "order_id": "Order ID",
    "items": "Items",
    "total": "Total",
    "full_name": "Full Name",
    "email_address": "Email Address",
    "phone_number": "Phone Number",
    "business_name": "Business Name",
    "update_profile": "Update Profile",
    "no_orders": "You have not placed any orders yet.",
    "no_wishlist": "Your wishlist is currently empty.",
    "no_addresses": "No shipping addresses saved yet.",
  },
  te: {
    "buyer_settings": "కొనుగోలుదారు సెట్టింగులు",
    "dashboard": "డ్యాష్‌బోర్డ్",
    "my_orders": "నా ఆర్డర్లు",
    "my_profile": "నా ప్రొఫైల్",
    "shipping_addresses": "షిప్పింగ్ చిరునామాలు",
    "my_wishlist": "నా కోరికల జాబితా",
    "security_settings": "భద్రత & సెట్టింగులు",
    "welcome_back": "మరలా స్వాగతం",
    "recent_orders": "ఇటీవలి ఆర్డర్లు",
    "total_orders": "మొత్తం ఆర్డర్లు",
    "total_spent": "మొత్తం ఖర్చు",
    "wishlist_items": "కోరికల జాబితా వస్తువులు",
    "save_changes": "మార్పులను సేవ్ చేయి",
    "view_details": "వివరాలను చూడు",
    "status": "స్థితి",
    "date": "తేదీ",
    "price": "ధర",
    "action": "చర్య",
    "address": "చిరునామా",
    "add_new_address": "కొత్త చిరునామాను జోడించు",
    "language": "భాష",
    "order_id": "ఆర్డర్ ఐడి",
    "items": "వస్తువులు",
    "total": "మొత్తం",
    "full_name": "పూర్తి పేరు",
    "email_address": "ఈమెయిల్ చిరునామా",
    "phone_number": "ఫోన్ నంబర్",
    "business_name": "వ్యాపార నామం",
    "update_profile": "ప్రొఫైల్ అప్‌డేట్ చేయి",
    "no_orders": "మీరు ఇంకా ఎటువంటి ఆర్డర్లు చేయలేదు.",
    "no_wishlist": "మీ కోరికల జాబితా ఖాళీగా ఉంది.",
    "no_addresses": "సేవ్ చేసిన షిప్పింగ్ చిరునామాలు లేవు.",
  },
  kn: {
    "buyer_settings": "ಖರೀದಿದಾರರ ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    "dashboard": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    "my_orders": "ನನ್ನ ಆರ್ಡರ್‌ಗಳು",
    "my_profile": "ನನ್ನ ಪ್ರೊಫೈಲ್",
    "shipping_addresses": "ಶಿಪ್ಪಿಂಗ್ ವಿಳಾಸಗಳು",
    "my_wishlist": "ನನ್ನ ವಿಶ್‌ಲಿಸ್ಟ್",
    "security_settings": "ಭದ್ರತೆ ಮತ್ತು ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    "welcome_back": "ಮರಳಿ ಸ್ವಾಗತ",
    "recent_orders": "ಇತ್ತೀಚಿನ ಆರ್ಡರ್‌ಗಳು",
    "total_orders": "ಒಟ್ಟು ಆರ್ಡರ್‌ಗಳು",
    "total_spent": "ಒಟ್ಟು ವೆಚ್ಚ",
    "wishlist_items": "ವಿಶ್‌ಲಿಸ್ಟ್ ಐಟಂಗಳು",
    "save_changes": "ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ",
    "view_details": "ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
    "status": "ಸ್ಥಿತಿ",
    "date": "ದಿನಾಂಕ",
    "price": "ಬೆಲೆ",
    "action": "ಕ್ರಮ",
    "address": "ವಿಳಾಸ",
    "add_new_address": "ಹೊಸ ವಿಳಾಸವನ್ನು ಸೇರಿಸಿ",
    "language": "ಭಾಷೆ",
    "order_id": "ಆರ್ಡರ್ ಐಡಿ",
    "items": "ಐಟಂಗಳು",
    "total": "ಒಟ್ಟು",
    "full_name": "ಪೂರ್ಣ ಹೆಸರು",
    "email_address": "ಇಮೇಲ್ ವಿಳಾಸ",
    "phone_number": "ಫೋನ್ ಸಂಖ್ಯೆ",
    "business_name": "ವ್ಯವಹಾರದ ಹೆಸರು",
    "update_profile": "ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಿ",
    "no_orders": "ನೀವು ಇನ್ನೂ ಯಾವುದೇ ಆರ್ಡರ್ ಮಾಡಿಲ್ಲ.",
    "no_wishlist": "ನಿಮ್ಮ ವಿಶ್‌ಲಿಸ್ಟ್ ಸದ್ಯ ಖಾಲಿಯಾಗಿದೆ.",
    "no_addresses": "ಯಾವುದೇ ಶಿಪ್ಪಿಂಗ್ ವಿಳಾಸಗಳನ್ನು ಉಳಿಸಿಲ್ಲ.",
  }
};

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("customer_lang") as Language;
    if (saved && (saved === "en" || saved === "te" || saved === "kn")) {
      setLanguageState(saved);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("customer_lang", lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations["en"][key] || key;
  };

  // Prevent flash with default language on SSR/hydration
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Return English fallback during SSG static page generation builds
    return {
      language: "en" as Language,
      setLanguage: () => {},
      t: (key: string) => {
        return translations["en"][key] || key;
      },
    };
  }
  return context;
}
